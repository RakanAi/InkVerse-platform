namespace InkVerse.Api.DTOs.Book
{
    public class BookReadDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }

        public string? CoverImageUrl { get; set; }
        public string? AuthorId { get; set; }

        public string? AuthorName { get; set; } // join from User table if needed
        public string? Status { get; set; }
        public int WordCount { get; set; }
        public int TotalViews { get; set; }
        public double AverageRating { get; set; }

        public bool IsFanfic { get; set; }
        public List<string> Genres { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public List<int> GenreIds { get; set; } = new();
        public List<int> TagIds { get; set; } = new();

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public int ReviewsCount { get; set; }
        public int ChaptersCount { get; set; }

        public string VerseType { get; set; } = "Original";
        public string OriginType { get; set; } = "PlatformOriginal";

        public string? SourceUrl { get; set; }
    }
}
