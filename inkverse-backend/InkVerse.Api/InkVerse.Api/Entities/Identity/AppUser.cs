using Microsoft.AspNetCore.Identity;

namespace InkVerse.Api.Entities.Identity
{
    public class AppUser : IdentityUser
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; } = DateTime.UtcNow;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }

        public bool IsProfilePublic { get; set; } = true;
        public bool EmailNotificationsEnabled { get; set; } = true;
        public bool ReadingRemindersEnabled { get; set; } = false;
        public string PreferredLanguage { get; set; } = "en";

        public bool IsCommentBanned { get; set; } = false;
        public bool IsBlocked { get; set; } = false;

        public virtual ICollection<Book> Books { get; set; } = [];
        public virtual ICollection<Review> Reviews { get; set; } = [];
        public virtual ICollection<ChapterComment> Comments { get; set; } = [];
        public virtual List<RefreshToken> RefreshTokens { get; set; } = [];
    }
}
