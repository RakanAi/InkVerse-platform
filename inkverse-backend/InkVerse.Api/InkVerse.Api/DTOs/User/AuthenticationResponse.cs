
namespace InkVerse.Api.DTOs.User
{
    public class AuthenticationResponse
    {
        public bool IsAuthenticated { get; set; }
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiration { get; set; }
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? UserName { get; set; }
        public string? Role { get; set; }
        public List<string> Errors { get; internal set; }
    }

}
