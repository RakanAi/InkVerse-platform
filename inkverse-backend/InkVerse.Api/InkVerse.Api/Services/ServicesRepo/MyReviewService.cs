using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Review;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class MyReviewService : IMyReviewService
    {
        private readonly InkVerseDB _db;

        public MyReviewService(InkVerseDB db)
        {
            _db = db;
        }

        public async Task<List<MyReviewDto>> GetMyReviewsAsync(string userId)
        {
            return await _db.Reviews
                .AsNoTracking()
                .Where(r => r.UserId == userId)
                .Include(r => r.Book)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new MyReviewDto
                {
                    Id = r.ID,
                    BookId = r.BookId,
                    BookTitle = r.Book.Title,
                    BookCoverUrl = r.Book.CoverImageUrl,
                    Rating = r.Rating,
                    Content = r.Content,
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }
    }
}
