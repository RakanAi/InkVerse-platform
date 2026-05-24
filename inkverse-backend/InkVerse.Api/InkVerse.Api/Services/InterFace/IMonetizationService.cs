using InkVerse.Api.DTOs.Chapter;
using InkVerse.Api.DTOs.Monetization;

namespace InkVerse.Api.Services.InterFace;

public interface IMonetizationService
{
    IReadOnlyList<CoinPackDto> GetCoinPacks();
    Task<WalletDto> GetWalletAsync(string userId);
    Task<IReadOnlyList<CoinLedgerEntryDto>> GetWalletLedgerAsync(string userId);
    Task<CheckoutSessionDto> CreateCheckoutSessionAsync(string userId, CreateCheckoutSessionDto dto);
    Task<bool> CanChargeChapterAsync(int chapterId, int bookId, string? authorId);
    Task<bool> CanAuthorMutateChapterAsync(int chapterId, string? userId, bool isAdmin);
    Task<ChapterReadDto> ApplyChapterAccessAsync(ChapterReadDto chapter, string? userId, bool isAdmin);
    Task<ChapterMonetizationDto> UpdateChapterMonetizationAsync(int chapterId, string userId, bool isAdmin, UpdateChapterMonetizationDto dto);
    Task<UnlockChapterResultDto> UnlockChapterAsync(int chapterId, string userId);
    Task<AuthorAgreementStatusDto> GetAuthorAgreementStatusAsync(string authorId);
    Task<AuthorAgreementStatusDto> AcceptAuthorAgreementAsync(string authorId);
    Task<AuthorEarningsDto> GetAuthorEarningsAsync(string authorId);
    Task<PayoutRequestDto> RequestPayoutAsync(string authorId, CreatePayoutRequestDto dto);
}
