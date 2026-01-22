using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Review;
using InkVerse.Api.Entities;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class ReviewService : IReviewService
    {
        private readonly InkVerseDB _db;

        public ReviewService(InkVerseDB db)
        {
            _db = db;
        }

        private static double Clamp(double v, double min, double max)
    => v < min ? min : (v > max ? max : v);

        private static double ComputeOverallRating(ReviewCreateDto dto)
        {
            // clamp to be safe
            var ca = Clamp(dto.CharacterAccuracy, 0, 5);
            var cr = Clamp(dto.ChemistryRelationships, 0, 5);
            var pc = Clamp(dto.PlotCreativity, 0, 5);
            var ci = Clamp(dto.CanonIntegration, 0, 5);

            // emotional damage stored raw: 1=MAX damage, 5=NO damage
            var ed = Clamp(dto.EmotionalDamage, 1, 5);

            // invert for scoring
            var normalizedDamage = 6 - ed; // 1->5, 5->1

            var overall = (ca + cr + pc + ci + normalizedDamage) / 5.0;
            return Math.Round(overall, 1);
        }

        public async Task<List<ReviewReadDto>> GetReviewsForBookAsync(int bookId, string? currentUserId)
        {
            return await _db.Reviews
                .Where(r => r.BookId == bookId)
                .Include(r => r.User)
                .Include(r => r.Reactions)
                .Include(r => r.Book)
                .Select(r => new ReviewReadDto
                {
                    Id = r.ID,
                    Content = r.Content,
                    Rating = r.Rating,

                    UserId = r.UserId,
                    UserName = r.User != null ? r.User.UserName : "Unknown",

                    // ✅ THIS is the avatar
                    UserAvatarUrl = r.User != null ? r.User.AvatarUrl : null,

                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,

                    Likes = r.Reactions.Count(x => x.ReactionType == "like"),
                    Dislikes = r.Reactions.Count(x => x.ReactionType == "dislike"),

                    MyReaction = currentUserId == null
                        ? null
                        : r.Reactions
                            .Where(x => x.UserId == currentUserId)
                            .Select(x => x.ReactionType)
                            .FirstOrDefault(),

                    BookId = r.BookId,
                    BookTitle = r.Book != null ? r.Book.Title : null,
                    // if you have it:
                    // BookCoverUrl = r.Book != null ? r.Book.CoverUrl : null,

                    CharacterAccuracy = r.CharacterAccuracy,
                    ChemistryRelationships = r.ChemistryRelationships,
                    PlotCreativity = r.PlotCreativity,
                    CanonIntegration = r.CanonIntegration,
                    EmotionalDamage = r.EmotionalDamage
                })
                .ToListAsync();
        }


        public async Task<ReviewReadDto?> AddOrUpdateReviewAsync(int bookId, string userId, ReviewCreateDto dto)
        {
            var existing = await _db.Reviews
                .Include(r => r.Reactions)
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.BookId == bookId && r.UserId == userId);

            var overallRating = ComputeOverallRating(dto);

            if (existing != null)
            {
                existing.Content = dto.Content;
                existing.CharacterAccuracy = dto.CharacterAccuracy;
                existing.ChemistryRelationships = dto.ChemistryRelationships;
                existing.PlotCreativity = dto.PlotCreativity;
                existing.CanonIntegration = dto.CanonIntegration;
                existing.EmotionalDamage = dto.EmotionalDamage;

                existing.Rating = overallRating;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                existing = new Review
                {
                    BookId = bookId,
                    UserId = userId,
                    Content = dto.Content,

                    CharacterAccuracy = dto.CharacterAccuracy,
                    ChemistryRelationships = dto.ChemistryRelationships,
                    PlotCreativity = dto.PlotCreativity,
                    CanonIntegration = dto.CanonIntegration,
                    EmotionalDamage = dto.EmotionalDamage,

                    Rating = overallRating,
                    CreatedAt = DateTime.UtcNow
                };
                _db.Reviews.Add(existing);
            }

            await _db.SaveChangesAsync();
            await RecalcBookAverageRatingAsync(bookId);

            return new ReviewReadDto
            {
                Id = existing.ID,
                Content = existing.Content,
                Rating = existing.Rating,
                UserId = existing.UserId,
                UserName = existing.User?.UserName ?? "Unknown",

                UserAvatarUrl = (existing.User?.AvatarUrl),
                CreatedAt = existing.CreatedAt,
                UpdatedAt = existing.UpdatedAt,

                Likes = existing.Reactions.Count(x => x.ReactionType == "like"),
                Dislikes = existing.Reactions.Count(x => x.ReactionType == "dislike"),

                CharacterAccuracy = existing.CharacterAccuracy,
                ChemistryRelationships = existing.ChemistryRelationships,
                PlotCreativity = existing.PlotCreativity,
                CanonIntegration = existing.CanonIntegration,
                EmotionalDamage = existing.EmotionalDamage
            };
        }

        public async Task<ReviewReadDto?> UpdateReviewAsync(int reviewId, string userId, ReviewCreateDto dto)
{
    var review = await _db.Reviews
        .Include(r => r.User)
        .Include(r => r.Reactions)
        .FirstOrDefaultAsync(r => r.ID == reviewId && r.UserId == userId);

    if (review == null) return null;

    review.Content = dto.Content;
    review.CharacterAccuracy = dto.CharacterAccuracy;
    review.ChemistryRelationships = dto.ChemistryRelationships;
    review.PlotCreativity = dto.PlotCreativity;
    review.CanonIntegration = dto.CanonIntegration;
    review.EmotionalDamage = dto.EmotionalDamage;

    review.Rating = ComputeOverallRating(dto);
    review.UpdatedAt = DateTime.UtcNow;

    await _db.SaveChangesAsync();
            await RecalcBookAverageRatingAsync(review.BookId);

            return new ReviewReadDto
    {
        Id = review.ID,
        Content = review.Content,
        Rating = review.Rating,
        UserId = review.UserId,
        UserName = review.User?.UserName ?? "Unknown",
        CreatedAt = review.CreatedAt,

                UserAvatarUrl = (review.User?.AvatarUrl),

                Likes = review.Reactions.Count(x => x.ReactionType == "like"),
        Dislikes = review.Reactions.Count(x => x.ReactionType == "dislike"),

        CharacterAccuracy = review.CharacterAccuracy,
        ChemistryRelationships = review.ChemistryRelationships,
        PlotCreativity = review.PlotCreativity,
        CanonIntegration = review.CanonIntegration,
        EmotionalDamage = review.EmotionalDamage
    };
}

        public async Task<bool> DeleteReviewAsync(int reviewId, string userId)
        {
            var review = await _db.Reviews
                .Include(r => r.Reactions)
                .Include(r => r.Replies)
                    .ThenInclude(rep => rep.Reactions)
                .FirstOrDefaultAsync(r => r.ID == reviewId);

            if (review == null || review.UserId != userId) return false;
            var bookId = review.BookId;
            // ✅ delete reply reactions first
            foreach (var reply in review.Replies)
            {
                if (reply.Reactions.Any())
                    _db.ReviewReplyReactions.RemoveRange(reply.Reactions);
            }

            // ✅ delete replies
            if (review.Replies.Any())
                _db.ReviewReplies.RemoveRange(review.Replies);

            // ✅ delete review reactions
            if (review.Reactions.Any())
                _db.ReviewReaction.RemoveRange(review.Reactions);

            // ✅ delete review
            _db.Reviews.Remove(review);

            await _db.SaveChangesAsync();
            await RecalcBookAverageRatingAsync(bookId);

            return true;
        }


        public async Task<bool> ReactToReviewAsync(int reviewId, string userId, string reactionType)
        {
            if (reactionType != "like" && reactionType != "dislike") return false;

            var review = await _db.Reviews.Include(r => r.Reactions).FirstOrDefaultAsync(r => r.ID == reviewId);
            if (review == null) return false;

            var existing = review.Reactions.FirstOrDefault(r => r.UserId == userId);
            if (existing != null)
            {
                // ✅ If user clicks same reaction again => remove it (undo)
                if (existing.ReactionType == reactionType)
                {
                    _db.ReviewReaction.Remove(existing); // or _db.Remove(existing)
                    await _db.SaveChangesAsync();
                    return true;
                }

                // ✅ switch like <-> dislike
                existing.ReactionType = reactionType;
            }
            else
            {
                review.Reactions.Add(new ReviewReaction
                {
                    UserId = userId,
                    ReactionType = reactionType,
                    CreatedAt = DateTime.UtcNow,

                });
            }

            await _db.SaveChangesAsync();
            return true;

        }

        public async Task<List<ReviewReadDto>> GetRecentReviewsAsync(int take)
        {
            take = take <= 0 ? 10 : Math.Min(take, 20);

            return await _db.Reviews
                .Include(r => r.User)
                .Include(r => r.Reactions)
                .Include(r => r.Book)

                .OrderByDescending(r => r.CreatedAt)
                .Take(take)
                .Select(r => new ReviewReadDto
                {
                    Id = r.ID,
                    Content = r.Content,
                    Rating = r.Rating,
                    UserId = r.UserId,
                    UserName = r.User != null ? r.User.UserName : "Unknown",
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt,
                    Likes = r.Reactions.Count(x => x.ReactionType == "like"),
                    Dislikes = r.Reactions.Count(x => x.ReactionType == "dislike"),
                    BookId = r.BookId,
BookTitle = r.Book != null ? r.Book.Title : null,


                    CharacterAccuracy = r.CharacterAccuracy,
                    ChemistryRelationships = r.ChemistryRelationships,
                    PlotCreativity = r.PlotCreativity,
                    CanonIntegration = r.CanonIntegration,
                    EmotionalDamage = r.EmotionalDamage,
                    UserAvatarUrl = r.User != null ? r.User.AvatarUrl : null,

                })
                .ToListAsync();
        }

        private async Task RecalcBookAverageRatingAsync(int bookId)
        {
            var avg = await _db.Reviews
                .Where(r => r.BookId == bookId)
                .Select(r => (double?)r.Rating)
                .AverageAsync() ?? 0;

            var book = await _db.Books.FirstOrDefaultAsync(b => b.ID == bookId);
            if (book == null) return;

            book.AverageRating = Math.Round(avg, 2);
            book.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }


    }
}
