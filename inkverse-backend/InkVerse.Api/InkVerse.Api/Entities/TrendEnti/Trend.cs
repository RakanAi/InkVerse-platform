using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.Entities.TrendEnti
{
    public class Trend
    {
        [Key]
        public int ID { get; set; }

        public string Name { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public string? Slug { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<BookTrend> BookTrends { get; set; } = new List<BookTrend>();
    }
}
