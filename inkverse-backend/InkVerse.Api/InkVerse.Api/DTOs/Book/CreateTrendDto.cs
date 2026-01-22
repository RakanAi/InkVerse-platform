namespace InkVerse.Api.DTOs.Book
{
    public class CreateTrendDto
    {
        public string? Name { get; set; }
        public string? ImageUrl { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<int> BookIds { get; set; } = new List<int>();

    }
}
