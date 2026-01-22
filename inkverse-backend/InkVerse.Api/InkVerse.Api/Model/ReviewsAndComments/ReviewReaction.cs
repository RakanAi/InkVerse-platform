using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using InkVerse.Api.Entities.Base;
using InkVerse.Api.Entities.Identity;

public class ReviewReaction : CrudBase
{
    public int ReviewId { get; set; }
    [ForeignKey("ReviewId")]
    public Review? Review { get; set; }

    public string? UserId { get; set; }
    [ForeignKey("UserId")]
    public AppUser? User { get; set; }

    [Required]
    public string ReactionType { get; set; } = "like"; // 'like' or 'dislike'
}
