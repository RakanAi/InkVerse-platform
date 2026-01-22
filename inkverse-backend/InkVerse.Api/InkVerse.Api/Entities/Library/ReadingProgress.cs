using System.ComponentModel.DataAnnotations.Schema;
using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.Entities
{
    public class ReadingProgress
    {
        public int Id { get; set; }

        public int BookId { get; set; }
        public Book? Book { get; set; }

        public string? UserId { get; set; }

        public int ChapterId { get; set; }
        public Chapter? Chapter { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
