using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.ReviewReply;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Controllers
{
    [Route("api")]
    [ApiController]
    public class ReviewRepliesController : ControllerBase
    {
        private readonly IReviewReplyService _service;
        private readonly UserManager<AppUser> _userManager;

        public ReviewRepliesController(IReviewReplyService service, UserManager<AppUser> userManager)
        {
            _service = service;
            _userManager = userManager;
        }

        [AllowAnonymous]
        [HttpGet("reviews/{reviewId:int}/replies")]
        public async Task<IActionResult> GetReplies(int reviewId)
        {
            var userId = User.Identity?.IsAuthenticated == true
                ? User.FindFirstValue(ClaimTypes.NameIdentifier)
                : null;

            var result = await _service.GetRepliesForReviewAsync(reviewId, userId);
            return Ok(result);
        }

        [Authorize]
        [HttpPost("reviews/{reviewId:int}/replies")]
        public async Task<IActionResult> AddReply(int reviewId, [FromBody] ReviewReplyCreateDto dto)
        {
            var banCheck = await EnsureCanCommentAsync();
            if (banCheck != null) return banCheck;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var created = await _service.AddReplyAsync(reviewId, userId, dto);
            if (created == null) return NotFound(new { message = "Review not found." });

            return Ok(created);
        }

        [Authorize]
        [HttpPut("replies/{replyId:int}")]
        public async Task<IActionResult> UpdateReply(int replyId, [FromBody] ReviewReplyUpdateDto dto)
        {
            var banCheck = await EnsureCanCommentAsync();
            if (banCheck != null) return banCheck;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var updated = await _service.UpdateReplyAsync(replyId, userId, dto);
            return updated == null ? NotFound() : Ok(updated);
        }

        [Authorize]
        [HttpDelete("replies/{replyId:int}")]
        public async Task<IActionResult> DeleteReply(int replyId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var ok = await _service.DeleteReplyAsync(replyId, userId);
            return ok ? NoContent() : NotFound();
        }

        [Authorize]
        [HttpPost("replies/{replyId:int}/react")]
        public async Task<IActionResult> ReactToReply(int replyId, [FromBody] ReviewReplyReactDto dto)
        {
            var banCheck = await EnsureCanCommentAsync();
            if (banCheck != null) return banCheck;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var type = (dto.ReactionType ?? "").Trim().ToLowerInvariant();

            var ok = await _service.ReactToReplyAsync(replyId, userId, type);

            return ok
                ? Ok(new { message = "Reaction recorded." })
                : BadRequest(new { message = "Invalid reaction." });
        }

        private async Task<IActionResult?> EnsureCanCommentAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return Unauthorized();

            if (user.IsBlocked)
                return StatusCode(StatusCodes.Status403Forbidden, "Your account is blocked.");

            if (user.IsCommentBanned)
                return StatusCode(StatusCodes.Status403Forbidden, "You are banned from commenting.");

            return null;
        }
    }
}
