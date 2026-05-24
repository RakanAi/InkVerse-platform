using InkVerse.Api.DTOs.Book;

namespace InkVerse.Api.DTOs.Characters
{
    public class CharacterDto
    {
        public int Id { get; set; }
        public int? WorldId { get; set; }
        public string WorldName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string Fandom { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Aliases { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string? Profile { get; set; }
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }

    public class CharacterCreateDto
    {
        public int WorldId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string Role { get; set; } = string.Empty;
        public string? Aliases { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string? Profile { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
    }

    public class CharacterUpdateDto : CharacterCreateDto
    {
    }

    public class CharacterWorldDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string Summary { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public int SortOrder { get; set; }
    }

    public class CharacterWorldCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string Summary { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
    }

    public class CharacterWorldUpdateDto : CharacterWorldCreateDto
    {
    }
}
