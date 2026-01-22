using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.ReviewReply;
using InkVerse.Api.Entities;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class ReviewReplyService : IReviewReplyService
    {
        private readonly InkVerseDB _db;

        public ReviewReplyService(InkVerseDB db)
        {
            _db = db;
        }

        public async Task<List<ReviewReplyReadDto>> GetRepliesForReviewAsync(int reviewId, string? currentUserId)
        {
            return await _db.ReviewReplies
                .Where(x => x.ReviewId == reviewId)
                .Include(x => x.User)
                .Include(x => x.Reactions)
                .OrderBy(x => x.CreatedAt)
                .Select(x => new ReviewReplyReadDto
                {
                    Id = x.Id,
                    ReviewId = x.ReviewId,
                    UserId = x.UserId,
                    UserName = x.User != null ? x.User.UserName : "Unknown",
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
            // ensure review exists
            var reviewExists = await _db.Reviews.AnyAsync(r => r.ID == reviewId);
            if (!reviewExists) return null;

            var reply = new ReviewReply
            {
                ReviewId = reviewId,
                UserId = userId,
                Content = dto.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _db.ReviewReplies.Add(reply);
            await _db.SaveChangesAsync();

            // reload user for username (optional)
            var userName = await _db.Users
                .Where(u => u.Id == userId)
                .Select(u => u.UserName)
                .FirstOrDefaultAsync();

            return new ReviewReplyReadDto
            {
                Id = reply.Id,
                ReviewId = reply.ReviewId,
                UserId = reply.UserId,
                UserName = userName ?? "Unknown",
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
                .Include(x => x.Reactions)
                .FirstOrDefaultAsync(x => x.Id == replyId);

            if (reply == null) return null;
            if (reply.UserId != userId) return null;

            reply.Content = dto.Content.Trim();
            reply.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return new ReviewReplyReadDto
            {
                Id = reply.Id,
                ReviewId = reply.ReviewId,
                UserId = reply.UserId,
                UserName = reply.User?.UserName ?? "Unknown",
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
                .FirstOrDefaultAsync(x => x.Id == replyId);

            if (reply == null) return false;
            if (reply.UserId != userId) return false;

            // manual cascade
            if (reply.Reactions.Any())
                _db.ReviewReplyReactions.RemoveRange(reply.Reactions);

            _db.ReviewReplies.Remove(reply);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ReactToReplyAsync(int replyId, string userId, string reactionType)
        {
            var type = (reactionType ?? "").Trim().ToLowerInvariant();
            if (type != "like" && type != "dislike") return false;

            var reply = await _db.ReviewReplies
                .Include(x => x.Reactions)
                .FirstOrDefaultAsync(x => x.Id == replyId);

            if (reply == null) return false;

            var existing = reply.Reactions.FirstOrDefault(r => r.UserId == userId);
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
                return true;
            }

            reply.Reactions.Add(new ReviewReplyReaction
            {
                UserId = userId,
                ReactionType = type,
                CreatedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            return true;
        }
    }
}
