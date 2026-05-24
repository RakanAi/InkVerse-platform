using InkVerse.Api.Entities.Base;
using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.Entities.BookBible;

public class BookBibleProfile : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public string Premise { get; set; } = "";
    public string Themes { get; set; } = "";
    public string Tone { get; set; } = "";
    public string ReaderPromise { get; set; } = "";
    public string AuthorNotes { get; set; } = "";
    public bool NeedsScan { get; set; }
    public DateTime? LastScannedAt { get; set; }
    public DateTime? LastChapterChangeAt { get; set; }
}

public class BookWorldEntry : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public string EntryType { get; set; } = "location";
    public string Name { get; set; } = "";
    public string Summary { get; set; } = "";
    public string Details { get; set; } = "";
    public string Tags { get; set; } = "";
    public int SortOrder { get; set; }
}

public class BookCharacterProfile : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public string Name { get; set; } = "";
    public string Aliases { get; set; } = "";
    public string Role { get; set; } = "";
    public string Status { get; set; } = "active";
    public string Appearance { get; set; } = "";
    public string Motivation { get; set; } = "";
    public string Fear { get; set; } = "";
    public string Goal { get; set; } = "";
    public string Secrets { get; set; } = "";
    public string ArcNotes { get; set; } = "";
    public int SortOrder { get; set; }
}

public class BookCharacterRelationship : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public int SourceCharacterId { get; set; }
    public BookCharacterProfile? SourceCharacter { get; set; }
    public int TargetCharacterId { get; set; }
    public BookCharacterProfile? TargetCharacter { get; set; }
    public string RelationType { get; set; } = "";
    public string Tension { get; set; } = "";
    public string Status { get; set; } = "active";
    public string Notes { get; set; } = "";
}

public class BookPlotThread : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public string Title { get; set; } = "";
    public string Setup { get; set; } = "";
    public string Promise { get; set; } = "";
    public string Conflict { get; set; } = "";
    public string Status { get; set; } = "open";
    public string Payoff { get; set; } = "";
    public int SortOrder { get; set; }
}

public class BookTimelineEvent : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public int? ChapterId { get; set; }
    public global::Chapter? Chapter { get; set; }
    public string Title { get; set; } = "";
    public int OrderIndex { get; set; }
    public string DateLabel { get; set; } = "";
    public string Description { get; set; } = "";
}

public class BookBibleSuggestion : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public string SuggestionType { get; set; } = "";
    public string Title { get; set; } = "";
    public string Summary { get; set; } = "";
    public string PayloadJson { get; set; } = "{}";
    public string Status { get; set; } = "pending";
    public string SourceChapterIds { get; set; } = "";
    public int WordCount { get; set; }
    public int PriceCredits { get; set; }
    public DateTime? DecidedAt { get; set; }
}
