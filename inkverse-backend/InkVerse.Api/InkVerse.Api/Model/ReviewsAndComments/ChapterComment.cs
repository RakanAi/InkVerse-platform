using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using InkVerse.Api.Entities.Base;
using InkVerse.Api.Entities.Identity;

public class ChapterComment
{
    public int ID { get; set; }

    public string Content { get; set; } = string.Empty;


    public string UserId { get; set; } = null!;
    public AppUser User { get; set; } = null!;


    public int ChapterId { get; set; }
    public Chapter? Chapter { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }



    public int? ParentCommentId { get; set; }
    public ChapterComment? ParentComment { get; set; }
    public ICollection<ChapterComment> Replies { get; set; } = new List<ChapterComment>();


    public ICollection<ChapterCommentReaction> Reactions { get; set; } = new List<ChapterCommentReaction>();
}


