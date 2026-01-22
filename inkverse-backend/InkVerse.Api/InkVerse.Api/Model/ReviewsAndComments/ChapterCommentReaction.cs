using InkVerse.Api.Entities.Identity;

public class ChapterCommentReaction
{
    public int Id { get; set; }

    public int CommentId { get; set; }
    public ChapterComment? Comment { get; set; }

    public string UserId { get; set; }
    public AppUser User { get; set; }

    // +1 = like, -1 = dislike
    public int Value { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
