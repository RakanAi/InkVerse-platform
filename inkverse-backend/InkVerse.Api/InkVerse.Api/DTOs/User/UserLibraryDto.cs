namespace InkVerse.Api.DTOs.UserLibrary
{
    public class UserLibraryDto
    {
        public int BookId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string CoverImageUrl { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int? LastReadChapterId { get; set; }
        public DateTime? LastReadAt { get; set; }
        public bool IsInLibrary { get; set; }

    }
}
