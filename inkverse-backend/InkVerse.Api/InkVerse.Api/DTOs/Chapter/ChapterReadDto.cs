namespace InkVerse.Api.DTOs.Chapter
{
    public class ChapterReadDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int ChapterNumber { get; set; }
        public int WordCount { get; set; }
        public int BookId { get; set; }
        public int? ArcId { get; set; }
        public string? ArcName { get; set; }
        public bool IsPaid { get; set; }
        public bool IsLocked { get; set; }
        public bool IsUnlocked { get; set; } = true;
        public int PriceCoins { get; set; }
        public string? Teaser { get; set; }


        public DateTime CreatedAt { get; set; }

    }

}
