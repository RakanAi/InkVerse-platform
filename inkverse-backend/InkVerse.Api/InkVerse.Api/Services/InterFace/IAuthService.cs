using System.Security.Claims;
using InkVerse.Api.DTOs.User;

namespace InkVerse.Api.Services.InterFace
{
    public interface IAuthService
    {
        Task<AuthResultDto> RegisterAsync(RegisterDto model);
        Task<AuthResultDto> LoginAsync(LoginDto model);
        Task<AuthResultDto> GetMeAsync(ClaimsPrincipal userClaims);

    }
}
