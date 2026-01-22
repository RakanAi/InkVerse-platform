using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.DTOs.ReviewReply
{
    public class ReviewReplyUpdateDto
    {
        [Required]
        [MinLength(1)]
        [MaxLength(4000)]
        public string Content { get; set; } = string.Empty;
    }
}
