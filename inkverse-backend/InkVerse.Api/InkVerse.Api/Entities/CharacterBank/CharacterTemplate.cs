using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.Entities.CharacterBank
{
    public class CharacterTemplate
    {
        [Key]
        public int ID { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public int? CharacterWorldId { get; set; }
        public CharacterWorld? CharacterWorld { get; set; }
        public string Fandom { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? Aliases { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string? Profile { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<BookCharacter> BookCharacters { get; set; } = new List<BookCharacter>();
    }
}
