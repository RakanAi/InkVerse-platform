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


        public DateTime CreatedAt { get; set; }

    }

}
