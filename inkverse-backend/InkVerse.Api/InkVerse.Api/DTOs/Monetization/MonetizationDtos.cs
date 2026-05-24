namespace InkVerse.Api.DTOs.Monetization;

public record CoinPackDto(string Code, string Label, int AmountCents, int Coins);

public class WalletDto
{
    public int CoinBalance { get; set; }
    public int CreditBalance { get; set; }
    public IReadOnlyList<CoinPackDto> Packs { get; set; } = [];
}

public class CoinLedgerEntryDto
{
    public int Id { get; set; }
    public int AmountCoins { get; set; }
    public int BalanceAfterCoins { get; set; }
    public string EntryType { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class CreateCheckoutSessionDto
{
    public string PackCode { get; set; } = "";
}

public class CheckoutSessionDto
{
    public string Provider { get; set; } = "mock";
    public string ProviderReference { get; set; } = "";
    public string Status { get; set; } = "completed";
    public int CoinsAdded { get; set; }
    public int CoinBalance { get; set; }
}

public class ChapterMonetizationDto
{
    public int ChapterId { get; set; }
    public bool IsPaid { get; set; }
    public int PriceCoins { get; set; }
    public string? Teaser { get; set; }
}

public class UpdateChapterMonetizationDto
{
    public bool IsPaid { get; set; }
    public string? Teaser { get; set; }
}

public class UnlockChapterResultDto
{
    public int ChapterId { get; set; }
    public bool AlreadyUnlocked { get; set; }
    public int PriceCoins { get; set; }
    public int CoinBalance { get; set; }
}

public class AuthorAgreementStatusDto
{
    public bool HasAccepted { get; set; }
    public string Version { get; set; } = "monetization-v1";
    public DateTime? AcceptedAt { get; set; }
    public string Title { get; set; } = "InkVerse Monetization Agreement";
    public string Body { get; set; } = "";
}

public class AcceptAuthorAgreementDto
{
    public bool Accept { get; set; }
}

public class RoyaltyLedgerEntryDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public int? ChapterId { get; set; }
    public int GrossCoins { get; set; }
    public int AuthorCoins { get; set; }
    public int PlatformCoins { get; set; }
    public string EntryType { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTime AvailableAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PayoutRequestDto
{
    public int Id { get; set; }
    public int AmountCoins { get; set; }
    public string Status { get; set; } = "";
    public string Provider { get; set; } = "";
    public DateTime RequestedAt { get; set; }
}

public class CreatePayoutRequestDto
{
    public int AmountCoins { get; set; }
}

public class AuthorEarningsDto
{
    public int PendingCoins { get; set; }
    public int AvailableCoins { get; set; }
    public int WithdrawnCoins { get; set; }
    public int LifetimeCoins { get; set; }
    public int PendingCents => PendingCoins;
    public int AvailableCents => AvailableCoins;
    public IReadOnlyList<RoyaltyLedgerEntryDto> Royalties { get; set; } = [];
    public IReadOnlyList<PayoutRequestDto> PayoutRequests { get; set; } = [];
}

public class BookAiApprovalDto
{
    public int BookId { get; set; }
    public bool TranslationEnabled { get; set; }
    public bool TtsEnabled { get; set; }
}

public class UpdateBookAiApprovalDto
{
    public bool TranslationEnabled { get; set; }
    public bool TtsEnabled { get; set; }
}

public class AiQuoteRequestDto
{
    public string ServiceKey { get; set; } = "";
    public int BookId { get; set; }
    public int? ChapterId { get; set; }
    public List<int> SelectedChapterIds { get; set; } = [];
    public string Language { get; set; } = "en";
    public string Prompt { get; set; } = "";
    public string DraftTitle { get; set; } = "";
    public string DraftContent { get; set; } = "";
}

public class AiQuoteDto
{
    public string ServiceKey { get; set; } = "";
    public string Name { get; set; } = "";
    public int PriceCredits { get; set; }
    public int WordCount { get; set; }
    public int MaxWords { get; set; }
    public bool IsCached { get; set; }
    public string CurrencyLabel { get; set; } = "coins";
}

public class AiOrderRequestDto : AiQuoteRequestDto
{
}

public class AiArtifactDto
{
    public int Id { get; set; }
    public string ServiceKey { get; set; } = "";
    public int BookId { get; set; }
    public int? ChapterId { get; set; }
    public string Language { get; set; } = "";
    public string MimeType { get; set; } = "";
    public string Content { get; set; } = "";
    public int WordCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BookNotebookEntryDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string EntryType { get; set; } = "";
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public int? RelatedChapterId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AiOrderDto
{
    public int Id { get; set; }
    public string ServiceKey { get; set; } = "";
    public int PriceCredits { get; set; }
    public int WordCount { get; set; }
    public string Status { get; set; } = "";
    public AiArtifactDto? Artifact { get; set; }
    public BookNotebookEntryDto? NotebookEntry { get; set; }
    public string OutputPreview { get; set; } = "";
}

public class CreateNotebookEntryDto
{
    public string EntryType { get; set; } = "note";
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public int? RelatedChapterId { get; set; }
}

public class ProofreadingOrderRequestDto
{
    public int ChapterId { get; set; }
}

public class ProofreadingDraftDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public int ChapterId { get; set; }
    public string RevisedContent { get; set; } = "";
    public int PriceCredits { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BookContractDto
{
    public int? Id { get; set; }
    public int BookId { get; set; }
    public string BookTitle { get; set; } = "";
    public string? AuthorId { get; set; }
    public string AuthorName { get; set; } = "";
    public string Status { get; set; } = "not_eligible";
    public bool IsContracted { get; set; }
    public bool MeetsContractMetrics { get; set; }
    public bool ContractEligible { get; set; }
    public bool CanApprove { get; set; }
    public bool RequiresRightsAttestation { get; set; }
    public bool RightsAttested { get; set; }
    public DateTime? RightsAttestedAt { get; set; }
    public string? RightsAttestedById { get; set; }
    public string? ReviewedById { get; set; }
    public string? ReviewNote { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime? PaidChaptersAllowedAfter { get; set; }
    public DateTime? ContentLockedAfter { get; set; }
    public int WordCount { get; set; }
    public int ChapterCount { get; set; }
    public int TotalViews { get; set; }
    public int RequiredWordCount { get; set; } = 20000;
    public int RequiredChapterCount { get; set; } = 10;
    public int RequiredTotalViews { get; set; } = 1000;
    public string VerseType { get; set; } = "";
    public string OriginType { get; set; } = "";
    public string BookStatus { get; set; } = "";
    public IReadOnlyList<string> ContractMissingRequirements { get; set; } = [];
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class BookContractReviewRequestDto
{
    public string? Note { get; set; }
}
