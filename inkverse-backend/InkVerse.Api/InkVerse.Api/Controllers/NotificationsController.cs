using System.Security.Claims;
using InkVerse.Api.DTOs.Notifications;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Route("api/me")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notifications;

    public NotificationsController(INotificationService notifications)
    {
        _notifications = notifications;
    }

    [HttpGet("notifications")]
    public async Task<IActionResult> List(
        [FromQuery] string? filter = "all",
        [FromQuery] string? category = null,
        [FromQuery] DateTime? cursor = null,
        [FromQuery] int take = 20)
    {
        try
        {
            return Ok(await _notifications.GetNotificationsAsync(UserId(), filter, category, cursor, take));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("notifications/unread-count")]
    public async Task<ActionResult<NotificationUnreadCountDto>> UnreadCount()
    {
        return Ok(new NotificationUnreadCountDto
        {
            UnreadCount = await _notifications.GetUnreadCountAsync(UserId()),
        });
    }

    [HttpPost("notifications/{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var notification = await _notifications.MarkReadAsync(UserId(), id);
        return notification == null ? NotFound() : Ok(notification);
    }

    [HttpPost("notifications/read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var count = await _notifications.MarkAllReadAsync(UserId());
        return Ok(new { marked = count });
    }

    [HttpDelete("notifications/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        return await _notifications.DeleteAsync(UserId(), id) ? NoContent() : NotFound();
    }

    [HttpGet("notification-preferences")]
    public async Task<IActionResult> Preferences()
    {
        return Ok(await _notifications.GetPreferencesAsync(UserId()));
    }

    [HttpPut("notification-preferences")]
    public async Task<IActionResult> UpdatePreferences([FromBody] UpdateNotificationPreferencesDto dto)
    {
        try
        {
            return Ok(await _notifications.UpdatePreferencesAsync(UserId(), dto));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string UserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User not found.");
    }
}
