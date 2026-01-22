namespace InkVerse.Api.DTOs.Book
{
    public class RankedBookDTO
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Image { get; set; }
        public double Rating { get; set; }
        public int ReadCount { get; set; } // Optional
    }

}
