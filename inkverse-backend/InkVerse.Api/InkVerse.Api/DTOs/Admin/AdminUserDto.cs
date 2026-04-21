namespace InkVerse.Api.DTOs.Admin
{
    public class AdminUserDto
    {
        public string Id { get; set; } = "";
        public string UserName { get; set; } = "";
        public string Email { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public bool IsCommentBanned { get; set; }
        public bool IsBlocked { get; set; }
        public List<string> Roles { get; set; } = new();
    }
}
