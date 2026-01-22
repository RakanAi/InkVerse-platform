using InkVerse.Api.Entities.TrendEnti;

namespace InkVerse.Api.Entities
{
    public class BookTrend
    {
        public int BookId { get; set; }
        public Book Book { get; set; } = null!;

        public int TrendID { get; set; }   // keep your naming for now
        public Trend Trend { get; set; } = null!;

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
    }
}
