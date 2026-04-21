namespace InkVerse.Api.DTOs.Admin
{
    public class UpdateUserModerationDto
    {
        public bool IsCommentBanned { get; set; }
        public bool IsBlocked { get; set; }
    }
}
