using System.Security.Claims;
using InkVerse.Api.DTOs.User;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Route("api/author/onboarding")]
public class AuthorOnboardingController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ITokenService _tokenService;

    public AuthorOnboardingController(UserManager<AppUser> userManager, ITokenService tokenService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
    }

    [Authorize]
    [HttpPost("accept")]
    public async Task<IActionResult> AcceptTermsAndBecomeAuthor()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        if (user.IsBlocked)
        {
            return Forbid();
        }

        var currentRoles = await _userManager.GetRolesAsync(user);

        if (!currentRoles.Contains("User"))
        {
            var addUserRole = await _userManager.AddToRoleAsync(user, "User");
            if (!addUserRole.Succeeded)
            {
                return BadRequest(addUserRole.Errors);
            }
        }

        if (!currentRoles.Contains("Author"))
        {
            var addAuthorRole = await _userManager.AddToRoleAsync(user, "Author");
            if (!addAuthorRole.Succeeded)
            {
                return BadRequest(addAuthorRole.Errors);
            }
        }

        var roles = await _userManager.GetRolesAsync(user);

        var dto = new NewUserDto
        {
            UserName = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            AvatarUrl = user.AvatarUrl,
            Token = _tokenService.CreateToken(user, roles),
            Roles = roles
        };

        return Ok(dto);
    }
}
