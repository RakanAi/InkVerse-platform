using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.Review;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Controllers
{
    [Route("api")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;


        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        // GET: /api/books/{bookId}/reviews
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


        // POST: /api/books/{bookId}/reviews
        [Authorize]
        [HttpPost("books/{bookId}/reviews")]
        public async Task<IActionResult> AddReview(int bookId, [FromBody] ReviewCreateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _reviewService.AddOrUpdateReviewAsync(bookId, userId, dto);
            return Ok(result);
        }

        // PUT: /api/reviews/{id}
        [Authorize]
        [HttpPut("reviews/{id}")]
        public async Task<IActionResult> UpdateReview([FromRoute] int id, [FromBody] ReviewCreateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _reviewService.UpdateReviewAsync(id, userId, dto);
            return result == null ? NotFound() : Ok(result);
        }

        // DELETE: /api/reviews/{id}
        [Authorize]
        [HttpDelete("reviews/{id}")]
        public async Task<IActionResult> DeleteReview([FromRoute] int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var ok = await _reviewService.DeleteReviewAsync(id, userId);
            return ok ? NoContent() : NotFound();
        }

        // POST: /api/reviews/{id}/reaction?type=like/dislike
        [Authorize]
        [HttpPost("reviews/{reviewId:int}/react")]
        public async Task<IActionResult> React(int reviewId, [FromBody] ReviewReactDto dto)
        {
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


    }
}
