using System.Security.Claims;
using InkVerse.Api.DTOs.Achievements;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Authorize]
[Route("api")]
public class ReaderProgressionController : ControllerBase
{
    private readonly IAchievementService _achievements;

    public ReaderProgressionController(IAchievementService achievements)
    {
        _achievements = achievements;
    }

    [HttpGet("me/progression")]
    public async Task<IActionResult> GetProgression()
    {
        return Ok(await _achievements.GetProgressionAsync(GetUserId()));
    }

    [HttpGet("me/achievements")]
    public async Task<IActionResult> GetAchievements()
    {
        return Ok(await _achievements.GetAchievementsAsync(GetUserId()));
    }

    [HttpPost("chapters/{chapterId:int}/read-session")]
    public async Task<IActionResult> StartReadSession(int chapterId, [FromBody] ReadSessionStartRequestDto dto)
    {
        try
        {
            return Ok(await _achievements.StartReadSessionAsync(chapterId, GetUserId(), dto.Timezone));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("chapters/{chapterId:int}/complete-read")]
    public async Task<IActionResult> CompleteRead(int chapterId, [FromBody] CompleteReadRequestDto dto)
    {
        try
        {
            return Ok(await _achievements.CompleteChapterReadAsync(chapterId, GetUserId(), dto));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Missing user.");
    }
}
