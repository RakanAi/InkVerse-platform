using System.ComponentModel.DataAnnotations.Schema;
using InkVerse.Api.Entities.Base;
using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.Entities.Reports;

public static class ContentReportTargetTypes
{
    public const string Book = "book";
    public const string Review = "review";
    public const string ReviewReply = "review_reply";
    public const string ChapterComment = "chapter_comment";
    public const string User = "user";

    public static readonly string[] All = [Book, Review, ReviewReply, ChapterComment, User];
}

public static class ContentReportStatuses
{
    public const string Pending = "pending";
    public const string Resolved = "resolved";
    public const string Dismissed = "dismissed";

    public static readonly string[] All = [Pending, Resolved, Dismissed];
}

public class ContentReport : CrudBase
{
    public string TargetType { get; set; } = "";
    public string TargetId { get; set; } = "";

    public string ReporterId { get; set; } = "";
    [ForeignKey(nameof(ReporterId))]
    public AppUser? Reporter { get; set; }

    public string? TargetOwnerId { get; set; }
    [ForeignKey(nameof(TargetOwnerId))]
    public AppUser? TargetOwner { get; set; }

    public string Reason { get; set; } = "";
    public string? Details { get; set; }
    public string Status { get; set; } = ContentReportStatuses.Pending;

    public string TargetTitle { get; set; } = "";
    public string TargetPreview { get; set; } = "";
    public string TargetContext { get; set; } = "";
    public string? TargetUrl { get; set; }
    public string? AdminTargetUrl { get; set; }

    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedById { get; set; }
    [ForeignKey(nameof(ResolvedById))]
    public AppUser? ResolvedBy { get; set; }
    public string? AdminNote { get; set; }
}
