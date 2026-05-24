using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Reports;
using InkVerse.Api.Entities;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Entities.Notifications;
using InkVerse.Api.Entities.Reports;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Services.ServicesRepo;

public class ContentReportService : IContentReportService
{
    private static readonly HashSet<string> ValidReasons = new(StringComparer.OrdinalIgnoreCase)
    {
        "spam",
        "harassment",
        "hate_abuse",
        "sexual_content",
        "violence",
        "illegal_content",
        "copyright_ip",
        "impersonation",
        "private_information",
        "other",
    };

    private readonly InkVerseDB _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly INotificationService _notifications;

    public ContentReportService(InkVerseDB db, UserManager<AppUser> userManager, INotificationService notifications)
    {
        _db = db;
        _userManager = userManager;
        _notifications = notifications;
    }

    public async Task<ContentReportDto> CreateReportAsync(string reporterId, CreateContentReportDto dto)
    {
        var targetType = NormalizeTargetType(dto.TargetType);
        var targetId = (dto.TargetId ?? "").Trim();
        var reason = NormalizeReason(dto.Reason);
        var details = Clean(dto.Details, 2000);

        if (string.IsNullOrWhiteSpace(targetId))
            throw new InvalidOperationException("Report target is required.");

        var reporter = await _userManager.FindByIdAsync(reporterId)
            ?? throw new UnauthorizedAccessException("Reporter not found.");

        if (reporter.IsBlocked)
            throw new UnauthorizedAccessException("Your account is blocked.");

        var metadata = await ResolveTargetAsync(targetType, targetId)
            ?? throw new KeyNotFoundException("Report target was not found.");

        targetId = metadata.TargetId;

        var existing = await _db.ContentReports
            .AsNoTracking()
            .FirstOrDefaultAsync(report =>
                report.ReporterId == reporterId &&
                report.TargetType == targetType &&
                report.TargetId == targetId &&
                report.Status == ContentReportStatuses.Pending);

        if (existing != null)
            return ToPublicDto(existing);

        var now = DateTime.UtcNow;
        var report = new ContentReport
        {
            ReporterId = reporterId,
            TargetType = targetType,
            TargetId = targetId,
            TargetOwnerId = metadata.TargetOwnerId,
            Reason = reason,
            Details = details,
            Status = ContentReportStatuses.Pending,
            TargetTitle = metadata.TargetTitle,
            TargetPreview = metadata.TargetPreview,
            TargetContext = metadata.TargetContext,
            TargetUrl = metadata.TargetUrl,
            AdminTargetUrl = metadata.AdminTargetUrl,
            CreatedBy = reporterId,
            CreatedAt = now,
        };

        _db.ContentReports.Add(report);
        await _db.SaveChangesAsync();

        var admins = (await _userManager.GetUsersInRoleAsync("Admin")).Select(item => item.Id);
        await _notifications.NotifyManyAsync(admins, new NotificationCreateRequest(
            RecipientId: "",
            ActorId: reporterId,
            Category: NotificationCategories.Reports,
            Type: NotificationTypes.ReportCreated,
            Title: "New user report",
            Body: $"{report.TargetTitle} was reported for {report.Reason}.",
            LinkUrl: "/admin/reports",
            TargetType: "report",
            TargetId: report.ID.ToString(),
            DedupeKey: $"report-created:{report.ID}"));

        return ToPublicDto(report);
    }

    public async Task<List<AdminContentReportDto>> GetAdminReportsAsync(string? status, string? type)
    {
        var normalizedStatus = NormalizeOptionalStatus(status);
        var normalizedType = NormalizeOptionalTargetType(type);

        var query = _db.ContentReports
            .AsNoTracking()
            .Include(report => report.Reporter)
            .Include(report => report.TargetOwner)
            .Include(report => report.ResolvedBy)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(normalizedStatus))
        {
            query = query.Where(report => report.Status == normalizedStatus);
        }

        if (!string.IsNullOrWhiteSpace(normalizedType))
        {
            query = query.Where(report => report.TargetType == normalizedType);
        }

        var reports = await query
            .OrderBy(report => report.Status == ContentReportStatuses.Pending ? 0 : 1)
            .ThenByDescending(report => report.CreatedAt)
            .ToListAsync();

        return reports.Select(ToAdminDto).ToList();
    }

    public async Task<AdminContentReportDto?> GetAdminReportAsync(int id)
    {
        var report = await _db.ContentReports
            .AsNoTracking()
            .Include(item => item.Reporter)
            .Include(item => item.TargetOwner)
            .Include(item => item.ResolvedBy)
            .FirstOrDefaultAsync(item => item.ID == id);

        return report == null ? null : ToAdminDto(report);
    }

    public Task<AdminContentReportDto?> ResolveReportAsync(int id, string adminId, string? note)
    {
        return DecideReportAsync(id, adminId, ContentReportStatuses.Resolved, note);
    }

    public Task<AdminContentReportDto?> DismissReportAsync(int id, string adminId, string? note)
    {
        return DecideReportAsync(id, adminId, ContentReportStatuses.Dismissed, note);
    }

    public Task<int> CountOpenReportsAsync()
    {
        return _db.ContentReports.CountAsync(report => report.Status == ContentReportStatuses.Pending);
    }

    private async Task<AdminContentReportDto?> DecideReportAsync(int id, string adminId, string status, string? note)
    {
        var report = await _db.ContentReports.FirstOrDefaultAsync(item => item.ID == id);
        if (report == null) return null;

        report.Status = status;
        report.ResolvedById = adminId;
        report.ResolvedAt = DateTime.UtcNow;
        report.AdminNote = Clean(note, 2000);
        report.UpdatedBy = adminId;
        report.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await _notifications.NotifyAsync(new NotificationCreateRequest(
            RecipientId: report.ReporterId,
            ActorId: adminId,
            Category: NotificationCategories.Reports,
            Type: status == ContentReportStatuses.Resolved
                ? NotificationTypes.ReportResolved
                : NotificationTypes.ReportDismissed,
            Title: status == ContentReportStatuses.Resolved
                ? "Your report was resolved"
                : "Your report was reviewed",
            Body: $"{report.TargetTitle} has been marked {status}.",
            LinkUrl: report.TargetUrl,
            TargetType: "report",
            TargetId: report.ID.ToString(),
            DedupeKey: $"report-decision:{report.ID}:{status}"));
        return await GetAdminReportAsync(id);
    }

    private async Task<ReportTargetMetadata?> ResolveTargetAsync(string targetType, string targetId)
    {
        return targetType switch
        {
            ContentReportTargetTypes.Book => await ResolveBookAsync(targetId),
            ContentReportTargetTypes.Review => await ResolveReviewAsync(targetId),
            ContentReportTargetTypes.ReviewReply => await ResolveReviewReplyAsync(targetId),
            ContentReportTargetTypes.ChapterComment => await ResolveChapterCommentAsync(targetId),
            ContentReportTargetTypes.User => await ResolveUserAsync(targetId),
            _ => null,
        };
    }

    private async Task<ReportTargetMetadata?> ResolveBookAsync(string targetId)
    {
        if (!int.TryParse(targetId, out var id)) return null;

        var book = await _db.Books
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.ID == id);

        if (book == null) return null;

        return new ReportTargetMetadata(
            TargetId: book.ID.ToString(),
            TargetOwnerId: book.AuthorId,
            TargetTitle: book.Title,
            TargetPreview: Truncate(book.Description, 320),
            TargetContext: book.AuthorName ?? "",
            TargetUrl: $"/book/{book.ID}",
            AdminTargetUrl: $"/admin/books/{book.ID}");
    }

    private async Task<ReportTargetMetadata?> ResolveReviewAsync(string targetId)
    {
        if (!int.TryParse(targetId, out var id)) return null;

        var review = await _db.Reviews
            .AsNoTracking()
            .Include(item => item.Book)
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.ID == id);

        if (review == null) return null;

        var bookTitle = review.Book?.Title ?? "Unknown book";
        var userName = review.User?.UserName ?? "Unknown user";

        return new ReportTargetMetadata(
            TargetId: review.ID.ToString(),
            TargetOwnerId: review.UserId,
            TargetTitle: $"Review on {bookTitle}",
            TargetPreview: Truncate(review.Content ?? review.ReviewTitle, 320),
            TargetContext: $"By {userName}",
            TargetUrl: $"/book/{review.BookId}",
            AdminTargetUrl: $"/admin/books/{review.BookId}");
    }

    private async Task<ReportTargetMetadata?> ResolveReviewReplyAsync(string targetId)
    {
        if (!int.TryParse(targetId, out var id)) return null;

        var reply = await _db.ReviewReplies
            .AsNoTracking()
            .Include(item => item.Review)
            .ThenInclude(review => review!.Book)
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.Id == id);

        if (reply == null || reply.Review == null) return null;

        var bookTitle = reply.Review.Book?.Title ?? "Unknown book";
        var userName = reply.User?.UserName ?? "Unknown user";

        return new ReportTargetMetadata(
            TargetId: reply.Id.ToString(),
            TargetOwnerId: reply.UserId,
            TargetTitle: $"Reply on review for {bookTitle}",
            TargetPreview: Truncate(reply.Content, 320),
            TargetContext: $"By {userName}",
            TargetUrl: $"/book/{reply.Review.BookId}",
            AdminTargetUrl: $"/admin/books/{reply.Review.BookId}");
    }

    private async Task<ReportTargetMetadata?> ResolveChapterCommentAsync(string targetId)
    {
        if (!int.TryParse(targetId, out var id)) return null;

        var comment = await _db.ChapterComments
            .AsNoTracking()
            .Include(item => item.Chapter)
            .ThenInclude(chapter => chapter!.Book)
            .Include(item => item.User)
            .FirstOrDefaultAsync(item => item.ID == id);

        if (comment == null) return null;

        var chapter = comment.Chapter;
        var bookTitle = chapter?.Book?.Title ?? "Unknown book";
        var userName = comment.User?.UserName ?? "Unknown user";
        var title = comment.ParentCommentId.HasValue
            ? $"Comment reply on {bookTitle}"
            : $"Chapter comment on {bookTitle}";

        return new ReportTargetMetadata(
            TargetId: comment.ID.ToString(),
            TargetOwnerId: comment.UserId,
            TargetTitle: title,
            TargetPreview: Truncate(comment.Content, 320),
            TargetContext: $"By {userName}",
            TargetUrl: chapter == null ? null : $"/book/{chapter.BookId}/chapter/{chapter.ID}",
            AdminTargetUrl: chapter == null ? null : $"/admin/books/{chapter.BookId}/chapters/{chapter.ID}");
    }

    private async Task<ReportTargetMetadata?> ResolveUserAsync(string targetId)
    {
        var normalized = targetId.Trim();
        var user = await _userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(item =>
                item.Id == normalized ||
                (item.UserName != null && item.UserName.ToLower() == normalized.ToLower()));

        if (user == null) return null;

        return new ReportTargetMetadata(
            TargetId: user.Id,
            TargetOwnerId: user.Id,
            TargetTitle: user.UserName ?? user.Email ?? "Unknown user",
            TargetPreview: Truncate(user.Bio, 320),
            TargetContext: user.Email ?? "",
            TargetUrl: string.IsNullOrWhiteSpace(user.UserName) ? null : $"/users/{Uri.EscapeDataString(user.UserName)}",
            AdminTargetUrl: "/admin/users");
    }

    private static ContentReportDto ToPublicDto(ContentReport report)
    {
        return new ContentReportDto
        {
            Id = report.ID,
            TargetType = report.TargetType,
            TargetId = report.TargetId,
            Reason = report.Reason,
            Details = report.Details,
            Status = report.Status,
            TargetTitle = report.TargetTitle,
            TargetPreview = report.TargetPreview,
            TargetContext = report.TargetContext,
            TargetUrl = report.TargetUrl,
            AdminTargetUrl = report.AdminTargetUrl,
            CreatedAt = report.CreatedAt,
        };
    }

    private static AdminContentReportDto ToAdminDto(ContentReport report)
    {
        return new AdminContentReportDto
        {
            Id = report.ID,
            TargetType = report.TargetType,
            TargetId = report.TargetId,
            Reason = report.Reason,
            Details = report.Details,
            Status = report.Status,
            TargetTitle = report.TargetTitle,
            TargetPreview = report.TargetPreview,
            TargetContext = report.TargetContext,
            TargetUrl = report.TargetUrl,
            AdminTargetUrl = report.AdminTargetUrl,
            CreatedAt = report.CreatedAt,
            ReporterId = report.ReporterId,
            ReporterName = report.Reporter?.UserName ?? report.Reporter?.Email ?? "",
            ReporterEmail = report.Reporter?.Email,
            TargetOwnerId = report.TargetOwnerId,
            TargetOwnerName = report.TargetOwner?.UserName ?? report.TargetOwner?.Email,
            TargetOwnerEmail = report.TargetOwner?.Email,
            ResolvedAt = report.ResolvedAt,
            ResolvedById = report.ResolvedById,
            ResolvedByName = report.ResolvedBy?.UserName ?? report.ResolvedBy?.Email,
            AdminNote = report.AdminNote,
        };
    }

    private static string NormalizeTargetType(string value)
    {
        var normalized = (value ?? "").Trim().ToLowerInvariant();
        return ContentReportTargetTypes.All.Contains(normalized)
            ? normalized
            : throw new InvalidOperationException("Invalid report target type.");
    }

    private static string? NormalizeOptionalTargetType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        return NormalizeTargetType(value);
    }

    private static string NormalizeReason(string value)
    {
        var normalized = (value ?? "").Trim().ToLowerInvariant();
        return ValidReasons.Contains(normalized)
            ? normalized
            : throw new InvalidOperationException("Invalid report reason.");
    }

    private static string? NormalizeOptionalStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var normalized = value.Trim().ToLowerInvariant();
        return ContentReportStatuses.All.Contains(normalized)
            ? normalized
            : throw new InvalidOperationException("Invalid report status.");
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

    private sealed record ReportTargetMetadata(
        string TargetId,
        string? TargetOwnerId,
        string TargetTitle,
        string TargetPreview,
        string TargetContext,
        string? TargetUrl,
        string? AdminTargetUrl);
}
