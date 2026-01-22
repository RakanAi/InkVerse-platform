using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.DTOs.Review
{
    public class ReviewReactDto
    {
        [Required]
        public string ReactionType { get; set; } = "like"; // "like" | "dislike"
    }
}
