using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.User;
using InkVerse.Api.Entities.Identity;

[ApiController]
[Route("api/me")]
public class MeController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;

    public MeController(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return NotFound();

        return Ok(new ProfileDto
        {
            UserName = user.UserName ?? "",
            Email = user.Email ?? "",
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt
        });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return NotFound();

        user.Bio = dto.Bio?.Trim();
        user.AvatarUrl = dto.AvatarUrl?.Trim();

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new ProfileDto
        {
            UserName = user.UserName ?? "",
            Email = user.Email ?? "",
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt
        });
    }

    [Authorize]
    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings()
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return NotFound();

        return Ok(ToSettingsDto(user));
    }

    [Authorize]
    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] UpdateUserSettingsDto dto)
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return NotFound();

        var language = (dto.PreferredLanguage ?? "en").Trim().ToLowerInvariant();
        if (language.Length > 10)
        {
            return BadRequest("preferredLanguage is too long.");
        }

        user.IsProfilePublic = dto.IsProfilePublic;
        user.EmailNotificationsEnabled = dto.EmailNotificationsEnabled;
        user.ReadingRemindersEnabled = dto.ReadingRemindersEnabled;
        user.PreferredLanguage = string.IsNullOrWhiteSpace(language) ? "en" : language;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(ToSettingsDto(user));
    }

    private async Task<AppUser?> GetCurrentUserAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return null;
        return await _userManager.FindByIdAsync(userId);
    }

    private static UserSettingsDto ToSettingsDto(AppUser user)
    {
        return new UserSettingsDto
        {
            IsProfilePublic = user.IsProfilePublic,
            EmailNotificationsEnabled = user.EmailNotificationsEnabled,
            ReadingRemindersEnabled = user.ReadingRemindersEnabled,
            PreferredLanguage = string.IsNullOrWhiteSpace(user.PreferredLanguage) ? "en" : user.PreferredLanguage
        };
    }
}
