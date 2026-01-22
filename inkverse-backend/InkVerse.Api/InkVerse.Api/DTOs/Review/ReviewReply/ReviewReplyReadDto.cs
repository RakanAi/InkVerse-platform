namespace InkVerse.Api.DTOs.ReviewReply
{
    public class ReviewReplyReadDto
    {
        public int Id { get; set; }

        public int ReviewId { get; set; }

        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = "Unknown";

        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // For later (reply reactions)
        public int Likes { get; set; }
        public int Dislikes { get; set; }

        // Optional (for UI highlight later)
        public string? MyReaction { get; set; } // "like" | "dislike" | null
    }
}
