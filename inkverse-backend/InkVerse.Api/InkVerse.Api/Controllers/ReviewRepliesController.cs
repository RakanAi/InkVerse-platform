using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.ReviewReply;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Controllers
{
    [Route("api")]
    [ApiController]
    public class ReviewRepliesController : ControllerBase
    {
        private readonly IReviewReplyService _service;

        public ReviewRepliesController(IReviewReplyService service)
        {
            _service = service;
        }

        // GET /api/reviews/{reviewId}/replies
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

        // POST /api/reviews/{reviewId}/replies
        [Authorize]
        [HttpPost("reviews/{reviewId:int}/replies")]
        public async Task<IActionResult> AddReply(int reviewId, [FromBody] ReviewReplyCreateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

            var created = await _service.AddReplyAsync(reviewId, userId, dto);
            if (created == null) return NotFound(new { message = "Review not found." });

            return Ok(created);
        }

        // PUT /api/replies/{replyId}
        [Authorize]
        [HttpPut("replies/{replyId:int}")]
        public async Task<IActionResult> UpdateReply(int replyId, [FromBody] ReviewReplyUpdateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

            var updated = await _service.UpdateReplyAsync(replyId, userId, dto);
            return updated == null ? NotFound() : Ok(updated);
        }

        // DELETE /api/replies/{replyId}
        [Authorize]
        [HttpDelete("replies/{replyId:int}")]
        public async Task<IActionResult> DeleteReply(int replyId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

            var ok = await _service.DeleteReplyAsync(replyId, userId);
            return ok ? NoContent() : NotFound();
        }

        // POST /api/replies/{replyId}/react
        [Authorize]
        [HttpPost("replies/{replyId:int}/react")]
        public async Task<IActionResult> ReactToReply(int replyId, [FromBody] ReviewReplyReactDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

            var type = (dto.ReactionType ?? "").Trim().ToLowerInvariant();

            var ok = await _service.ReactToReplyAsync(replyId, userId, type);

            return ok
                ? Ok(new { message = "Reaction recorded." })
                : BadRequest(new { message = "Invalid reaction." });
        }
    }
}
