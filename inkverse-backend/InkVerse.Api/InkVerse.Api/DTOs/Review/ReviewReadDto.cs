using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.DTOs.Review
{
    public class ReviewReadDto
    {
        public int Id { get; set; }
        public string? Content { get; set; }
        public double Rating { get; set; }

        public string? UserId { get; set; }
        public string? UserName { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UserAvatarUrl { get; set; }

        public int Likes { get; set; }
        public int Dislikes { get; set; }

        public int BookId { get; set; }
        public string? BookTitle { get; set; }

        public string? MyReaction { get; set; } // "like" | "dislike" | null


        // ✅ breakdown
        public double CharacterAccuracy { get; set; }
        public double ChemistryRelationships { get; set; }
        public double PlotCreativity { get; set; }
        public double CanonIntegration { get; set; }
        public double EmotionalDamage { get; set; }
    }
}
