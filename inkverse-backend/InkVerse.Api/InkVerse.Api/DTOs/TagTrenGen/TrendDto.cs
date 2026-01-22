namespace InkVerse.Api.DTOs.Trends
{
    public class TrendDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;   // ✅ add
        public string? Slug { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }

    public class TrendCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;   // ✅ add
        public string? Slug { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
    }

    public class TrendUpdateDto
    {
        public string Name { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;   // ✅ add
        public string? Slug { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }


    public class TrendBookLinkDto
    {
        public int BookId { get; set; }
    }
}
