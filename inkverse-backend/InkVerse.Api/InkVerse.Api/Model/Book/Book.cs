using System.ComponentModel.DataAnnotations.Schema;
using InkVerse.Api.Entities;
using InkVerse.Api.Entities.Base;
using InkVerse.Api.Entities.Enums;
using InkVerse.Api.Entities.Identity;


public class Book : CrudBase
{
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? CoverImageUrl { get; set; }
    public bool IsFanfic { get; set; }

    public VerseType VerseType { get; set; } = VerseType.Original;
    public OriginType OriginType { get; set; } = OriginType.PlatformOriginal;

    public BookStatus Status { get; set; } = BookStatus.Ongoing;

    public int TotalViews { get; set; }
    public double AverageRating { get; set; }
    public int WordCount { get; set; }

    public string? AuthorName { get; set; }

    public string? AuthorId { get; set; }
    
    public AppUser? Author { get; set; }

    public double Rating { get; set; } = 0;
    public int ReadCount { get; set; } = 0;

    public ICollection<Genre> Genres { get; set; } = new List<Genre>();
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    public ICollection<BookTrend> BookTrends { get; set; } = new List<BookTrend>();

    public string? SourceUrl { get; set; }   // optional (translation source)


}
