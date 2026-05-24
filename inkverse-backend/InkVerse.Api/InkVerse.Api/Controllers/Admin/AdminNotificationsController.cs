using System.Security.Claims;
using InkVerse.Api.DTOs.Notifications;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/notifications")]
[Authorize(Roles = "Admin")]
public class AdminNotificationsController : ControllerBase
{
    private readonly INotificationService _notifications;

    public AdminNotificationsController(INotificationService notifications)
    {
        _notifications = notifications;
    }

    [HttpPost("system")]
    public async Task<ActionResult<SendSystemNotificationResultDto>> SendSystem([FromBody] SendSystemNotificationDto dto)
    {
        try
        {
            var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(adminId)) return Unauthorized();

            var count = await _notifications.SendSystemNotificationAsync(adminId, dto);
            return Ok(new SendSystemNotificationResultDto { SentCount = count });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
