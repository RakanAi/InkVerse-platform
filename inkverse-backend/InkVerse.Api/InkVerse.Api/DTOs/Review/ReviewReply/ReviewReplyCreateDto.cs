using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.DTOs.ReviewReply
{
    public class ReviewReplyCreateDto
    {
        [Required]
        [MinLength(1)]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }
}
