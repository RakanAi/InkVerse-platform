using InkVerse.Api.DTOs.User;

namespace InkVerse.Api.Services.InterFace.Auth
{
    public interface IGoogleAuthService
    {
        Task<NewUserDto> GoogleLoginAsync(string idToken);

    }
}
