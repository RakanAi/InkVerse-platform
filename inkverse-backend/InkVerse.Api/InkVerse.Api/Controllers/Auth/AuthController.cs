using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.User.Auth;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Services.InterFace;
using InkVerse.Api.Services.InterFace.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _config;

    public AuthController(
        UserManager<AppUser> userManager,
        ITokenService tokenService,
        IConfiguration config)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _config = config;
    }

    [HttpPost("google")]
    public async Task<IActionResult> Google(
        [FromBody] GoogleLoginDto dto,
        [FromServices] IGoogleAuthService googleAuth)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.IdToken))
            return BadRequest("Missing idToken");

        try
        {
            var result = await googleAuth.GoogleLoginAsync(dto.IdToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized("Invalid Google token");
        }
    }

}
