using System.Data;

namespace InkVerse.Api.DTOs.User
{
    public class ProfileDto
    {
        public string UserName { get; set; } = "";
        public string Email { get; set; } = "";
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
