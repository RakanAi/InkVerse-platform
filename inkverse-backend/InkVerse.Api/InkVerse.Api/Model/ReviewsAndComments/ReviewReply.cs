using System.ComponentModel.DataAnnotations.Schema;
using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.Entities
{
    public class ReviewReply
    {
        public int Id { get; set; }

        public int ReviewId { get; set; }
        [ForeignKey(nameof(ReviewId))]
        public Review? Review { get; set; }

        public string UserId { get; set; } = null!;
        [ForeignKey(nameof(UserId))]
        public AppUser? User { get; set; }

        public string Content { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }

        public int? ParentReplyId { get; set; }
        [ForeignKey(nameof(ParentReplyId))]
        public ReviewReply? ParentReply { get; set; }
        public ICollection<ReviewReply> Replies { get; set; } = new List<ReviewReply>();

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // future-proofing for like/dislike
        public ICollection<ReviewReplyReaction> Reactions { get; set; } = new List<ReviewReplyReaction>();
    }
}
