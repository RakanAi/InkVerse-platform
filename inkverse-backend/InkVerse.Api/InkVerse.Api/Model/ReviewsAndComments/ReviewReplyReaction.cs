using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.Entities
{
    public class ReviewReplyReaction
    {
        public int Id { get; set; }

        public int ReviewReplyId { get; set; }
        public ReviewReply? ReviewReply { get; set; }

        public string UserId { get; set; } = null!;
        public AppUser? User { get; set; }

        public string ReactionType { get; set; } = "like"; // "like" | "dislike"

        public DateTime CreatedAt { get; set; }
    }
}
