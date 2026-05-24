using System.Security.Claims;
using InkVerse.Api.DTOs.Moderation;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/moderation")]
[Authorize(Roles = "Admin")]
public class AdminModerationController : ControllerBase
{
    private readonly IModerationService _moderation;

    public AdminModerationController(IModerationService moderation)
    {
        _moderation = moderation;
    }

    [HttpGet("cases")]
    public async Task<IActionResult> Cases(
        [FromQuery] string? status = null,
        [FromQuery] string? source = null,
        [FromQuery] string? type = null,
        [FromQuery] bool? requiresAdmin = null)
    {
        try
        {
            return Ok(await _moderation.GetCasesAsync(status, source, type, requiresAdmin));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("cases/{id:int}")]
    public async Task<IActionResult> Case(int id)
    {
        var item = await _moderation.GetCaseAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost("cases/{id:int}/decision")]
    public async Task<IActionResult> Decide(int id, [FromBody] ModerationCaseDecisionDto dto)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(adminId)) return Unauthorized();

        try
        {
            var item = await _moderation.DecideCaseAsync(id, adminId, dto);
            return item == null ? NotFound() : Ok(item);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("cases/{id:int}/messages")]
    public async Task<IActionResult> AddMessage(int id, [FromBody] ModerationCaseMessageCreateDto dto)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(adminId)) return Unauthorized();

        try
        {
            var item = await _moderation.AddMessageAsync(id, adminId, dto);
            return item == null ? NotFound() : Ok(item);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("run-clawbot")]
    public async Task<IActionResult> RunClawbot([FromBody] ClawbotModerationRunRequestDto dto)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Ok(await _moderation.RunClawbotScanAsync(dto.Take, adminId));
    }
}
