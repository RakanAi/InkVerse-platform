using InkVerse.Api.Entities;
using InkVerse.Api.Entities.Base;

public class Chapter : CrudBase
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int ChapterNumber { get; set; }
    public int WordCount { get; set; }
    public int BookId { get; set; }
    public Book? Book { get; set; }
    public int? ArcId { get; set; }
    public Arc? Arc { get; set; }

}
