namespace InkVerse.Api.DTOs.Review
{
    public class MyReviewDto
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public string BookTitle { get; set; } = string.Empty;
        public string BookCoverUrl { get; set; } = string.Empty;
        public double Rating { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}