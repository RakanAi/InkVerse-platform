namespace InkVerse.Api.DTOs.Comment
{
    public class CommentCreateDto
    {
        public string Content { get; set; } = string.Empty;
        //public string? ParagraphId { get; set; } // optional for inline comments
        //public int ChapterId { get; set; } // Required for chapter comments
        //public string? ParagraphId { get; set; } // Optional for inline comments
        public int? ParentCommentId { get; set; } // Optional for replies

        //public string? UserId { get; set; } // Optional, can be set by the service layer
        //public string? UserName { get; set; } // Optional, can be set by the service layer
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Optional, can be set by the service layer

    }

}
