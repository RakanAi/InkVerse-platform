public class BookPortfolioDto
{
    public int ID { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public double AverageRating { get; set; }

    public List<string> Genres { get; set; } = new();
    public List<string> Tags { get; set; } = new();
}
