using System.Security.Claims;
using InkVerse.Api.DTOs.Monetization;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Route("api/chapters")]
public class MonetizedChaptersController : ControllerBase
{
    private readonly IMonetizationService _monetization;

    public MonetizedChaptersController(IMonetizationService monetization)
    {
        _monetization = monetization;
    }

    [Authorize]
    [HttpPost("{chapterId:int}/unlock")]
    public async Task<IActionResult> UnlockChapter(int chapterId)
    {
        try
        {
            return Ok(await _monetization.UnlockChapterAsync(chapterId, GetUserId()));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "Admin,Author")]
    [HttpPut("{chapterId:int}/monetization")]
    public async Task<IActionResult> UpdateChapterMonetization(int chapterId, [FromBody] UpdateChapterMonetizationDto dto)
    {
        try
        {
            return Ok(await _monetization.UpdateChapterMonetizationAsync(
                chapterId,
                GetUserId(),
                User.IsInRole("Admin"),
                dto));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("No user id found in token.");
    }
}
