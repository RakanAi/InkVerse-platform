using InkVerse.Api.Entities.Base;
using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.Entities.Monetization;

public class WalletAccount : CrudBase
{
    public required string UserId { get; set; }
    public AppUser? User { get; set; }
    public int CoinBalance { get; set; }
    public int CreditBalance { get; set; }
}

public class CoinLedgerEntry : CrudBase
{
    public required string UserId { get; set; }
    public AppUser? User { get; set; }
    public int AmountCoins { get; set; }
    public int BalanceAfterCoins { get; set; }
    public string EntryType { get; set; } = "adjustment";
    public string SourceType { get; set; } = "";
    public string? SourceId { get; set; }
    public string Description { get; set; } = "";
}

public class CoinPurchase : CrudBase
{
    public required string UserId { get; set; }
    public AppUser? User { get; set; }
    public string PackCode { get; set; } = "";
    public int Coins { get; set; }
    public int AmountCents { get; set; }
    public string Currency { get; set; } = "USD";
    public string Provider { get; set; } = "mock";
    public string ProviderReference { get; set; } = "";
    public string Status { get; set; } = "completed";
}

public class ChapterMonetization : CrudBase
{
    public int ChapterId { get; set; }
    public global::Chapter? Chapter { get; set; }
    public bool IsPaid { get; set; }
    public int PriceCoins { get; set; } = 5;
    public string? Teaser { get; set; }
}

public class ChapterUnlock : CrudBase
{
    public required string UserId { get; set; }
    public AppUser? User { get; set; }
    public int ChapterId { get; set; }
    public global::Chapter? Chapter { get; set; }
    public int PaidCoins { get; set; }
}

public class AuthorAgreement : CrudBase
{
    public string Version { get; set; } = "monetization-v1";
    public string Title { get; set; } = "InkVerse Monetization Agreement";
    public string Body { get; set; } = "";
    public bool IsActive { get; set; } = true;
}

public class AuthorAgreementAcceptance : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int AuthorAgreementId { get; set; }
    public AuthorAgreement? AuthorAgreement { get; set; }
    public string Version { get; set; } = "";
    public DateTime AcceptedAt { get; set; } = DateTime.UtcNow;
}

public class RoyaltyLedgerEntry : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public string? ReaderId { get; set; }
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public int? ChapterId { get; set; }
    public global::Chapter? Chapter { get; set; }
    public int GrossCoins { get; set; }
    public int NetCoins { get; set; }
    public int AuthorCoins { get; set; }
    public int PlatformCoins { get; set; }
    public string EntryType { get; set; } = "chapter_unlock";
    public string Status { get; set; } = "pending";
    public DateTime AvailableAt { get; set; }
}

public class AuthorBalance : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int PendingCoins { get; set; }
    public int AvailableCoins { get; set; }
    public int WithdrawnCoins { get; set; }
    public int LifetimeCoins { get; set; }
}

public class PayoutRequest : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int AmountCoins { get; set; }
    public string Status { get; set; } = "requested";
    public string Provider { get; set; } = "provider-adapter";
    public string? ProviderReference { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
}

public class BookAiApproval : CrudBase
{
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public bool TranslationEnabled { get; set; }
    public bool TtsEnabled { get; set; }
    public string? ApprovedById { get; set; }
    public AppUser? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public class AiServiceCatalog : CrudBase
{
    public string ServiceKey { get; set; } = "";
    public string Audience { get; set; } = "reader";
    public string Name { get; set; } = "";
    public int BaseCredits { get; set; }
    public int PerHundredWordsCredits { get; set; }
    public int PerThousandWordsCredits { get; set; }
    public int MinimumCredits { get; set; }
    public int MaxWords { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AiArtifact : CrudBase
{
    public string ServiceKey { get; set; } = "";
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public int? ChapterId { get; set; }
    public global::Chapter? Chapter { get; set; }
    public string Language { get; set; } = "";
    public string MimeType { get; set; } = "text/plain";
    public string Content { get; set; } = "";
    public int WordCount { get; set; }
    public string CreatedByUserId { get; set; } = "";
}

public class AiServiceOrder : CrudBase
{
    public required string UserId { get; set; }
    public AppUser? User { get; set; }
    public string ServiceKey { get; set; } = "";
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public int? ChapterId { get; set; }
    public global::Chapter? Chapter { get; set; }
    public int? AiArtifactId { get; set; }
    public AiArtifact? AiArtifact { get; set; }
    public int? NotebookEntryId { get; set; }
    public BookNotebookEntry? NotebookEntry { get; set; }
    public int PriceCredits { get; set; }
    public int WordCount { get; set; }
    public string Status { get; set; } = "completed";
    public string Prompt { get; set; } = "";
    public string OutputPreview { get; set; } = "";
}

public class BookNotebookEntry : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public string EntryType { get; set; } = "note";
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public int? RelatedChapterId { get; set; }
    public global::Chapter? RelatedChapter { get; set; }
}

public class ProofreadingDraft : CrudBase
{
    public required string AuthorId { get; set; }
    public AppUser? Author { get; set; }
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public int ChapterId { get; set; }
    public global::Chapter? Chapter { get; set; }
    public string OriginalContent { get; set; } = "";
    public string RevisedContent { get; set; } = "";
    public int PriceCredits { get; set; }
}

public static class BookContractStatuses
{
    public const string Eligible = "eligible";
    public const string PendingReview = "pending_review";
    public const string Approved = "approved";
    public const string Rejected = "rejected";
    public const string Revoked = "revoked";

    public static readonly string[] CandidateStatuses = [Eligible, PendingReview];
}

public class BookContract : CrudBase
{
    public int BookId { get; set; }
    public global::Book? Book { get; set; }
    public string Status { get; set; } = BookContractStatuses.Eligible;

    public int SnapshotWordCount { get; set; }
    public int SnapshotChapterCount { get; set; }
    public int SnapshotTotalViews { get; set; }
    public string SnapshotVerseType { get; set; } = "";
    public string SnapshotOriginType { get; set; } = "";
    public string SnapshotBookStatus { get; set; } = "";

    public string? RightsAttestedById { get; set; }
    public AppUser? RightsAttestedBy { get; set; }
    public DateTime? RightsAttestedAt { get; set; }

    public string? ReviewedById { get; set; }
    public AppUser? ReviewedBy { get; set; }
    public string? ReviewNote { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? RejectedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public DateTime? PaidChaptersAllowedAfter { get; set; }
    public DateTime? ContentLockedAfter { get; set; }
}
