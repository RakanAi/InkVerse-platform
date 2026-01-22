using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.Services.InterFace
{
    public interface ITokenService
    {
        string CreateToken(AppUser user, IList<string> roles);


    }
}
