public class ChapterCommentDto
{
    public int Id { get; set; }
    public int ChapterId { get; set; }
    public int? ParentCommentId { get; set; }

    public string UserId { get; set; } = "";
    public string UserName { get; set; } = "";

    public string Content { get; set; } = "";

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public int Likes { get; set; }
    public int Dislikes { get; set; }

    // current user reaction: 1 / -1 / 0
    public int MyReaction { get; set; }

    public List<ChapterCommentDto> Replies { get; set; } = new();
}
