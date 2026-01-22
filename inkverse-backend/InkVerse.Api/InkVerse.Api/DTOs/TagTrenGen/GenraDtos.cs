namespace InkVerse.Api.DTOs.Genres
{
    public class GenreDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class GenreCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class GenreUpdateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public bool IsActive { get; set; }
    }


}
