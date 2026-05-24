using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using InkVerse.Api.Data; // your DbContext namespace
using InkVerse.Api.DTOs.Comment;
using InkVerse.Api.Entities.Notifications;
using InkVerse.Api.Services.InterFace;

public class ChapterCommentService : IChapterCommentService
{
    private readonly InkVerseDB _db;
    private readonly IAchievementService _achievements;
    private readonly INotificationService _notifications;

    public ChapterCommentService(InkVerseDB db, IAchievementService achievements, INotificationService notifications)
    {
        _db = db;
        _achievements = achievements;
        _notifications = notifications;
    }

    public async Task<List<ChapterCommentDto>> GetChapterCommentsAsync(
        int chapterId,
        string? userId,
        string? paragraphId = null,
        bool includeAll = false)
    {
        var normalizedParagraphId = string.IsNullOrWhiteSpace(paragraphId)
            ? null
            : paragraphId.Trim();

        var commentsQuery = _db.ChapterComments
            .AsNoTracking()
            .Where(c => c.ChapterId == chapterId && !c.IsDeleted);

        if (!includeAll)
        {
            commentsQuery = normalizedParagraphId == null
                ? commentsQuery.Where(c => c.ParagraphId == null || c.ParagraphId == "")
                : commentsQuery.Where(c => c.ParagraphId == normalizedParagraphId);
        }

        var comments = await commentsQuery
            .Include(c => c.User)
            .Include(c => c.Reactions)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new ChapterCommentDto
            {
                Id = c.ID,
                ChapterId = c.ChapterId,
                ParagraphId = c.ParagraphId,
                ParentCommentId = c.ParentCommentId,
                UserId = c.UserId ?? "",
                UserName = c.IsDeleted ? "Deleted" : (c.User != null ? c.User.UserName! : "Unknown"),
                UserAvatarUrl = c.IsDeleted ? null : c.User != null ? c.User.AvatarUrl : null,
                Content = c.IsDeleted ? "[deleted]" : c.Content,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt ?? c.CreatedAt,
                Likes = c.Reactions.Count(r => r.Value == 1),
                Dislikes = c.Reactions.Count(r => r.Value == -1),
                MyReaction = userId == null ? 0 : c.Reactions
                    .Where(r => r.UserId == userId)
                    .Select(r => r.Value)
                    .FirstOrDefault(),
                Replies = new List<ChapterCommentDto>()
            })
            .ToListAsync();

        // Build tree
        var byId = comments.ToDictionary(x => x.Id);
        var roots = new List<ChapterCommentDto>();

        foreach (var c in comments)
        {
            if (c.ParentCommentId is int pid && byId.TryGetValue(pid, out var parent))
                parent.Replies.Add(c);
            else
                roots.Add(c);
        }

        return roots;
    }

    public async Task<ChapterCommentDto> AddCommentAsync(int chapterId, string userId, CommentCreateDto dto)
    {
        var parentId = dto.ParentCommentId;
        if (parentId == 0) parentId = null;

        var normalizedParagraphId = string.IsNullOrWhiteSpace(dto.ParagraphId)
            ? null
            : dto.ParagraphId.Trim();

        if (parentId.HasValue)
        {
            var parent = await _db.ChapterComments
                .AsNoTracking()
                .Where(c => c.ID == parentId.Value && !c.IsDeleted)
                .Select(c => new { c.ChapterId, c.ParagraphId })
                .FirstOrDefaultAsync();

            if (parent == null)
                throw new ArgumentException("Parent comment was not found.");

            if (parent.ChapterId != chapterId)
                throw new InvalidOperationException("Replies must stay in the same chapter.");

            normalizedParagraphId = string.IsNullOrWhiteSpace(parent.ParagraphId)
                ? null
                : parent.ParagraphId.Trim();
        }

        var comment = new ChapterComment
        {
            ChapterId = chapterId,
            UserId = userId,
            Content = dto.Content,
            ParagraphId = normalizedParagraphId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null,
            ParentCommentId = parentId // <-- update to use parentId for replies support in DTO
        };

        _db.ChapterComments.Add(comment);
        await _db.SaveChangesAsync();
        await _achievements.RefreshAchievementsAsync(userId);

        var chapter = await _db.Chapters
            .AsNoTracking()
            .Include(item => item.Book)
            .FirstOrDefaultAsync(item => item.ID == chapterId);

        if (parentId.HasValue)
        {
            var parentOwnerId = await _db.ChapterComments
                .AsNoTracking()
                .Where(item => item.ID == parentId.Value)
                .Select(item => item.UserId)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrWhiteSpace(parentOwnerId))
            {
                await _notifications.NotifyAsync(new NotificationCreateRequest(
                    RecipientId: parentOwnerId,
                    ActorId: userId,
                    Category: NotificationCategories.Interactions,
                    Type: NotificationTypes.CommentReply,
                    Title: "New reply to your comment",
                    Body: $"Someone replied to your comment on {chapter?.Book?.Title ?? "a chapter"}.",
                    LinkUrl: chapter == null ? null : $"/book/{chapter.BookId}/chapter/{chapter.ID}",
                    TargetType: "chapter_comment",
                    TargetId: comment.ID.ToString(),
                    DedupeKey: $"comment-reply:{comment.ID}"));
            }
        }
        else if (!string.IsNullOrWhiteSpace(chapter?.Book?.AuthorId))
        {
            await _notifications.NotifyAsync(new NotificationCreateRequest(
                RecipientId: chapter.Book.AuthorId,
                ActorId: userId,
                Category: NotificationCategories.AuthorActivity,
                Type: NotificationTypes.NewChapterComment,
                Title: "New comment on your book",
                Body: $"{chapter.Book.Title} received a new chapter comment.",
                LinkUrl: $"/book/{chapter.BookId}/chapter/{chapter.ID}",
                TargetType: "chapter_comment",
                TargetId: comment.ID.ToString(),
                DedupeKey: $"chapter-comment:{comment.ID}"));
        }

        // Return the created comment as DTO
        var userProfile = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.UserName,
                u.AvatarUrl,
            })
            .FirstOrDefaultAsync();

        return new ChapterCommentDto
        {
            Id = comment.ID,
            ChapterId = chapterId,
            ParagraphId = comment.ParagraphId,
            ParentCommentId = comment.ParentCommentId,
            UserId = userId,
            UserName = userProfile?.UserName ?? "Unknown",
            UserAvatarUrl = userProfile?.AvatarUrl,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            Likes = 0,
            Dislikes = 0,
            MyReaction = 0,
            Replies = new List<ChapterCommentDto>()
        };
    }

    public async Task ToggleReactionAsync(int commentId, string userId, int value)
    {
        if (value != 1 && value != -1)
            throw new ArgumentException("Reaction value must be 1 or -1.");

        var existing = await _db.ChapterCommentReaction
            .SingleOrDefaultAsync(r => r.CommentId == commentId && r.UserId == userId);
        var shouldNotifyLike = value == 1 && (existing == null || existing.Value != 1);

        if (existing == null)
        {
            _db.ChapterCommentReaction.Add(new ChapterCommentReaction
            {
                CommentId = commentId,
                UserId = userId,
                Value = value,
                CreatedAt = DateTime.UtcNow
            });
        }
        else if (existing.Value == value)
        {
            // toggle off
            _db.ChapterCommentReaction.Remove(existing);
        }
        else
        {
            // switch like <-> dislike
            existing.Value = value;
        }

        await _db.SaveChangesAsync();

        if (shouldNotifyLike)
        {
            var comment = await _db.ChapterComments
                .AsNoTracking()
                .Include(item => item.Chapter)
                    .ThenInclude(chapter => chapter!.Book)
                .FirstOrDefaultAsync(item => item.ID == commentId && !item.IsDeleted);

            if (comment != null)
            {
                await _notifications.NotifyAsync(new NotificationCreateRequest(
                    RecipientId: comment.UserId,
                    ActorId: userId,
                    Category: NotificationCategories.Interactions,
                    Type: NotificationTypes.CommentLike,
                    Title: "Someone liked your comment",
                    Body: $"Your comment on {comment.Chapter?.Book?.Title ?? "a chapter"} got a helpful reaction.",
                    LinkUrl: comment.Chapter == null ? null : $"/book/{comment.Chapter.BookId}/chapter/{comment.Chapter.ID}",
                    TargetType: "chapter_comment",
                    TargetId: comment.ID.ToString(),
                    DedupeKey: $"comment-like:{comment.ID}:{userId}"));
            }
        }
    }

    public async Task DeleteCommentAsync(int commentId, string userId)
    {
        var root = await _db.ChapterComments.FirstOrDefaultAsync(c => c.ID == commentId);
        if (root == null) return;

        if (root.UserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own comment.");

        // load all comments in the same chapter to find descendants
        var all = await _db.ChapterComments
            .Where(c => c.ChapterId == root.ChapterId)
            .Select(c => new { c.ID, c.ParentCommentId })
            .ToListAsync();

        var childrenMap = all
            .Where(x => x.ParentCommentId != null)
            .GroupBy(x => x.ParentCommentId!.Value)
            .ToDictionary(g => g.Key, g => g.Select(x => x.ID).ToList());

        var toDelete = new HashSet<int>();
        var stack = new Stack<int>();
        stack.Push(commentId);

        while (stack.Count > 0)
        {
            var current = stack.Pop();
            if (!toDelete.Add(current)) continue;

            if (childrenMap.TryGetValue(current, out var kids))
                foreach (var k in kids) stack.Push(k);
        }

        var entities = await _db.ChapterComments
            .Where(c => toDelete.Contains(c.ID))
            .ToListAsync();

        foreach (var c in entities)
        {
            c.IsDeleted = true;
        }

        await _db.SaveChangesAsync();
    }

    public async Task<ChapterCommentDto> UpdateCommentAsync(int commentId, string userId, CommentUpdateDto dto)
    {
        var content = dto.Content?.Trim();
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Content is required.");

        var comment = await _db.ChapterComments
            .Include(c => c.User)
            .Include(c => c.Reactions)
            .FirstOrDefaultAsync(c => c.ID == commentId);

        if (comment == null)
            throw new KeyNotFoundException("Comment not found.");

        if (comment.IsDeleted) // if you have IsDeleted
            throw new InvalidOperationException("Cannot edit a deleted comment.");

        if (comment.UserId != userId)
            throw new UnauthorizedAccessException("You can only edit your own comment.");

        comment.Content = content;
        comment.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return new ChapterCommentDto
        {
            Id = comment.ID,
            ChapterId = comment.ChapterId,
            ParagraphId = comment.ParagraphId,
            ParentCommentId = comment.ParentCommentId,
            UserId = comment.UserId,
            UserName = comment.User?.UserName ?? "Unknown",
            UserAvatarUrl = comment.User?.AvatarUrl,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = (DateTime)comment.UpdatedAt,
            Likes = comment.Reactions.Count(r => r.Value == 1),
            Dislikes = comment.Reactions.Count(r => r.Value == -1),
            MyReaction = comment.Reactions.Where(r => r.UserId == userId).Select(r => r.Value).FirstOrDefault(),
            Replies = new List<ChapterCommentDto>() // not needed here; your GET builds the tree
        };
    }

}
