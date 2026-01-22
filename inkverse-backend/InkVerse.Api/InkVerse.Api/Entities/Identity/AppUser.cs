using Microsoft.AspNetCore.Identity;

namespace InkVerse.Api.Entities.Identity
{
    public class AppUser : IdentityUser
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; } = DateTime.UtcNow;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt {  get; set; } = DateTime.UtcNow;

        public string? AvatarUrl {  get; set; }
        public string? Bio {  get; set; }



        // Future navigation properties
        public virtual ICollection<Book> Books { get; set; } = [];
        public virtual ICollection<Review> Reviews { get; set; } = [];
        public virtual ICollection<ChapterComment> Comments { get; set; } = [];
        public virtual List<RefreshToken> RefreshTokens { get; set; } = [];


    }
}
