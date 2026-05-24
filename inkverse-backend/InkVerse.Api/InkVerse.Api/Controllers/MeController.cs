using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.User;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Services.InterFace;

[ApiController]
[Route("api/me")]
public class MeController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IAchievementService _achievements;

    public MeController(UserManager<AppUser> userManager, IAchievementService achievements)
    {
        _userManager = userManager;
        _achievements = achievements;
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return NotFound();

        return Ok(await ToProfileDtoAsync(user));
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

        return Ok(await ToProfileDtoAsync(user));
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
        user.ShowReviewsOnProfile = dto.ShowReviewsOnProfile;
        user.ShowCommentsOnProfile = dto.ShowCommentsOnProfile;
        user.ShowLibraryOnProfile = dto.ShowLibraryOnProfile;
        user.ShowAuthorBooksOnProfile = dto.ShowAuthorBooksOnProfile;
        user.EmailNotificationsEnabled = dto.EmailNotificationsEnabled;
        user.ReadingRemindersEnabled = dto.ReadingRemindersEnabled;
        user.PreferredLanguage = string.IsNullOrWhiteSpace(language) ? "en" : language;
        user.Timezone = NormalizeTimezone(dto.Timezone);

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
            ShowReviewsOnProfile = user.ShowReviewsOnProfile,
            ShowCommentsOnProfile = user.ShowCommentsOnProfile,
            ShowLibraryOnProfile = user.ShowLibraryOnProfile,
            ShowAuthorBooksOnProfile = user.ShowAuthorBooksOnProfile,
            EmailNotificationsEnabled = user.EmailNotificationsEnabled,
            ReadingRemindersEnabled = user.ReadingRemindersEnabled,
            PreferredLanguage = string.IsNullOrWhiteSpace(user.PreferredLanguage) ? "en" : user.PreferredLanguage,
            Timezone = string.IsNullOrWhiteSpace(user.Timezone) ? "UTC" : user.Timezone
        };
    }

    private async Task<ProfileDto> ToProfileDtoAsync(AppUser user)
    {
        var progress = await _achievements.GetProgressionAsync(user.Id, user.Timezone);
        return new ProfileDto
        {
            UserName = user.UserName ?? "",
            Email = user.Email ?? "",
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt,
            ReaderLevel = progress.Level,
            TotalChaptersRead = progress.TotalUniqueChaptersRead,
            FeaturedAchievements = progress.FeaturedAchievements
        };
    }

    private static string NormalizeTimezone(string? timezone)
    {
        var value = string.IsNullOrWhiteSpace(timezone) ? "UTC" : timezone.Trim();
        return value[..Math.Min(value.Length, 80)];
    }
}
