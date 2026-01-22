using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.DTOs.User
{
    public class LoginDto
    {
        [Required]
        public string? LoginInput { get; set; }
        [Required]
        public string? Password { get; set; }
    }

}
