using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Book;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class RankingsService : IRankingsService
    {
        private readonly InkVerseDB _db;

        public RankingsService(InkVerseDB db)
        {
            _db = db;
        }

        public async Task<RankingsResponseDto> GetRankingsAsync(
            DateTime? nowUtc = null,
            CancellationToken ct = default)
        {
            var now = nowUtc ?? DateTime.UtcNow;
            var weekAgo = now.AddDays(-7);
            var monthAgo = now.AddMonths(-1);

            var baseQ = _db.Books.AsNoTracking();

            async Task<List<RankedBookDTO>> TopByReadsAsync(IQueryable<Book> q, int take)
            {
                return await q
                    .OrderByDescending(b => b.ReadCount)
                    .ThenByDescending(b => b.Rating)
                    .ThenByDescending(b => b.ID)
                    .Take(take)
                    .Select(b => new RankedBookDTO
                    {
                        Id = b.ID,
                        Title = b.Title,
                        Image = b.CoverImageUrl,
                        Rating = b.Rating,
                        ReadCount = b.ReadCount
                    })
                    .ToListAsync(ct);
            }

            async Task<List<RankedBookDTO>> TopByRatingAsync(IQueryable<Book> q, int take)
            {
                return await q
                    .OrderByDescending(b => b.Rating)
                    .ThenByDescending(b => b.ReadCount)
                    .ThenByDescending(b => b.ID)
                    .Take(take)
                    .Select(b => new RankedBookDTO
                    {
                        Id = b.ID,
                        Title = b.Title,
                        Image = b.CoverImageUrl,
                        Rating = b.Rating,
                        ReadCount = b.ReadCount
                    })
                    .ToListAsync(ct);
            }

            var weeklyQ = baseQ.Where(b => b.CreatedAt >= weekAgo);
            var monthlyQ = baseQ.Where(b => b.CreatedAt >= monthAgo);

            var weeklyReadsTask = TopByReadsAsync(weeklyQ, 10);
            var monthlyReadsTask = TopByReadsAsync(monthlyQ, 10);
            var weeklyRatingsTask = TopByRatingAsync(weeklyQ, 10);
            var monthlyRatingsTask = TopByRatingAsync(monthlyQ, 10);

            await Task.WhenAll(weeklyReadsTask, monthlyReadsTask, weeklyRatingsTask, monthlyRatingsTask);

            return new RankingsResponseDto
            {
                WeeklyReadRanking = weeklyReadsTask.Result,
                MonthlyReadRanking = monthlyReadsTask.Result,
                WeeklyRatingRanking = weeklyRatingsTask.Result,
                MonthlyRatingRanking = monthlyRatingsTask.Result
            };
        }
    }
}
