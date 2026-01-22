using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.Services.InterFace;

[ApiController]
[Route("api")]
public class MyReviewsController : ControllerBase
{
    private readonly IMyReviewService _service;

    public MyReviewsController(IMyReviewService service)
    {
        _service = service;
    }

    [Authorize]
    [HttpGet("me/reviews")]
    public async Task<IActionResult> GetMyReviews()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var reviews = await _service.GetMyReviewsAsync(userId);
        return Ok(reviews);
    }
}
