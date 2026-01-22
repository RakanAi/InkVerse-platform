using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Data;
using System.Security.Claims;
using InkVerse.Api.DTOs.User;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Services.InterFace;


namespace InkVerse.Api.Services.ServicesRepo
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly ITokenService _tokenService;

        public AuthService(UserManager<AppUser> userManager, ITokenService tokenService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
        }
        public async Task<AuthResultDto> RegisterAsync(RegisterDto model)
        {
            var user = new AppUser
            {
                UserName = model.UserName,
                Email = model.Email
            };
            var result = await _userManager.CreateAsync(user, model.Password);

            if (!result.Succeeded)
            {
                return new AuthResultDto
                {
                    Success = false,
                    Error = string.Join(" | ", result.Errors.Select(e => e.Description))
                };
            }
            await _userManager.AddToRoleAsync(user, "User");

            var roles = await _userManager.GetRolesAsync(user);


            return new AuthResultDto
            {
                Success = true,
                User = new NewUserDto
                {
                    UserName = user.UserName ?? "",
                    Email = user.Email ?? "",
                    Token = _tokenService.CreateToken(user, roles),
                    Roles = roles
                }
            };
        }

        public async Task<AuthResultDto> LoginAsync(LoginDto loginDto)
        {
            var loginInput = loginDto.LoginInput.Trim().ToLower();


            // Try finding by email
            var user = await _userManager.FindByEmailAsync(loginInput);

            // If not found, try by username
            if (user == null)
            {
                user = await _userManager.Users
                    .FirstOrDefaultAsync(u => u.UserName != null && u.UserName.ToLower() == loginInput);
            }

            if (user == null)
            {
                return new AuthResultDto
                {
                    Success = false,
                    Error = "Invalid username/email or password"
                };
            }

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, loginDto.Password);

            if (!isPasswordValid)
            {
                return new AuthResultDto
                {
                    Success = false,
                    Error = "Invalid username/email or password"
                };
            }

            var roles = await _userManager.GetRolesAsync(user);

            return new AuthResultDto
            {
                Success = true,
                User = new NewUserDto
                {
                    UserName = user.UserName ?? "",
                    Email = user.Email ?? "",
                    Token = _tokenService.CreateToken(user, roles),
                    Roles = roles
                }
            };

        }

        public async Task<AuthResultDto> GetMeAsync(ClaimsPrincipal userClaims)
        {
            var userId = userClaims.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return new AuthResultDto
                {
                    Success = false,
                    Error = "User not found"
                };
            }
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return new AuthResultDto
                {
                    Success = false,
                    Error = "User not found"
                };
            }

            var roles = await _userManager.GetRolesAsync(user);

            return new AuthResultDto
            {
                Success = true,
                User = new NewUserDto
                {
                    UserName = user.UserName ?? "",
                    Email = user.Email ?? "",
                    Token = _tokenService.CreateToken(user, roles), 
                    Roles = roles

                }
            };
        }


    }
}
