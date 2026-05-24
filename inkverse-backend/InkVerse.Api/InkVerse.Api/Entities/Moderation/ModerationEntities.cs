using System.ComponentModel.DataAnnotations.Schema;
using InkVerse.Api.Entities.Base;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Entities.Reports;

namespace InkVerse.Api.Entities.Moderation;

public static class ModerationCaseStatuses
{
    public const string Open = "open";
    public const string UnderReview = "under_review";
    public const string ActionTaken = "action_taken";
    public const string Dismissed = "dismissed";
    public const string Closed = "closed";

    public static readonly string[] All = [Open, UnderReview, ActionTaken, Dismissed, Closed];
}

public static class ModerationCaseSources
{
    public const string Clawbot = "clawbot";
    public const string UserReport = "user_report";
    public const string Admin = "admin";

    public static readonly string[] All = [Clawbot, UserReport, Admin];
}

public static class ModerationSeverities
{
    public const string Low = "low";
    public const string Medium = "medium";
    public const string High = "high";
    public const string Critical = "critical";
}

public static class ModerationActions
{
    public const string None = "none";
    public const string HideContent = "hide_content";
    public const string RestoreContent = "restore_content";
    public const string HideBook = "hide_book";
    public const string CommentBanUser = "comment_ban_user";
    public const string BlockUser = "block_user";
    public const string Dismiss = "dismiss";
    public const string Close = "close";
    public const string MarkUnderReview = "mark_under_review";
}

public static class ModerationMessageAudiences
{
    public const string Internal = "internal";
    public const string Reporter = "reporter";
    public const string TargetOwner = "target_owner";
}

public class ContentModerationCase : CrudBase
{
    public string TargetType { get; set; } = "";
    public string TargetId { get; set; } = "";

    public string? TargetOwnerId { get; set; }
    [ForeignKey(nameof(TargetOwnerId))]
    public AppUser? TargetOwner { get; set; }

    public string Source { get; set; } = ModerationCaseSources.Clawbot;
    public int? SourceReportId { get; set; }
    [ForeignKey(nameof(SourceReportId))]
    public ContentReport? SourceReport { get; set; }

    public string Status { get; set; } = ModerationCaseStatuses.Open;
    public string Severity { get; set; } = ModerationSeverities.Low;
    public string Category { get; set; } = "other";
    public int ConfidenceScore { get; set; }
    public bool RequiresAdmin { get; set; } = true;
    public bool IsAutoHandled { get; set; }

    public string Title { get; set; } = "";
    public string TargetPreview { get; set; } = "";
    public string TargetContext { get; set; } = "";
    public string? TargetUrl { get; set; }
    public string? AdminTargetUrl { get; set; }

    public string ClawbotSummary { get; set; } = "";
    public string SuggestedAction { get; set; } = ModerationActions.None;
    public string AutoAction { get; set; } = ModerationActions.None;
    public DateTime? AutoActionTakenAt { get; set; }

    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedById { get; set; }
    [ForeignKey(nameof(ResolvedById))]
    public AppUser? ResolvedBy { get; set; }
    public string? AdminNote { get; set; }

    public ICollection<ModerationCaseMessage> Messages { get; set; } = new List<ModerationCaseMessage>();
}

public class ModerationCaseMessage : CrudBase
{
    public int CaseId { get; set; }
    [ForeignKey(nameof(CaseId))]
    public ContentModerationCase? Case { get; set; }

    public string? SenderId { get; set; }
    [ForeignKey(nameof(SenderId))]
    public AppUser? Sender { get; set; }

    public string Audience { get; set; } = ModerationMessageAudiences.Internal;
    public string MessageType { get; set; } = "note";
    public string Body { get; set; } = "";
}
