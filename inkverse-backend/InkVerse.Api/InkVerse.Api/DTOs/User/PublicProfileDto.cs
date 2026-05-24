using InkVerse.Api.DTOs.Achievements;
using InkVerse.Api.DTOs.Book;
using InkVerse.Api.DTOs.Review;
using InkVerse.Api.DTOs.UserLibrary;

namespace InkVerse.Api.DTOs.User
{
    public class PublicProfileVisibilityDto
    {
        public bool Reviews { get; set; }
        public bool Comments { get; set; }
        public bool Library { get; set; }
        public bool AuthorBooks { get; set; }
    }

    public class PublicProfileCommentDto
    {
        public int Id { get; set; }
        public int ChapterId { get; set; }
        public int ChapterNumber { get; set; }
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ParagraphId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class PublicProfileDto
    {
        public string UserName { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string? AvatarUrl { get; set; }
        public DateTime? CreatedAt { get; set; }
        public bool IsProfilePublic { get; set; }
        public bool CanViewProfile { get; set; }
        public bool IsOwner { get; set; }
        public bool IsAuthor { get; set; }
        public PublicProfileVisibilityDto Visibility { get; set; } = new();
        public int ReviewsCount { get; set; }
        public int CommentsCount { get; set; }
        public int LibraryCount { get; set; }
        public int BooksCount { get; set; }
        public int ReaderLevel { get; set; } = 1;
        public bool IsFollowedByViewer { get; set; }
        public int FollowerCount { get; set; }
        public IReadOnlyList<AchievementBadgeDto> FeaturedAchievements { get; set; } = [];
        public List<MyReviewDto> Reviews { get; set; } = [];
        public List<PublicProfileCommentDto> Comments { get; set; } = [];
        public List<UserLibraryDto> Library { get; set; } = [];
        public List<BookReadDto> AuthorBooks { get; set; } = [];
    }
}
