using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.ReviewReply;
using InkVerse.Api.Entities;
using InkVerse.Api.Entities.Notifications;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class ReviewReplyService : IReviewReplyService
    {
        private readonly InkVerseDB _db;
        private readonly INotificationService _notifications;

        public ReviewReplyService(InkVerseDB db, INotificationService notifications)
        {
            _db = db;
            _notifications = notifications;
        }

        public async Task<List<ReviewReplyReadDto>> GetRepliesForReviewAsync(int reviewId, string? currentUserId)
        {
            return await _db.ReviewReplies
                .Where(x => x.ReviewId == reviewId && !x.IsDeleted)
                .Include(x => x.User)
                .Include(x => x.ParentReply)
                    .ThenInclude(parent => parent!.User)
                .Include(x => x.Reactions)
                .OrderBy(x => x.CreatedAt)
                .Select(x => new ReviewReplyReadDto
                {
                    Id = x.Id,
                    ReviewId = x.ReviewId,
                    ParentReplyId = x.ParentReplyId,
                    ParentUserName = x.ParentReply != null && x.ParentReply.User != null
                        ? x.ParentReply.User.UserName
                        : null,
                    UserId = x.UserId,
                    UserName = x.User != null ? x.User.UserName : "Unknown",
                    UserAvatarUrl = x.User != null ? x.User.AvatarUrl : null,
                    Content = x.Content,
                    CreatedAt = x.CreatedAt,
                    UpdatedAt = x.UpdatedAt,

                    Likes = x.Reactions.Count(r => r.ReactionType == "like"),
                    Dislikes = x.Reactions.Count(r => r.ReactionType == "dislike"),

                    MyReaction = currentUserId == null
                        ? null
                        : x.Reactions
                            .Where(r => r.UserId == currentUserId)
                            .Select(r => r.ReactionType)
                            .FirstOrDefault()
                })
                .ToListAsync();
        }

        public async Task<ReviewReplyReadDto?> AddReplyAsync(int reviewId, string userId, ReviewReplyCreateDto dto)
        {
            var review = await _db.Reviews
                .AsNoTracking()
                .Include(r => r.Book)
                .FirstOrDefaultAsync(r => r.ID == reviewId && !r.IsDeleted);
            if (review == null) return null;

            int? parentReplyId = null;
            string? parentUserName = null;
            if (dto.ParentReplyId.HasValue)
            {
                var parent = await _db.ReviewReplies
                    .Include(reply => reply.User)
                    .FirstOrDefaultAsync(reply => reply.Id == dto.ParentReplyId.Value && reply.ReviewId == reviewId && !reply.IsDeleted);
                if (parent == null) return null;
                parentReplyId = parent.Id;
                parentUserName = parent.User?.UserName;
            }

            var reply = new ReviewReply
            {
                ReviewId = reviewId,
                ParentReplyId = parentReplyId,
                UserId = userId,
                Content = dto.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _db.ReviewReplies.Add(reply);
            await _db.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(review.UserId))
            {
                await _notifications.NotifyAsync(new NotificationCreateRequest(
                    RecipientId: review.UserId,
                    ActorId: userId,
                    Category: NotificationCategories.Interactions,
                    Type: NotificationTypes.ReviewReply,
                    Title: "New reply to your review",
                    Body: $"Someone replied to your review on {review.Book?.Title ?? "a book"}.",
                    LinkUrl: $"/book/{review.BookId}",
                    TargetType: "review_reply",
                    TargetId: reply.Id.ToString(),
                    DedupeKey: $"review-reply:{reply.Id}:review-owner"));
            }

            if (parentReplyId.HasValue)
            {
                var parentOwnerId = await _db.ReviewReplies
                    .AsNoTracking()
                    .Where(item => item.Id == parentReplyId.Value)
                    .Select(item => item.UserId)
                    .FirstOrDefaultAsync();

                if (!string.IsNullOrWhiteSpace(parentOwnerId) && parentOwnerId != review.UserId)
                {
                    await _notifications.NotifyAsync(new NotificationCreateRequest(
                        RecipientId: parentOwnerId,
                        ActorId: userId,
                        Category: NotificationCategories.Interactions,
                        Type: NotificationTypes.ReviewReply,
                        Title: "New reply in a review thread",
                        Body: $"Someone replied to you on {review.Book?.Title ?? "a book"}.",
                        LinkUrl: $"/book/{review.BookId}",
                        TargetType: "review_reply",
                        TargetId: reply.Id.ToString(),
                        DedupeKey: $"review-reply:{reply.Id}:parent-owner"));
                }
            }

            // reload user for username (optional)
            var userProfile = await _db.Users
                .Where(u => u.Id == userId)
                .Select(u => new
                {
                    u.UserName,
                    u.AvatarUrl,
                })
                .FirstOrDefaultAsync();

            return new ReviewReplyReadDto
            {
                Id = reply.Id,
                ReviewId = reply.ReviewId,
                ParentReplyId = reply.ParentReplyId,
                ParentUserName = parentUserName,
                UserId = reply.UserId,
                UserName = userProfile?.UserName ?? "Unknown",
                UserAvatarUrl = userProfile?.AvatarUrl,
                Content = reply.Content,
                CreatedAt = reply.CreatedAt,
                UpdatedAt = reply.UpdatedAt,
                Likes = 0,
                Dislikes = 0,
                MyReaction = null
            };
        }

        public async Task<ReviewReplyReadDto?> UpdateReplyAsync(int replyId, string userId, ReviewReplyUpdateDto dto)
        {
            var reply = await _db.ReviewReplies
                .Include(x => x.User)
                .Include(x => x.ParentReply)
                    .ThenInclude(parent => parent!.User)
                .Include(x => x.Reactions)
                .FirstOrDefaultAsync(x => x.Id == replyId && !x.IsDeleted);

            if (reply == null) return null;
            if (reply.UserId != userId) return null;

            reply.Content = dto.Content.Trim();
            reply.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return new ReviewReplyReadDto
            {
                Id = reply.Id,
                ReviewId = reply.ReviewId,
                ParentReplyId = reply.ParentReplyId,
                ParentUserName = reply.ParentReply?.User?.UserName,
                UserId = reply.UserId,
                UserName = reply.User?.UserName ?? "Unknown",
                UserAvatarUrl = reply.User?.AvatarUrl,
                Content = reply.Content,
                CreatedAt = reply.CreatedAt,
                UpdatedAt = reply.UpdatedAt,
                Likes = reply.Reactions.Count(r => r.ReactionType == "like"),
                Dislikes = reply.Reactions.Count(r => r.ReactionType == "dislike"),
                MyReaction = reply.Reactions.Where(r => r.UserId == userId).Select(r => r.ReactionType).FirstOrDefault()
            };
        }

        public async Task<bool> DeleteReplyAsync(int replyId, string userId)
        {
            var reply = await _db.ReviewReplies
                .Include(x => x.Reactions)
                .Include(x => x.Review)
                    .ThenInclude(review => review!.Book)
                .FirstOrDefaultAsync(x => x.Id == replyId && !x.IsDeleted);

            if (reply == null) return false;
            if (reply.UserId != userId) return false;

            var allReplies = await _db.ReviewReplies
                .Where(item => item.ReviewId == reply.ReviewId && !item.IsDeleted)
                .Include(item => item.Reactions)
                .ToListAsync();

            var idsToDelete = new HashSet<int> { reply.Id };
            var changed = true;
            while (changed)
            {
                changed = false;
                foreach (var item in allReplies)
                {
                    if (item.ParentReplyId.HasValue &&
                        idsToDelete.Contains(item.ParentReplyId.Value) &&
                        idsToDelete.Add(item.Id))
                    {
                        changed = true;
                    }
                }
            }

            var repliesToDelete = allReplies.Where(item => idsToDelete.Contains(item.Id)).ToList();
            foreach (var item in repliesToDelete)
            {
                item.IsDeleted = true;
                item.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ReactToReplyAsync(int replyId, string userId, string reactionType)
        {
            var type = (reactionType ?? "").Trim().ToLowerInvariant();
            if (type != "like" && type != "dislike") return false;

            var reply = await _db.ReviewReplies
                .Include(x => x.Reactions)
                .Include(x => x.Review)
                    .ThenInclude(review => review!.Book)
                .FirstOrDefaultAsync(x => x.Id == replyId && !x.IsDeleted);

            if (reply == null) return false;

            var existing = reply.Reactions.FirstOrDefault(r => r.UserId == userId);
            var shouldNotifyLike = type == "like" &&
                (existing == null || existing.ReactionType != "like");
            if (existing != null)
            {
                // click same => undo
                if (existing.ReactionType == type)
                {
                    _db.ReviewReplyReactions.Remove(existing);
                    await _db.SaveChangesAsync();
                    return true;
                }

                // switch
                existing.ReactionType = type;
                await _db.SaveChangesAsync();
                if (shouldNotifyLike)
                {
                    await _notifications.NotifyAsync(new NotificationCreateRequest(
                        RecipientId: reply.UserId,
                        ActorId: userId,
                        Category: NotificationCategories.Interactions,
                        Type: NotificationTypes.ReviewReplyLike,
                        Title: "Someone liked your reply",
                        Body: $"Your reply on {reply.Review?.Book?.Title ?? "a review"} got a helpful reaction.",
                        LinkUrl: reply.Review == null ? null : $"/book/{reply.Review.BookId}",
                        TargetType: "review_reply",
                        TargetId: reply.Id.ToString(),
                        DedupeKey: $"review-reply-like:{reply.Id}:{userId}"));
                }
                return true;
            }

            reply.Reactions.Add(new ReviewReplyReaction
            {
                UserId = userId,
                ReactionType = type,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            if (shouldNotifyLike)
            {
                await _notifications.NotifyAsync(new NotificationCreateRequest(
                    RecipientId: reply.UserId,
                    ActorId: userId,
                    Category: NotificationCategories.Interactions,
                    Type: NotificationTypes.ReviewReplyLike,
                    Title: "Someone liked your reply",
                    Body: $"Your reply on {reply.Review?.Book?.Title ?? "a review"} got a helpful reaction.",
                    LinkUrl: reply.Review == null ? null : $"/book/{reply.Review.BookId}",
                    TargetType: "review_reply",
                    TargetId: reply.Id.ToString(),
                    DedupeKey: $"review-reply-like:{reply.Id}:{userId}"));
            }
            return true;
        }
    }
}
