using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Admin;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class AdminDashboardService : IAdminDashboardService
    {
        private readonly InkVerseDB _db;

        public AdminDashboardService(InkVerseDB db)
        {
            _db = db;
        }

        public async Task<AdminDashboardDto> GetStatsAsync()
        {
            var booksCount = await _db.Books.CountAsync();
            var chaptersCount = await _db.Chapters.CountAsync();
            var genresCount = await _db.Genres.CountAsync();
            var tagsCount = await _db.Tags.CountAsync();
            var trendsCount = await _db.Trends.CountAsync();

            var booksWithNoChapters = await _db.Books
                .CountAsync(b => !_db.Chapters.Any(c => c.BookId == b.ID));

            var booksWithNoGenres = await _db.Books.CountAsync(b => !b.Genres.Any());
            var booksWithNoTags = await _db.Books.CountAsync(b => !b.Tags.Any());

            // ✅ Latest 5 books
            var latestBooks = await _db.Books
                .OrderByDescending(b => b.CreatedAt)
                .Take(5)
                .Select(b => new AdminLatestBookDto
                {
                    Id = b.ID,
                    Title = b.Title,
                    Status = b.Status.ToString(),
                    WordCount = b.WordCount,
                    CreatedAt = b.CreatedAt
                })
                .ToListAsync();

            // ✅ Latest 5 chapters (needs book title)
            var latestChapters = await _db.Chapters
                .Include(c => c.Book)
                .OrderByDescending(c => c.CreatedAt)
                .Take(5)
                .Select(c => new AdminLatestChapterDto
                {
                    Id = c.ID,
                    BookId = c.BookId,
                    BookTitle = c.Book != null ? c.Book.Title : "",
                    Title = c.Title,
                    ChapterNumber = c.ChapterNumber,
                    WordCount = c.WordCount,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return new AdminDashboardDto
            {
                Books = booksCount,
                Chapters = chaptersCount,
                Genres = genresCount,
                Tags = tagsCount,
                Trends = trendsCount,

                BooksWithNoChapters = booksWithNoChapters,
                BooksWithNoGenres = booksWithNoGenres,
                BooksWithNoTags = booksWithNoTags,

                LatestBooks = latestBooks,
                LatestChapters = latestChapters
            };
        }
    }
}
