using InkVerse.Api.DTOs.Monetization;

namespace InkVerse.Api.Services.InterFace;

public interface IBookContractService
{
    Task<BookContractDto> GetAuthorBookContractAsync(int bookId, string userId, bool isAdmin);
    Task<BookContractDto> AttestRightsAsync(int bookId, string userId, bool isAdmin);
    Task<IReadOnlyList<BookContractDto>> GetAdminQueueAsync(string? status);
    Task<BookContractDto> ApproveAsync(int bookId, string adminId, BookContractReviewRequestDto dto);
    Task<BookContractDto> RejectAsync(int bookId, string adminId, BookContractReviewRequestDto dto);
    Task<BookContractDto> RevokeAsync(int bookId, string adminId, BookContractReviewRequestDto dto);
    Task<int> CountContractCandidatesAsync();
    Task<bool> IsBookContractApprovedAsync(int bookId);
}
