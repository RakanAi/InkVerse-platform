namespace InkVerse.Api.DTOs.Admin
{
    public class AdminLatestChapterDto
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public string BookTitle { get; set; } = "";
        public string Title { get; set; } = "";
        public int ChapterNumber { get; set; }
        public int WordCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}