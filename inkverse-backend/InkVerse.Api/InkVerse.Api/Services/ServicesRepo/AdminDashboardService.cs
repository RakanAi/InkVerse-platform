using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Admin;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class AdminDashboardService : IAdminDashboardService
    {
        private readonly InkVerseDB _db;
        private readonly IBookContractService _bookContracts;
        private readonly IContentReportService _reports;
        private readonly IModerationService _moderation;

        public AdminDashboardService(InkVerseDB db, IBookContractService bookContracts, IContentReportService reports, IModerationService moderation)
        {
            _db = db;
            _bookContracts = bookContracts;
            _reports = reports;
            _moderation = moderation;
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
            var contractCandidates = await _bookContracts.CountContractCandidatesAsync();
            var openReports = await _reports.CountOpenReportsAsync();
            var openModerationCases = await _moderation.CountAdminQueueAsync();
            var clawbotAutoHandledToday = await _moderation.CountAutoHandledTodayAsync();

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
                ContractCandidates = contractCandidates,
                OpenReports = openReports,
                OpenModerationCases = openModerationCases,
                ClawbotAutoHandledToday = clawbotAutoHandledToday,

                LatestBooks = latestBooks,
                LatestChapters = latestChapters
            };
        }
    }
}
