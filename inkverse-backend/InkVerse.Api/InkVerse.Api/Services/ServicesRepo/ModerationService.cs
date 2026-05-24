using System.Text.RegularExpressions;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Moderation;
using InkVerse.Api.Entities;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Entities.Moderation;
using InkVerse.Api.Entities.Reports;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Services.ServicesRepo;

public class ModerationService : IModerationService
{
    private static readonly string[] SpamSignals =
    [
        "http://",
        "https://",
        "www.",
        "hxxp",
        "free coins",
        "bonus-books",
        "claim today",
        "telegram",
        "discord.gg",
        "whatsapp",
        "promo code",
        "visit ",
    ];

    private static readonly string[] AbuseSignals =
    [
        "kill yourself",
        "kys",
        "go die",
        "trash author",
        "stupid idiot",
    ];

    private static readonly Regex EmailLikeRegex = new(@"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex PhoneLikeRegex = new(@"\+?\d[\d\s().-]{8,}\d", RegexOptions.Compiled);

    private readonly InkVerseDB _db;
    private readonly UserManager<AppUser> _userManager;

    public ModerationService(InkVerseDB db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<ClawbotModerationRunResultDto> RunClawbotScanAsync(int take, string? actorId = null)
    {
        take = take <= 0 ? 50 : Math.Min(take, 200);
        var result = new ClawbotModerationRunResultDto();
        var cases = new List<ModerationCaseDto>();

        var reviews = await _db.Reviews
            .Include(item => item.Book)
            .Include(item => item.User)
            .Where(item => !item.IsDeleted)
            .OrderByDescending(item => item.CreatedAt)
            .Take(take)
            .ToListAsync();

        foreach (var review in reviews)
        {
            result.Scanned++;
            var target = new ModerationTarget(
                ContentReportTargetTypes.Review,
                review.ID.ToString(),
                review.UserId,
                review.Book == null ? "Review" : $"Review on {review.Book.Title}",
                Truncate(review.Content ?? review.ReviewTitle, 420),
                $"By {review.User?.UserName ?? "Unknown user"}",
                $"/book/{review.BookId}",
                $"/admin/books/{review.BookId}");

            await HandleTargetAsync(target, review.Content ?? "", ModerationCaseSources.Clawbot, null, actorId, result, cases);
        }

        var replies = await _db.ReviewReplies
            .Include(item => item.Review)
                .ThenInclude(review => review!.Book)
            .Include(item => item.User)
            .Where(item => !item.IsDeleted)
            .OrderByDescending(item => item.CreatedAt)
            .Take(take)
            .ToListAsync();

        foreach (var reply in replies)
        {
            result.Scanned++;
            var bookTitle = reply.Review?.Book?.Title ?? "Unknown book";
            var target = new ModerationTarget(
                ContentReportTargetTypes.ReviewReply,
                reply.Id.ToString(),
                reply.UserId,
                $"Review reply on {bookTitle}",
                Truncate(reply.Content, 420),
                $"By {reply.User?.UserName ?? "Unknown user"}",
                reply.Review == null ? null : $"/book/{reply.Review.BookId}",
                reply.Review == null ? null : $"/admin/books/{reply.Review.BookId}");

            await HandleTargetAsync(target, reply.Content, ModerationCaseSources.Clawbot, null, actorId, result, cases);
        }

        var comments = await _db.ChapterComments
            .Include(item => item.Chapter)
                .ThenInclude(chapter => chapter!.Book)
            .Include(item => item.User)
            .Where(item => !item.IsDeleted)
            .OrderByDescending(item => item.CreatedAt)
            .Take(take)
            .ToListAsync();

        foreach (var comment in comments)
        {
            result.Scanned++;
            var bookTitle = comment.Chapter?.Book?.Title ?? "Unknown book";
            var target = new ModerationTarget(
                ContentReportTargetTypes.ChapterComment,
                comment.ID.ToString(),
                comment.UserId,
                comment.ParentCommentId.HasValue ? $"Comment reply on {bookTitle}" : $"Chapter comment on {bookTitle}",
                Truncate(comment.Content, 420),
                $"By {comment.User?.UserName ?? "Unknown user"}",
                comment.Chapter == null ? null : $"/book/{comment.Chapter.BookId}/chapter/{comment.Chapter.ID}",
                comment.Chapter == null ? null : $"/admin/books/{comment.Chapter.BookId}/chapters/{comment.Chapter.ID}");

            await HandleTargetAsync(target, comment.Content, ModerationCaseSources.Clawbot, null, actorId, result, cases);
        }

        var reports = await _db.ContentReports
            .Where(item => item.Status == ContentReportStatuses.Pending)
            .OrderByDescending(item => item.CreatedAt)
            .Take(take)
            .ToListAsync();

        foreach (var report in reports)
        {
            if (await _db.ModerationCases.AnyAsync(item => item.SourceReportId == report.ID))
                continue;

            result.Scanned++;
            var target = new ModerationTarget(
                report.TargetType,
                report.TargetId,
                report.TargetOwnerId,
                report.TargetTitle,
                report.TargetPreview,
                string.IsNullOrWhiteSpace(report.TargetContext)
                    ? $"Report reason: {report.Reason}"
                    : $"{report.TargetContext} · Report reason: {report.Reason}",
                report.TargetUrl,
                report.AdminTargetUrl);

            await HandleTargetAsync(
                target,
                $"{report.TargetPreview}\n{report.Details}",
                ModerationCaseSources.UserReport,
                report,
                actorId,
                result,
                cases);
        }

        result.Cases = cases;
        return result;
    }

    public async Task<List<ModerationCaseDto>> GetCasesAsync(string? status, string? source, string? type, bool? requiresAdmin)
    {
        var normalizedStatus = NormalizeOptional(status, ModerationCaseStatuses.All, "status");
        var normalizedSource = NormalizeOptional(source, ModerationCaseSources.All, "source");
        var normalizedType = string.IsNullOrWhiteSpace(type) ? null : type.Trim().ToLowerInvariant();

        var query = _db.ModerationCases
            .AsNoTracking()
            .Include(item => item.TargetOwner)
            .Include(item => item.ResolvedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(normalizedStatus))
            query = query.Where(item => item.Status == normalizedStatus);
        if (!string.IsNullOrWhiteSpace(normalizedSource))
            query = query.Where(item => item.Source == normalizedSource);
        if (!string.IsNullOrWhiteSpace(normalizedType))
            query = query.Where(item => item.TargetType == normalizedType);
        if (requiresAdmin.HasValue)
            query = query.Where(item => item.RequiresAdmin == requiresAdmin.Value);

        var rows = await query
            .OrderBy(item => item.RequiresAdmin ? 0 : 1)
            .ThenBy(item => item.Status == ModerationCaseStatuses.Open ? 0 : 1)
            .ThenByDescending(item => item.CreatedAt)
            .ToListAsync();

        return rows.Select(item => ToDto(item, includeMessages: false)).ToList();
    }

    public async Task<ModerationCaseDto?> GetCaseAsync(int id)
    {
        var item = await _db.ModerationCases
            .AsNoTracking()
            .Include(caseItem => caseItem.TargetOwner)
            .Include(caseItem => caseItem.ResolvedBy)
            .Include(caseItem => caseItem.Messages)
                .ThenInclude(message => message.Sender)
            .FirstOrDefaultAsync(caseItem => caseItem.ID == id);

        return item == null ? null : ToDto(item, includeMessages: true);
    }

    public async Task<ModerationCaseDto?> DecideCaseAsync(int id, string adminId, ModerationCaseDecisionDto dto)
    {
        var item = await _db.ModerationCases
            .Include(caseItem => caseItem.Messages)
            .FirstOrDefaultAsync(caseItem => caseItem.ID == id);

        if (item == null) return null;

        var action = NormalizeAction(dto.Action);
        var note = Clean(dto.AdminNote, 2000);
        var now = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(note))
        {
            item.AdminNote = note;
            AddMessage(item, adminId, ModerationMessageAudiences.Internal, "note", note, now);
        }

        if (!string.IsNullOrWhiteSpace(dto.MessageToReporter))
            AddMessage(item, adminId, ModerationMessageAudiences.Reporter, "reply", Clean(dto.MessageToReporter, 2000)!, now);

        if (!string.IsNullOrWhiteSpace(dto.MessageToTargetOwner))
            AddMessage(item, adminId, ModerationMessageAudiences.TargetOwner, "reply", Clean(dto.MessageToTargetOwner, 2000)!, now);

        if (action == ModerationActions.MarkUnderReview)
        {
            item.Status = ModerationCaseStatuses.UnderReview;
            item.RequiresAdmin = true;
        }
        else if (action == ModerationActions.Dismiss)
        {
            item.Status = ModerationCaseStatuses.Dismissed;
            item.RequiresAdmin = false;
            item.ResolvedAt = now;
            item.ResolvedById = adminId;
        }
        else if (action == ModerationActions.Close || action == ModerationActions.None)
        {
            item.Status = ModerationCaseStatuses.Closed;
            item.RequiresAdmin = false;
            item.ResolvedAt = now;
            item.ResolvedById = adminId;
        }
        else
        {
            await ApplyTargetActionAsync(item, action, adminId);
            item.Status = ModerationCaseStatuses.ActionTaken;
            item.RequiresAdmin = false;
            item.ResolvedAt = now;
            item.ResolvedById = adminId;
            item.SuggestedAction = action;
        }

        item.UpdatedBy = adminId;
        item.UpdatedAt = now;

        await _db.SaveChangesAsync();
        return await GetCaseAsync(id);
    }

    public async Task<ModerationCaseDto?> AddMessageAsync(int id, string adminId, ModerationCaseMessageCreateDto dto)
    {
        var item = await _db.ModerationCases.FirstOrDefaultAsync(caseItem => caseItem.ID == id);
        if (item == null) return null;

        var audience = NormalizeAudience(dto.Audience);
        var body = Clean(dto.Body, 2000);
        if (string.IsNullOrWhiteSpace(body))
            throw new InvalidOperationException("Message body is required.");

        AddMessage(item, adminId, audience, audience == ModerationMessageAudiences.Internal ? "note" : "reply", body, DateTime.UtcNow);
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = adminId;

        await _db.SaveChangesAsync();
        return await GetCaseAsync(id);
    }

    public Task<int> CountAdminQueueAsync()
    {
        return _db.ModerationCases.CountAsync(item =>
            item.RequiresAdmin &&
            (item.Status == ModerationCaseStatuses.Open || item.Status == ModerationCaseStatuses.UnderReview));
    }

    public Task<int> CountAutoHandledTodayAsync()
    {
        var start = DateTime.UtcNow.Date;
        return _db.ModerationCases.CountAsync(item =>
            item.IsAutoHandled &&
            item.AutoActionTakenAt != null &&
            item.AutoActionTakenAt >= start);
    }

    private async Task HandleTargetAsync(
        ModerationTarget target,
        string text,
        string source,
        ContentReport? sourceReport,
        string? actorId,
        ClawbotModerationRunResultDto result,
        List<ModerationCaseDto> cases)
    {
        var classification = Classify(text, sourceReport?.Reason);
        if (classification == null && source != ModerationCaseSources.UserReport)
            return;

        classification ??= new ModerationClassification(
            "report",
            ModerationSeverities.Medium,
            55,
            true,
            ModerationActions.MarkUnderReview,
            "A user report needs human review.");

        var shouldAutoHandle =
            classification.AutoAction == ModerationActions.HideContent &&
            classification.ConfidenceScore >= 90 &&
            (source == ModerationCaseSources.Clawbot || sourceReport?.Reason == "spam");

        var (caseItem, created) = await CreateCaseAsync(target, classification, source, sourceReport, shouldAutoHandle, actorId);
        if (!created) return;

        result.CreatedCases++;

        if (shouldAutoHandle)
        {
            await ApplyTargetActionAsync(caseItem, classification.AutoAction, actorId);
            caseItem.Status = ModerationCaseStatuses.ActionTaken;
            caseItem.IsAutoHandled = true;
            caseItem.RequiresAdmin = false;
            caseItem.AutoActionTakenAt = DateTime.UtcNow;
            caseItem.ResolvedAt = DateTime.UtcNow;
            caseItem.AdminNote = "Clawbot auto-handled this because the content matched high-confidence spam signals.";
            AddMessage(caseItem, null, ModerationMessageAudiences.Internal, "system", caseItem.AdminNote, DateTime.UtcNow);

            if (sourceReport != null)
            {
                sourceReport.Status = ContentReportStatuses.Resolved;
                sourceReport.ResolvedAt = DateTime.UtcNow;
                sourceReport.AdminNote = "Clawbot auto-handled the reported content.";
            }

            await MaybeCommentBanRepeatOffenderAsync(caseItem.TargetOwnerId);
            await _db.SaveChangesAsync();
            result.AutoHandled++;
        }
        else
        {
            result.RequiresAdmin++;
        }

        var dto = await GetCaseAsync(caseItem.ID);
        if (dto != null) cases.Add(dto);
    }

    private async Task<(ContentModerationCase Case, bool Created)> CreateCaseAsync(
        ModerationTarget target,
        ModerationClassification classification,
        string source,
        ContentReport? sourceReport,
        bool autoHandled,
        string? actorId)
    {
        ContentModerationCase? existing;

        if (sourceReport != null)
        {
            existing = await _db.ModerationCases
                .FirstOrDefaultAsync(item => item.SourceReportId == sourceReport.ID);
        }
        else
        {
            existing = await _db.ModerationCases
                .FirstOrDefaultAsync(item =>
                    item.TargetType == target.Type &&
                    item.TargetId == target.Id &&
                    item.Category == classification.Category &&
                    item.Source == source &&
                    item.Status != ModerationCaseStatuses.Dismissed &&
                    item.Status != ModerationCaseStatuses.Closed);
        }

        if (existing != null)
            return (existing, false);

        var now = DateTime.UtcNow;
        var caseItem = new ContentModerationCase
        {
            TargetType = target.Type,
            TargetId = target.Id,
            TargetOwnerId = target.OwnerId,
            Source = source,
            SourceReportId = sourceReport?.ID,
            Status = autoHandled ? ModerationCaseStatuses.ActionTaken : ModerationCaseStatuses.Open,
            Severity = classification.Severity,
            Category = classification.Category,
            ConfidenceScore = classification.ConfidenceScore,
            RequiresAdmin = !autoHandled,
            IsAutoHandled = autoHandled,
            Title = target.Title,
            TargetPreview = target.Preview,
            TargetContext = target.Context,
            TargetUrl = target.TargetUrl,
            AdminTargetUrl = target.AdminTargetUrl,
            ClawbotSummary = classification.Summary,
            SuggestedAction = classification.SuggestedAction,
            AutoAction = autoHandled ? classification.AutoAction : ModerationActions.None,
            CreatedBy = actorId ?? "clawbot",
            CreatedAt = now,
        };

        AddMessage(caseItem, null, ModerationMessageAudiences.Internal, "system", classification.Summary, now);

        _db.ModerationCases.Add(caseItem);
        await _db.SaveChangesAsync();
        return (caseItem, true);
    }

    private ModerationClassification? Classify(string? text, string? reportReason)
    {
        var value = (text ?? "").Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            return reportReason == "other"
                ? null
                : new ModerationClassification("report", ModerationSeverities.Low, 45, true, ModerationActions.MarkUnderReview, "The report has little text, so Clawbot kept it for admin review.");
        }

        var lower = value.ToLowerInvariant();
        var spamHits = SpamSignals.Count(lower.Contains);
        if (spamHits > 0)
        {
            var confidence = Math.Min(99, 88 + spamHits * 5);
            return new ModerationClassification(
                "spam",
                ModerationSeverities.Medium,
                confidence,
                false,
                ModerationActions.HideContent,
                "High-confidence spam or promotional link pattern detected.");
        }

        if (EmailLikeRegex.IsMatch(value) || PhoneLikeRegex.IsMatch(value))
        {
            return new ModerationClassification(
                "private_information",
                ModerationSeverities.High,
                78,
                true,
                ModerationActions.MarkUnderReview,
                "Possible private contact information detected; admin review is safer than automatic removal.");
        }

        if (AbuseSignals.Any(lower.Contains))
        {
            return new ModerationClassification(
                "harassment",
                ModerationSeverities.Medium,
                76,
                true,
                ModerationActions.HideContent,
                "Potential harassment detected; Clawbot recommends review before action.");
        }

        return reportReason switch
        {
            "spam" => new ModerationClassification("spam", ModerationSeverities.Medium, 68, true, ModerationActions.HideContent, "Spam report needs admin confirmation."),
            "copyright_ip" => new ModerationClassification("copyright_ip", ModerationSeverities.High, 70, true, ModerationActions.MarkUnderReview, "Copyright/IP reports always stay in the admin queue."),
            "illegal_content" => new ModerationClassification("illegal_content", ModerationSeverities.Critical, 70, true, ModerationActions.MarkUnderReview, "Illegal-content reports always stay in the admin queue."),
            "private_information" => new ModerationClassification("private_information", ModerationSeverities.High, 70, true, ModerationActions.MarkUnderReview, "Private-information reports need admin review."),
            "harassment" or "hate_abuse" => new ModerationClassification("harassment", ModerationSeverities.Medium, 60, true, ModerationActions.HideContent, "Abuse report needs admin confirmation."),
            _ => null,
        };
    }

    private async Task ApplyTargetActionAsync(ContentModerationCase item, string action, string? actorId)
    {
        var now = DateTime.UtcNow;

        if (action == ModerationActions.HideContent || action == ModerationActions.RestoreContent)
        {
            var hidden = action == ModerationActions.HideContent;
            if (item.TargetType == ContentReportTargetTypes.Review && int.TryParse(item.TargetId, out var reviewId))
            {
                var review = await _db.Reviews.FirstOrDefaultAsync(row => row.ID == reviewId);
                if (review != null)
                {
                    review.IsDeleted = hidden;
                    review.UpdatedAt = now;
                    review.UpdatedBy = actorId;
                    await RecalculateBookAverageAsync(review.BookId);
                }
            }
            else if (item.TargetType == ContentReportTargetTypes.ReviewReply && int.TryParse(item.TargetId, out var replyId))
            {
                var reply = await _db.ReviewReplies.FirstOrDefaultAsync(row => row.Id == replyId);
                if (reply != null)
                {
                    reply.IsDeleted = hidden;
                    reply.UpdatedAt = now;
                }
            }
            else if (item.TargetType == ContentReportTargetTypes.ChapterComment && int.TryParse(item.TargetId, out var commentId))
            {
                var comment = await _db.ChapterComments.FirstOrDefaultAsync(row => row.ID == commentId);
                if (comment != null)
                {
                    comment.IsDeleted = hidden;
                    comment.UpdatedAt = now;
                }
            }
        }
        else if (action == ModerationActions.HideBook && item.TargetType == ContentReportTargetTypes.Book && int.TryParse(item.TargetId, out var bookId))
        {
            var book = await _db.Books.FirstOrDefaultAsync(row => row.ID == bookId);
            if (book != null)
            {
                book.IsDeleted = true;
                book.UpdatedAt = now;
                book.UpdatedBy = actorId;
            }
        }
        else if (action == ModerationActions.CommentBanUser || action == ModerationActions.BlockUser)
        {
            var userId = item.TargetType == ContentReportTargetTypes.User ? item.TargetId : item.TargetOwnerId;
            if (!string.IsNullOrWhiteSpace(userId))
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user != null)
                {
                    if (action == ModerationActions.CommentBanUser) user.IsCommentBanned = true;
                    if (action == ModerationActions.BlockUser) user.IsBlocked = true;
                    user.LastUpdated = now;
                    await _userManager.UpdateAsync(user);
                }
            }
        }
    }

    private async Task MaybeCommentBanRepeatOffenderAsync(string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId)) return;

        var since = DateTime.UtcNow.AddHours(-24);
        var autoHidden = await _db.ModerationCases.CountAsync(item =>
            item.TargetOwnerId == userId &&
            item.IsAutoHandled &&
            item.AutoAction == ModerationActions.HideContent &&
            item.AutoActionTakenAt != null &&
            item.AutoActionTakenAt >= since);

        if (autoHidden < 3) return;

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null || user.IsCommentBanned) return;

        user.IsCommentBanned = true;
        user.LastUpdated = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);
    }

    private async Task RecalculateBookAverageAsync(int bookId)
    {
        var avg = await _db.Reviews
            .Where(item => item.BookId == bookId && !item.IsDeleted)
            .Select(item => (double?)item.Rating)
            .AverageAsync() ?? 0;

        var book = await _db.Books.FirstOrDefaultAsync(item => item.ID == bookId);
        if (book == null) return;

        book.AverageRating = Math.Round(avg, 2);
        book.UpdatedAt = DateTime.UtcNow;
    }

    private static ModerationCaseDto ToDto(ContentModerationCase item, bool includeMessages)
    {
        return new ModerationCaseDto
        {
            Id = item.ID,
            TargetType = item.TargetType,
            TargetId = item.TargetId,
            TargetOwnerId = item.TargetOwnerId,
            TargetOwnerName = item.TargetOwner?.UserName ?? item.TargetOwner?.Email,
            Source = item.Source,
            SourceReportId = item.SourceReportId,
            Status = item.Status,
            Severity = item.Severity,
            Category = item.Category,
            ConfidenceScore = item.ConfidenceScore,
            RequiresAdmin = item.RequiresAdmin,
            IsAutoHandled = item.IsAutoHandled,
            Title = item.Title,
            TargetPreview = item.TargetPreview,
            TargetContext = item.TargetContext,
            TargetUrl = item.TargetUrl,
            AdminTargetUrl = item.AdminTargetUrl,
            ClawbotSummary = item.ClawbotSummary,
            SuggestedAction = item.SuggestedAction,
            AutoAction = item.AutoAction,
            AutoActionTakenAt = item.AutoActionTakenAt,
            ResolvedAt = item.ResolvedAt,
            ResolvedById = item.ResolvedById,
            ResolvedByName = item.ResolvedBy?.UserName ?? item.ResolvedBy?.Email,
            AdminNote = item.AdminNote,
            CreatedAt = item.CreatedAt,
            Messages = includeMessages
                ? item.Messages
                    .OrderBy(message => message.CreatedAt)
                    .Select(ToMessageDto)
                    .ToList()
                : [],
        };
    }

    private static ModerationCaseMessageDto ToMessageDto(ModerationCaseMessage message)
    {
        return new ModerationCaseMessageDto
        {
            Id = message.ID,
            CaseId = message.CaseId,
            SenderId = message.SenderId,
            SenderName = message.Sender?.UserName ?? message.Sender?.Email,
            Audience = message.Audience,
            MessageType = message.MessageType,
            Body = message.Body,
            CreatedAt = message.CreatedAt,
        };
    }

    private static void AddMessage(ContentModerationCase item, string? senderId, string audience, string type, string body, DateTime now)
    {
        item.Messages.Add(new ModerationCaseMessage
        {
            SenderId = senderId,
            Audience = audience,
            MessageType = type,
            Body = body,
            CreatedAt = now,
            CreatedBy = senderId ?? "clawbot",
        });
    }

    private static string NormalizeAction(string? value)
    {
        var action = (value ?? ModerationActions.Close).Trim().ToLowerInvariant();
        var allowed = new[]
        {
            ModerationActions.None,
            ModerationActions.HideContent,
            ModerationActions.RestoreContent,
            ModerationActions.HideBook,
            ModerationActions.CommentBanUser,
            ModerationActions.BlockUser,
            ModerationActions.Dismiss,
            ModerationActions.Close,
            ModerationActions.MarkUnderReview,
        };

        return allowed.Contains(action)
            ? action
            : throw new InvalidOperationException("Invalid moderation action.");
    }

    private static string NormalizeAudience(string? value)
    {
        var audience = (value ?? ModerationMessageAudiences.Internal).Trim().ToLowerInvariant();
        var allowed = new[]
        {
            ModerationMessageAudiences.Internal,
            ModerationMessageAudiences.Reporter,
            ModerationMessageAudiences.TargetOwner,
        };

        return allowed.Contains(audience)
            ? audience
            : throw new InvalidOperationException("Invalid message audience.");
    }

    private static string? NormalizeOptional(string? value, string[] allowed, string label)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var normalized = value.Trim().ToLowerInvariant();
        return allowed.Contains(normalized)
            ? normalized
            : throw new InvalidOperationException($"Invalid moderation {label}.");
    }

    private static string? Clean(string? value, int maxLength)
    {
        var clean = (value ?? "").Trim();
        if (string.IsNullOrWhiteSpace(clean)) return null;
        return clean.Length > maxLength ? clean[..maxLength] : clean;
    }

    private static string Truncate(string? value, int maxLength)
    {
        var clean = (value ?? "").Trim();
        if (string.IsNullOrWhiteSpace(clean)) return "";
        return clean.Length <= maxLength ? clean : clean[..maxLength].TrimEnd() + "...";
    }

    private sealed record ModerationTarget(
        string Type,
        string Id,
        string? OwnerId,
        string Title,
        string Preview,
        string Context,
        string? TargetUrl,
        string? AdminTargetUrl);

    private sealed record ModerationClassification(
        string Category,
        string Severity,
        int ConfidenceScore,
        bool RequiresAdmin,
        string SuggestedAction,
        string Summary)
    {
        public string AutoAction => RequiresAdmin ? ModerationActions.None : SuggestedAction;
    }
}
