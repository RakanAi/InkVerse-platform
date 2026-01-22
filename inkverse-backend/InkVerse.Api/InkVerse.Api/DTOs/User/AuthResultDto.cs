namespace InkVerse.Api.DTOs.User
{
    public class AuthResultDto
    {
        public bool Success { get; set; }
        public string? Error { get; set; }  // or List<string>
        public NewUserDto? User { get; set; }
    }
}
