using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.Entities.CharacterBank
{
    public class CharacterWorld
    {
        [Key]
        public int ID { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? Slug { get; set; }
        public string Summary { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<CharacterTemplate> Characters { get; set; } = new List<CharacterTemplate>();
    }
}
