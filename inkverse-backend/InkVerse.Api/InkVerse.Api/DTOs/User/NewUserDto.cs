namespace InkVerse.Api.DTOs.User
{
    public class NewUserDto
    {
        public String UserName { get; set; }
        public String Email { get; set; }
        public String Token { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();

    }
}
