using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.Review;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Controllers
{
    [Route("api")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        private readonly UserManager<AppUser> _userManager;

        public ReviewsController(IReviewService reviewService, UserManager<AppUser> userManager)
        {
            _reviewService = reviewService;
            _userManager = userManager;
        }

        [AllowAnonymous]
        [HttpGet("books/{bookId}/reviews")]
        public async Task<IActionResult> GetReviews(int bookId)
        {
            var userId = User.Identity?.IsAuthenticated == true
                ? User.FindFirstValue(ClaimTypes.NameIdentifier)
                : null;

            var result = await _reviewService.GetReviewsForBookAsync(bookId, userId);
            return Ok(result);
        }

        [Authorize]
        [HttpPost("books/{bookId}/reviews")]
        public async Task<IActionResult> AddReview(int bookId, [FromBody] ReviewCreateDto dto)
        {
            var banCheck = await EnsureCanCommentAsync();
            if (banCheck != null) return banCheck;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _reviewService.AddOrUpdateReviewAsync(bookId, userId, dto);
            return Ok(result);
        }

        [Authorize]
        [HttpPut("reviews/{id}")]
        public async Task<IActionResult> UpdateReview([FromRoute] int id, [FromBody] ReviewCreateDto dto)
        {
            var banCheck = await EnsureCanCommentAsync();
            if (banCheck != null) return banCheck;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var result = await _reviewService.UpdateReviewAsync(id, userId, dto);
            return result == null ? NotFound() : Ok(result);
        }

        [Authorize]
        [HttpDelete("reviews/{id}")]
        public async Task<IActionResult> DeleteReview([FromRoute] int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
            var ok = await _reviewService.DeleteReviewAsync(id, userId);
            return ok ? NoContent() : NotFound();
        }

        [Authorize]
        [HttpPost("reviews/{reviewId:int}/react")]
        public async Task<IActionResult> React(int reviewId, [FromBody] ReviewReactDto dto)
        {
            var banCheck = await EnsureCanCommentAsync();
            if (banCheck != null) return banCheck;

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return Unauthorized();

            var type = (dto.ReactionType ?? "").Trim().ToLowerInvariant();
            var ok = await _reviewService.ReactToReviewAsync(reviewId, userId, type);

            return ok
                ? Ok(new { message = "Reaction recorded." })
                : BadRequest(new { message = "Invalid or duplicate reaction." });
        }

        [AllowAnonymous]
        [HttpGet("reviews/recent")]
        public async Task<IActionResult> Recent([FromQuery] int take = 10)
        {
            var result = await _reviewService.GetRecentReviewsAsync(take);
            return Ok(result);
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

        [HttpGet("reviews/for-ai")]
        public async Task<IActionResult> GetForAi([FromQuery] int take = 20)
        {
            var result = await _reviewService.GetLatestReviewsForAiAsync(take);
            return Ok(result);
        }

        [HttpPost("reviews/{id:int}/analysis")]
        public async Task<IActionResult> SaveAnalysis(int id, [FromBody] ReviewAnalysisDto dto)
        {
            var ok = await _reviewService.SaveAiAnalysisAsync(id, dto);
            return ok ? Ok(new { message = "Analysis saved." }) : NotFound();
        }
    }
}
