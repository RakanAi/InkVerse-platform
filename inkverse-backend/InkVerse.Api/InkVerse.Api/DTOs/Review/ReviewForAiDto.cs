namespace InkVerse.Api.DTOs.Review
{
    public class ReviewForAiDto
    {
        public int Id { get; set; }
        public string? Content { get; set; }
        public double Rating { get; set; }
        public DateTime CreatedAt { get; set; }
        public int BookId { get; set; }
        public string? BookTitle { get; set; }
        public string? UserId { get; set; }
        public string? UserName { get; set; }
    }
}