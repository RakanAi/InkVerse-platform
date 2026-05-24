namespace InkVerse.Api.DTOs.BookBible;

public class BookBibleSnapshotDto
{
    public BookBibleProfileDto Profile { get; set; } = new();
    public BookBibleCompletionDto Completion { get; set; } = new();
    public IReadOnlyList<BookWorldEntryDto> WorldEntries { get; set; } = [];
    public IReadOnlyList<BookCharacterProfileDto> Characters { get; set; } = [];
    public IReadOnlyList<BookCharacterRelationshipDto> Relationships { get; set; } = [];
    public IReadOnlyList<BookPlotThreadDto> PlotThreads { get; set; } = [];
    public IReadOnlyList<BookTimelineEventDto> TimelineEvents { get; set; } = [];
    public IReadOnlyList<BookBibleSuggestionDto> Suggestions { get; set; } = [];
}

public class BookBibleCompletionDto
{
    public bool HasPremise { get; set; }
    public bool HasWorld { get; set; }
    public bool HasCharacters { get; set; }
    public bool HasPlotThreads { get; set; }
    public bool HasTimeline { get; set; }
    public bool NeedsScan { get; set; }
    public int Percent { get; set; }
    public DateTime? LastScannedAt { get; set; }
    public DateTime? LastChapterChangeAt { get; set; }
}

public class BookBibleProfileDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string Premise { get; set; } = "";
    public string Themes { get; set; } = "";
    public string Tone { get; set; } = "";
    public string ReaderPromise { get; set; } = "";
    public string AuthorNotes { get; set; } = "";
    public bool NeedsScan { get; set; }
    public DateTime? LastScannedAt { get; set; }
    public DateTime? LastChapterChangeAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class BookBibleProfileUpdateDto
{
    public string? Premise { get; set; }
    public string? Themes { get; set; }
    public string? Tone { get; set; }
    public string? ReaderPromise { get; set; }
    public string? AuthorNotes { get; set; }
}

public class BookWorldEntryDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string EntryType { get; set; } = "";
    public string Name { get; set; } = "";
    public string Summary { get; set; } = "";
    public string Details { get; set; } = "";
    public string Tags { get; set; } = "";
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class BookWorldEntryWriteDto
{
    public string? EntryType { get; set; }
    public string? Name { get; set; }
    public string? Summary { get; set; }
    public string? Details { get; set; }
    public string? Tags { get; set; }
    public int? SortOrder { get; set; }
}

public class BookCharacterProfileDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string Name { get; set; } = "";
    public string Aliases { get; set; } = "";
    public string Role { get; set; } = "";
    public string Status { get; set; } = "";
    public string Appearance { get; set; } = "";
    public string Motivation { get; set; } = "";
    public string Fear { get; set; } = "";
    public string Goal { get; set; } = "";
    public string Secrets { get; set; } = "";
    public string ArcNotes { get; set; } = "";
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class BookCharacterProfileWriteDto
{
    public string? Name { get; set; }
    public string? Aliases { get; set; }
    public string? Role { get; set; }
    public string? Status { get; set; }
    public string? Appearance { get; set; }
    public string? Motivation { get; set; }
    public string? Fear { get; set; }
    public string? Goal { get; set; }
    public string? Secrets { get; set; }
    public string? ArcNotes { get; set; }
    public int? SortOrder { get; set; }
}

public class BookCharacterRelationshipDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public int SourceCharacterId { get; set; }
    public string SourceCharacterName { get; set; } = "";
    public int TargetCharacterId { get; set; }
    public string TargetCharacterName { get; set; } = "";
    public string RelationType { get; set; } = "";
    public string Tension { get; set; } = "";
    public string Status { get; set; } = "";
    public string Notes { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class BookCharacterRelationshipWriteDto
{
    public int SourceCharacterId { get; set; }
    public int TargetCharacterId { get; set; }
    public string? RelationType { get; set; }
    public string? Tension { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}

public class BookPlotThreadDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string Title { get; set; } = "";
    public string Setup { get; set; } = "";
    public string Promise { get; set; } = "";
    public string Conflict { get; set; } = "";
    public string Status { get; set; } = "";
    public string Payoff { get; set; } = "";
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class BookPlotThreadWriteDto
{
    public string? Title { get; set; }
    public string? Setup { get; set; }
    public string? Promise { get; set; }
    public string? Conflict { get; set; }
    public string? Status { get; set; }
    public string? Payoff { get; set; }
    public int? SortOrder { get; set; }
}

public class BookTimelineEventDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public int? ChapterId { get; set; }
    public string? ChapterTitle { get; set; }
    public string Title { get; set; } = "";
    public int OrderIndex { get; set; }
    public string DateLabel { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class BookTimelineEventWriteDto
{
    public int? ChapterId { get; set; }
    public string? Title { get; set; }
    public int? OrderIndex { get; set; }
    public string? DateLabel { get; set; }
    public string? Description { get; set; }
}

public class BookBibleSuggestionDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string SuggestionType { get; set; } = "";
    public string Title { get; set; } = "";
    public string Summary { get; set; } = "";
    public string PayloadJson { get; set; } = "{}";
    public string Status { get; set; } = "";
    public string SourceChapterIds { get; set; } = "";
    public int WordCount { get; set; }
    public int PriceCredits { get; set; }
    public DateTime? DecidedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BookBibleAiQuoteRequestDto
{
    public List<int> SelectedChapterIds { get; set; } = [];
    public string Prompt { get; set; } = "";
}

public class BookBibleAiQuoteDto
{
    public string ServiceKey { get; set; } = "book-bible-sync";
    public string Name { get; set; } = "Book Bible Sync";
    public int PriceCredits { get; set; }
    public int WordCount { get; set; }
    public int MaxWords { get; set; } = 15000;
    public bool NeedsScan { get; set; }
    public string CurrencyLabel { get; set; } = "credits";
}

public class BookBibleSuggestionRunDto
{
    public BookBibleAiQuoteDto Quote { get; set; } = new();
    public IReadOnlyList<BookBibleSuggestionDto> Suggestions { get; set; } = [];
}
