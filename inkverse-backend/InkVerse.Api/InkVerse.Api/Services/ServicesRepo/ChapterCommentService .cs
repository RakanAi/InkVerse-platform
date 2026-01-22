using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using InkVerse.Api.Data; // your DbContext namespace
using InkVerse.Api.DTOs.Comment;
using InkVerse.Api.Services.InterFace;

public class ChapterCommentService : IChapterCommentService
{
    private readonly InkVerseDB _db;

    public ChapterCommentService(InkVerseDB db)
    {
        _db = db;
    }

    public async Task<List<ChapterCommentDto>> GetChapterCommentsAsync(int chapterId, string? userId)
    {
        // Load all comments for chapter + reactions (1 query-ish)
        var comments = await _db.ChapterComments
            .AsNoTracking()
            .Where(c => c.ChapterId == chapterId && !c.IsDeleted)
            .Include(c => c.User)
            .Include(c => c.Reactions)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new ChapterCommentDto
            {
                Id = c.ID,
                ChapterId = c.ChapterId,
                ParentCommentId = c.ParentCommentId,
                UserId = c.UserId ?? "",
                UserName = c.IsDeleted ? "Deleted" : (c.User != null ? c.User.UserName! : "Unknown"),
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
        // NOTE: your CommentCreateDto currently has no ParentCommentId
        // Add it if you want replies:
        // public int? ParentCommentId {get; set;}

        var parentId = dto.ParentCommentId;
        if (parentId == 0) parentId = null;

        var comment = new ChapterComment
        {
            ChapterId = chapterId,
            UserId = userId,
            Content = dto.Content,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null,
            ParentCommentId = parentId // <-- update to use parentId for replies support in DTO
        };

        _db.ChapterComments.Add(comment);
        await _db.SaveChangesAsync();

        // Return the created comment as DTO
        var userName = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.UserName)
            .FirstOrDefaultAsync() ?? "Unknown";

        return new ChapterCommentDto
        {
            Id = comment.ID,
            ChapterId = chapterId,
            ParentCommentId = comment.ParentCommentId,
            UserId = userId,
            UserName = userName,
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
            ParentCommentId = comment.ParentCommentId,
            UserId = comment.UserId,
            UserName = comment.User?.UserName ?? "Unknown",
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
