using InkVerse.Api.DTOs.BookBible;

namespace InkVerse.Api.Services.InterFace;

public interface IBookBibleService
{
    Task<BookBibleSnapshotDto> GetSnapshotAsync(int bookId, string authorId, bool isAdmin);
    Task<BookBibleProfileDto> UpdateProfileAsync(int bookId, string authorId, bool isAdmin, BookBibleProfileUpdateDto dto);

    Task<BookWorldEntryDto> CreateWorldEntryAsync(int bookId, string authorId, bool isAdmin, BookWorldEntryWriteDto dto);
    Task<BookWorldEntryDto> UpdateWorldEntryAsync(int bookId, int entryId, string authorId, bool isAdmin, BookWorldEntryWriteDto dto);
    Task DeleteWorldEntryAsync(int bookId, int entryId, string authorId, bool isAdmin);

    Task<BookCharacterProfileDto> CreateCharacterAsync(int bookId, string authorId, bool isAdmin, BookCharacterProfileWriteDto dto);
    Task<BookCharacterProfileDto> UpdateCharacterAsync(int bookId, int characterId, string authorId, bool isAdmin, BookCharacterProfileWriteDto dto);
    Task DeleteCharacterAsync(int bookId, int characterId, string authorId, bool isAdmin);

    Task<BookCharacterRelationshipDto> CreateRelationshipAsync(int bookId, string authorId, bool isAdmin, BookCharacterRelationshipWriteDto dto);
    Task<BookCharacterRelationshipDto> UpdateRelationshipAsync(int bookId, int relationshipId, string authorId, bool isAdmin, BookCharacterRelationshipWriteDto dto);
    Task DeleteRelationshipAsync(int bookId, int relationshipId, string authorId, bool isAdmin);

    Task<BookPlotThreadDto> CreatePlotThreadAsync(int bookId, string authorId, bool isAdmin, BookPlotThreadWriteDto dto);
    Task<BookPlotThreadDto> UpdatePlotThreadAsync(int bookId, int threadId, string authorId, bool isAdmin, BookPlotThreadWriteDto dto);
    Task DeletePlotThreadAsync(int bookId, int threadId, string authorId, bool isAdmin);

    Task<BookTimelineEventDto> CreateTimelineEventAsync(int bookId, string authorId, bool isAdmin, BookTimelineEventWriteDto dto);
    Task<BookTimelineEventDto> UpdateTimelineEventAsync(int bookId, int eventId, string authorId, bool isAdmin, BookTimelineEventWriteDto dto);
    Task DeleteTimelineEventAsync(int bookId, int eventId, string authorId, bool isAdmin);

    Task<BookBibleAiQuoteDto> QuoteSuggestionsAsync(int bookId, string authorId, bool isAdmin, BookBibleAiQuoteRequestDto dto);
    Task<BookBibleSuggestionRunDto> CreateSuggestionsAsync(int bookId, string authorId, bool isAdmin, BookBibleAiQuoteRequestDto dto);
    Task<BookBibleSuggestionDto> AcceptSuggestionAsync(int bookId, int suggestionId, string authorId, bool isAdmin);
    Task<BookBibleSuggestionDto> RejectSuggestionAsync(int bookId, int suggestionId, string authorId, bool isAdmin);
    Task MarkNeedsScanAsync(int bookId);
}
