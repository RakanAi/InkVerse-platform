using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.Entities.Notifications;

public static class NotificationCategories
{
    public const string BookUpdates = "book_updates";
    public const string AuthorUpdates = "author_updates";
    public const string Interactions = "interactions";
    public const string AuthorActivity = "author_activity";
    public const string Reports = "reports";
    public const string System = "system";

    public static readonly string[] All =
    [
        BookUpdates,
        AuthorUpdates,
        Interactions,
        AuthorActivity,
        Reports,
        System,
    ];
}

public static class NotificationTypes
{
    public const string NewChapter = "new_chapter";
    public const string NewAuthorBook = "new_author_book";
    public const string NewBookReview = "new_book_review";
    public const string NewChapterComment = "new_chapter_comment";
    public const string ReviewReply = "review_reply";
    public const string CommentReply = "comment_reply";
    public const string ReviewLike = "review_like";
    public const string ReviewReplyLike = "review_reply_like";
    public const string CommentLike = "comment_like";
    public const string ReportCreated = "report_created";
    public const string ReportResolved = "report_resolved";
    public const string ReportDismissed = "report_dismissed";
    public const string System = "system";
}

public class UserNotification
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ID { get; set; }

    public string RecipientId { get; set; } = string.Empty;
    public AppUser? Recipient { get; set; }

    public string? ActorId { get; set; }
    public AppUser? Actor { get; set; }

    [MaxLength(80)]
    public string Category { get; set; } = NotificationCategories.System;

    [MaxLength(80)]
    public string Type { get; set; } = NotificationTypes.System;

    [MaxLength(180)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(600)]
    public string Body { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? LinkUrl { get; set; }

    [MaxLength(80)]
    public string? TargetType { get; set; }

    [MaxLength(80)]
    public string? TargetId { get; set; }

    public string? MetadataJson { get; set; }

    [MaxLength(260)]
    public string DedupeKey { get; set; } = string.Empty;

    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class UserNotificationPreference
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ID { get; set; }

    public string UserId { get; set; } = string.Empty;
    public AppUser? User { get; set; }

    [MaxLength(80)]
    public string Category { get; set; } = NotificationCategories.System;

    public bool InAppEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class UserAuthorFollow
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ID { get; set; }

    public string FollowerId { get; set; } = string.Empty;
    public AppUser? Follower { get; set; }

    public string AuthorId { get; set; } = string.Empty;
    public AppUser? Author { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
