using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.DTOs.Book
{
    public class BookCreateDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? CoverImageUrl { get; set; }

        public bool IsFanfic { get; set; }
        public string Status { get; set; } = "Ongoing";
        public int WordCount { get; set; }

        public List<int> GenreIds { get; set; } = new();
        public List<int> TagIds { get; set; } = new();
        public string VerseType { get; set; } = "Original";
        public string OriginType { get; set; } = "PlatformOriginal";

        public string? SourceUrl { get; set; }
    }

}
