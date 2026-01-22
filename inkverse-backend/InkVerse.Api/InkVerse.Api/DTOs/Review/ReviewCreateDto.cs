using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.DTOs.Review
{
    public class ReviewCreateDto
    {
        [Required]
        public string Content { get; set; } = string.Empty;

        [Range(0, 5)]
        public double CharacterAccuracy { get; set; }

        [Range(0, 5)]
        public double ChemistryRelationships { get; set; }

        [Range(0, 5)]
        public double PlotCreativity { get; set; }

        [Range(0, 5)]
        public double CanonIntegration { get; set; }

        // 1 = MAX emotional damage, 5 = NO damage
        [Range(1, 5)]
        public double EmotionalDamage { get; set; }
    }

}
