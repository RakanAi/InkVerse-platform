using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using InkVerse.Api.DTOs.User;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Services.InterFace;
using InkVerse.Api.Services.InterFace.Auth;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly IConfiguration _config;

    public GoogleAuthService(
        UserManager<AppUser> userManager,
        ITokenService tokenService,
        IConfiguration config)
    {
        _userManager = userManager;
        _tokenService = tokenService;
        _config = config;
    }

    public async Task<NewUserDto> GoogleLoginAsync(string idToken)
    {
        var googleClientId = _config["GoogleAuth:ClientId"];
        if (string.IsNullOrWhiteSpace(googleClientId))
            throw new InvalidOperationException("Google client id not configured");

        var principal = await GoogleTokenValidator.ValidateAsync(idToken, googleClientId);

        var email = principal.FindFirstValue(ClaimTypes.Email) ?? principal.FindFirstValue("email");
        var name = principal.FindFirstValue(ClaimTypes.Name) ?? principal.FindFirstValue("name");

        if (string.IsNullOrWhiteSpace(email))
            throw new UnauthorizedAccessException("Google token missing email");

        // Find or create user
        var user = await _userManager.FindByEmailAsync(email);

        if (user == null)
        {
            user = new AppUser
            {
                UserName = email,
                Email = email
            };

            var createRes = await _userManager.CreateAsync(user);
            if (!createRes.Succeeded)
                throw new InvalidOperationException(
                    string.Join("; ", createRes.Errors.Select(e => e.Description))
                );
        }

        var googleSub = principal.FindFirstValue("sub");

        if (!string.IsNullOrWhiteSpace(googleSub))
        {
            var logins = await _userManager.GetLoginsAsync(user);

            var alreadyLinked = logins.Any(l =>
                l.LoginProvider == "Google" &&
                l.ProviderKey == googleSub);

            if (!alreadyLinked)
            {
                await _userManager.AddLoginAsync(
                    user,
                    new UserLoginInfo("Google", googleSub, "Google")
                );
            }
        }


        var roles = await _userManager.GetRolesAsync(user);

        var token = _tokenService.CreateToken(user, roles);

        return new NewUserDto
        {
            UserName = user.UserName ?? "",
            Email = user.Email ?? "",
            Token = token,
            Roles = roles
        };
    }
}
