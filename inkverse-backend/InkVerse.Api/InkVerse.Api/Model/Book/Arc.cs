using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.Entities
{
    public class Arc
    {
        [Key]
        public int ID { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public int BookId { get; set; }

        // optional: for ordering arcs later
        public int OrderIndex { get; set; } = 0;

        // navigation
        public Book Book { get; set; } = null!;
        public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
    }
}
