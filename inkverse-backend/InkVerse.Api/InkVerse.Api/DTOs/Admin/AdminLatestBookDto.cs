namespace InkVerse.Api.DTOs.Admin
{
    public class AdminLatestBookDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Status { get; set; } = "Ongoing";
        public int WordCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}