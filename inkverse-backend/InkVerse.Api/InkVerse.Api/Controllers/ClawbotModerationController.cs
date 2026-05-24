using InkVerse.Api.DTOs.Moderation;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Route("api/clawbot/moderation")]
public class ClawbotModerationController : ControllerBase
{
    private readonly IModerationService _moderation;

    public ClawbotModerationController(IModerationService moderation)
    {
        _moderation = moderation;
    }

    [HttpPost("run")]
    public async Task<IActionResult> Run([FromBody] ClawbotModerationRunRequestDto dto)
    {
        return Ok(await _moderation.RunClawbotScanAsync(dto.Take, "clawbot"));
    }
}
