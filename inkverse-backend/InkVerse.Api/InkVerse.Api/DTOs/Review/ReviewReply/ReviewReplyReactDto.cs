using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.DTOs.ReviewReply
{
    public class ReviewReplyReactDto
    {
        [Required]
        public string ReactionType { get; set; } = "like"; // "like" | "dislike"
    }
}
