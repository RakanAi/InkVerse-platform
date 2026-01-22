using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Chapter;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class AdminChapterService : IAdminChapterService
    {
        private readonly InkVerseDB _db;

        public AdminChapterService(InkVerseDB db)
        {
            _db = db;
        }

        public async Task<List<ChapterReadDto>> GetChaptersByBookAsync(int bookId)
        {
            // We intentionally do NOT return Content here (heavy).
            // If you want content, call GetChapterAsync.
            return await _db.Chapters
                .Where(c => c.BookId == bookId)
                .Include(c => c.Arc)
                .OrderBy(c => c.ChapterNumber)
                .Select(c => new ChapterReadDto
                {
                    Id = c.ID,
                    Title = c.Title,
                    Content = "", // keep list light
                    ChapterNumber = c.ChapterNumber,
                    WordCount = c.WordCount,
                    BookId = c.BookId,
                    ArcId = c.ArcId,
                    ArcName = c.ArcId != null ? c.Arc!.Name : null,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<ChapterReadDto?> GetChapterAsync(int bookId, int chapterId)
        {
            return await _db.Chapters
            .Where(c => c.BookId == bookId && c.ID == chapterId)
            .Include(c => c.Arc)
            .Select(c => new ChapterReadDto
            {
                Id = c.ID,
                Title = c.Title,
                Content = c.Content,
                ChapterNumber = c.ChapterNumber,
                WordCount = c.WordCount,
                BookId = c.BookId,
                ArcId = c.ArcId,
                ArcName = c.ArcId != null ? c.Arc!.Name : null,
                CreatedAt = c.CreatedAt
            })
            .FirstOrDefaultAsync();
        }

        public async Task<ChapterReadDto> CreateChapterAsync(int bookId, ChapterCreateDto dto, string userId, bool isAdmin)
        {
            // book ownership check (Author can only edit their own book)
            var book = await _db.Books.FirstOrDefaultAsync(b => b.ID == bookId);
            if (book == null) throw new KeyNotFoundException("Book not found.");

            if (!isAdmin && book.AuthorId != userId)
                throw new UnauthorizedAccessException("You are not allowed to add chapters to this book.");

            // WordCount: simple calculation (space split). Good enough for now.
            var wc = CountWords(dto.Content);

            var nextNumber = await _db.Chapters
                .Where(c => c.BookId == bookId)
                .Select(c => (int?)c.ChapterNumber)
                .MaxAsync() ?? 0;



            var chapter = new Chapter
            {
                Title = dto.Title,
                Content = dto.Content,
                ChapterNumber = nextNumber + 1,
                ArcId = dto.ArcId,
                BookId = bookId, // IMPORTANT: use route param, ignore dto.BookId
                WordCount = wc,
                CreatedAt = DateTime.UtcNow,

            };

            _db.Chapters.Add(chapter);
            await _db.SaveChangesAsync();
            await RecalcBookWordCountAsync(bookId);

            return new ChapterReadDto
            {
                Id = chapter.ID,
                Title = chapter.Title,
                Content = chapter.Content,
                ChapterNumber = chapter.ChapterNumber,
                WordCount = chapter.WordCount,
                BookId = chapter.BookId,
                ArcId = chapter.ArcId,
                CreatedAt = chapter.CreatedAt
            };
        }

        public async Task<ChapterReadDto?> UpdateChapterAsync(int bookId, int chapterId, ChapterUpdateDto dto, string userId, bool isAdmin)
        {
            var chapter = await _db.Chapters.FirstOrDefaultAsync(c => c.BookId == bookId && c.ID == chapterId);
            if (chapter == null) return null;

            var book = await _db.Books.FirstOrDefaultAsync(b => b.ID == bookId);
            if (book == null) throw new KeyNotFoundException("Book not found.");

            if (!isAdmin && book.AuthorId != userId)
                throw new UnauthorizedAccessException("You are not allowed to edit chapters for this book.");

            chapter.Title = dto.Title;
            chapter.Content = dto.Content;
            chapter.ChapterNumber = dto.ChapterNumber;
            chapter.ArcId = dto.ArcId;
            chapter.BookId = bookId; // ensure it stays on this book
            chapter.WordCount = CountWords(dto.Content);
            chapter.UpdatedAt = DateTime.UtcNow;

            var newNumber = dto.ChapterNumber;

            var exists = await _db.Chapters.AnyAsync(c =>
                c.BookId == bookId &&
                c.ID != chapterId &&
                c.ChapterNumber == newNumber
            );

            if (exists)
                throw new InvalidOperationException($"Chapter number {newNumber} already exists in this book.");

            await _db.SaveChangesAsync();
            await RecalcBookWordCountAsync(bookId);

            return new ChapterReadDto
            {
                Id = chapter.ID,
                Title = chapter.Title,
                Content = chapter.Content,
                ChapterNumber = chapter.ChapterNumber,
                WordCount = chapter.WordCount,
                BookId = chapter.BookId,
                ArcId = chapter.ArcId,
                CreatedAt = chapter.CreatedAt
            };
        }

        public async Task<bool> DeleteChapterAsync(int bookId, int chapterId, string userId, bool isAdmin)
        {
            var chapter = await _db.Chapters.FirstOrDefaultAsync(c => c.BookId == bookId && c.ID == chapterId);
            if (chapter == null) return false;

            var book = await _db.Books.FirstOrDefaultAsync(b => b.ID == bookId);
            if (book == null) throw new KeyNotFoundException("Book not found.");

            if (!isAdmin && book.AuthorId != userId)
                throw new UnauthorizedAccessException("You are not allowed to delete chapters for this book.");

            _db.Chapters.Remove(chapter);
            await _db.SaveChangesAsync();
            await RecalcBookWordCountAsync(bookId);

            return true;
        }



        private static int CountWords(string? text)
        {
            if (string.IsNullOrWhiteSpace(text)) return 0;
            return text.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
        }

        private async Task RecalcBookWordCountAsync(int bookId)
        {
            var total = await _db.Chapters
                .Where(c => c.BookId == bookId)
                .SumAsync(c => (int?)c.WordCount) ?? 0;

            var book = await _db.Books.FirstOrDefaultAsync(b => b.ID == bookId);
            if (book == null) return;

            book.WordCount = total;
            book.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }



    }
}
