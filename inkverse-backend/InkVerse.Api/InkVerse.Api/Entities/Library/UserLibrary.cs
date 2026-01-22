using InkVerse.Api.Entities.Base;
using InkVerse.Api.Entities.Identity;

public class UserLibrary : CrudBase
{
    public string? UserId { get; set; }
    public AppUser? User { get; set; }

    public int BookId { get; set; }
    public Book? Book { get; set; }

    public string Status { get; set; } = "Reading"; // Reading, Completed, PlanToRead
    public int? LastReadChapterId { get; set; }

    public Chapter? LastReadChapter { get; set; }

    public bool IsInLibrary { get; set; } = true;


    public DateTime? LastReadAt { get; set; }     // optional but nice
}
