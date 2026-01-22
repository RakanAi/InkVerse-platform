namespace InkVerse.Api.DTOs.Chapter
{
    public class ChapterCreateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public int BookId { get; set; }
        public int? ArcId { get; set; }
    }

}
