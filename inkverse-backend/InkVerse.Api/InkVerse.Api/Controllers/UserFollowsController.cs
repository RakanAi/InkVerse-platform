using System.Security.Claims;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Route("api/users")]
public class UserFollowsController : ControllerBase
{
    private readonly INotificationService _notifications;

    public UserFollowsController(INotificationService notifications)
    {
        _notifications = notifications;
    }

    [Authorize]
    [HttpGet("{userName}/follow-status")]
    public async Task<IActionResult> Status(string userName)
    {
        var status = await _notifications.GetFollowStatusAsync(UserId(), userName);
        return status == null ? NotFound() : Ok(status);
    }

    [Authorize]
    [HttpPost("{userName}/follow")]
    public async Task<IActionResult> Follow(string userName)
    {
        try
        {
            return Ok(await _notifications.FollowAuthorAsync(UserId(), userName));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpDelete("{userName}/follow")]
    public async Task<IActionResult> Unfollow(string userName)
    {
        var status = await _notifications.UnfollowAuthorAsync(UserId(), userName);
        return status == null ? NotFound() : Ok(status);
    }

    private string UserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("User not found.");
    }
}
