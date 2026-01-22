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
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        return Ok(new ProfileDto
        {
            UserName = user.UserName ?? "",
            Email = user.Email ?? "",
            Bio = user.Bio,              // add fields to AppUser
            AvatarUrl = user.AvatarUrl,  // add fields to AppUser
            CreatedAt = user.CreatedAt   // add field or use your CrudBase CreatedAt
        });
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var user = await _userManager.FindByIdAsync(userId);
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

}
