namespace InkVerse.Api.DTOs.Chapter
{
    public class ChapterUpdateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;

        public int ChapterNumber { get; set; } // editable on update
        public int? ArcId { get; set; }
        public int BookId { get; set; }
    }
}
