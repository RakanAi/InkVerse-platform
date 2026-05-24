using InkVerse.Api.DTOs.Monetization;

namespace InkVerse.Api.Services.InterFace;

public interface IAiStudioService
{
    Task<BookAiApprovalDto> GetBookAiApprovalAsync(int bookId);
    Task<BookAiApprovalDto> UpdateBookAiApprovalAsync(int bookId, string adminId, UpdateBookAiApprovalDto dto);
    Task<AiQuoteDto> QuoteAsync(string userId, AiQuoteRequestDto dto);
    Task<AiOrderDto> CreateOrderAsync(string userId, AiOrderRequestDto dto);
    Task<IReadOnlyList<BookNotebookEntryDto>> GetNotebookAsync(int bookId, string authorId, bool isAdmin);
    Task<BookNotebookEntryDto> CreateNotebookEntryAsync(int bookId, string authorId, bool isAdmin, CreateNotebookEntryDto dto);
    Task<ProofreadingDraftDto> CreateProofreadingDraftAsync(string authorId, ProofreadingOrderRequestDto dto);
}
