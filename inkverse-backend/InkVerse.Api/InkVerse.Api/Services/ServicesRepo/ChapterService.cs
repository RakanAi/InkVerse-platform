using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Chapter;
using InkVerse.Api.Entities;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Entities.Notifications;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class ChapterService : IChapterService
    {
        private readonly InkVerseDB _inkVerseDB;
        private readonly IBookBibleService _bookBible;
        private readonly IMonetizationService _monetization;
        private readonly INotificationService _notifications;

        public ChapterService(InkVerseDB inkVerseDB, IBookBibleService bookBible, IMonetizationService monetization, INotificationService notifications)
        {
            _inkVerseDB = inkVerseDB;
            _bookBible = bookBible;
            _monetization = monetization;
            _notifications = notifications;
        }

        // List chapters for a given book (no content)
        public async Task<ChapterReadDto?> GetByIdAsync(int id)
        {
            return await _inkVerseDB.Chapters
                .Where(c => c.ID == id)
                .Select(c => new ChapterReadDto
                {
                    Id = c.ID,
                    Title = c.Title,
                    Content = c.Content,
                    ChapterNumber = c.ChapterNumber,
                    WordCount = c.WordCount,
                    ArcName = c.ArcId != null ? c.Arc.Name : null,
                    BookId = c.BookId,
                    
                }).FirstOrDefaultAsync();
        }

        public async Task<List<ChapterReadDto>> GetByBookAsync(int bookId)
        {
            var chapters = await _inkVerseDB.Chapters
                .Where(c => c.BookId == bookId)
                .Include(c => c.Arc)
                .OrderBy(c => c.ChapterNumber)
                .Select(c => new ChapterReadDto
                {
                    Id = c.ID,
                    Title = c.Title,
                    Content = string.Empty,
                    ChapterNumber = c.ChapterNumber,
                    WordCount = c.WordCount,
                    BookId = c.BookId,
                    ArcId = c.ArcId,
                    ArcName = c.ArcId != null ? c.Arc.Name : null,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            await ApplyMonetizationSummariesAsync(chapters);
            return chapters;
        }

        public async Task<ChapterReadDto> CreateAsync(ChapterCreateDto dto, string? userId = null, bool isAdmin = false)
        {
            var book = await _inkVerseDB.Books.FirstOrDefaultAsync(b => b.ID == dto.BookId);
            if (book == null)
                throw new ArgumentException("Invalid book ID");
            if (!isAdmin && !string.Equals(book.AuthorId, userId, StringComparison.Ordinal))
                throw new UnauthorizedAccessException("You are not allowed to add chapters to this book.");
            if (dto.IsPaid && !await _monetization.CanChargeChapterAsync(0, book.ID, book.AuthorId))
                throw new InvalidOperationException("This book needs an approved contract and accepted monetization agreement before chapters can be paid.");

            var wordCount = dto.Content.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;

            int nextChapterNumber = (await _inkVerseDB.Chapters
                .Where(c => c.BookId == dto.BookId)
                .MaxAsync(c => (int?)c.ChapterNumber) ?? 0) + 1;

            var chapter = new Chapter
            {
                Title = dto.Title,
                Content = dto.Content,
                ChapterNumber = nextChapterNumber,
                BookId = dto.BookId,
                WordCount = wordCount,
                ArcId = dto.ArcId,
                CreatedAt = DateTime.UtcNow
            };

            _inkVerseDB.Chapters.Add(chapter);
            await _inkVerseDB.SaveChangesAsync();
            if (dto.IsPaid)
            {
                _inkVerseDB.ChapterMonetizations.Add(new InkVerse.Api.Entities.Monetization.ChapterMonetization
                {
                    ChapterId = chapter.ID,
                    IsPaid = true,
                    PriceCoins = 5,
                    Teaser = string.IsNullOrWhiteSpace(dto.Teaser)
                        ? StripHtml(chapter.Content).Trim()[..Math.Min(260, StripHtml(chapter.Content).Trim().Length)]
                        : dto.Teaser.Trim(),
                    CreatedAt = DateTime.UtcNow,
                });
                await _inkVerseDB.SaveChangesAsync();
            }
            await RecalcBookWordCountAsync(dto.BookId);
            await _bookBible.MarkNeedsScanAsync(dto.BookId);

            var libraryRecipients = await _inkVerseDB.UserLibraries
                .AsNoTracking()
                .Where(item => item.BookId == book.ID && item.IsInLibrary && item.UserId != null && item.UserId != book.AuthorId)
                .Select(item => item.UserId!)
                .ToListAsync();

            await _notifications.NotifyManyAsync(libraryRecipients, new NotificationCreateRequest(
                RecipientId: "",
                ActorId: book.AuthorId,
                Category: NotificationCategories.BookUpdates,
                Type: NotificationTypes.NewChapter,
                Title: "New chapter available",
                Body: $"{book.Title} added chapter {chapter.ChapterNumber}: {chapter.Title}.",
                LinkUrl: $"/book/{book.ID}/chapter/{chapter.ID}",
                TargetType: "chapter",
                TargetId: chapter.ID.ToString(),
                DedupeKey: $"new-chapter:{chapter.ID}"));


            return new ChapterReadDto
            {
                Id = chapter.ID,
                Title = chapter.Title,
                Content = chapter.Content,
                ChapterNumber = chapter.ChapterNumber,
                WordCount = chapter.WordCount,
                BookId = chapter.BookId,
                ArcId = chapter.ArcId
            };
        }



        public async Task<ChapterReadDto?> UpdateAsync(int id, ChapterUpdateDto dto, string? userId = null, bool isAdmin = false)
        {
            var chapter = await _inkVerseDB.Chapters
                .Include(item => item.Book)
                .FirstOrDefaultAsync(item => item.ID == id);
            if (chapter == null) return null;
            if (!isAdmin && !string.Equals(chapter.Book?.AuthorId, userId, StringComparison.Ordinal))
                throw new UnauthorizedAccessException("You are not allowed to edit this chapter.");
            if (!await _monetization.CanAuthorMutateChapterAsync(id, userId, isAdmin))
                throw new InvalidOperationException("Published chapters are locked after contract approval.");

            var exists = await _inkVerseDB.Chapters.AnyAsync(c =>
                c.BookId == chapter.BookId &&
                c.ID != id &&
                c.ChapterNumber == dto.ChapterNumber
            );
            if (exists)
                throw new InvalidOperationException($"Chapter number {dto.ChapterNumber} already exists in this book.");

            chapter.Title = dto.Title;
            chapter.Content = dto.Content;
            chapter.ChapterNumber = dto.ChapterNumber;
            chapter.ArcId = dto.ArcId; // ✅ IMPORTANT
            chapter.WordCount = dto.Content.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
            chapter.UpdatedAt = DateTime.UtcNow;

            await _inkVerseDB.SaveChangesAsync();
            await RecalcBookWordCountAsync(chapter.BookId);
            await _bookBible.MarkNeedsScanAsync(chapter.BookId);


            return new ChapterReadDto
            {
                Id = chapter.ID,
                Title = chapter.Title,
                Content = chapter.Content,
                ChapterNumber = chapter.ChapterNumber,
                WordCount = chapter.WordCount,
                BookId = chapter.BookId,
                ArcId = chapter.ArcId
            };
        }


        public async Task<bool> DeleteAsync(int id, string? userId = null, bool isAdmin = false)
        {
            var chapter = await _inkVerseDB.Chapters
                .Include(item => item.Book)
                .FirstOrDefaultAsync(item => item.ID == id);
            if (chapter == null) return false;
            if (!isAdmin && !string.Equals(chapter.Book?.AuthorId, userId, StringComparison.Ordinal))
                throw new UnauthorizedAccessException("You are not allowed to delete this chapter.");
            if (!await _monetization.CanAuthorMutateChapterAsync(id, userId, isAdmin))
                throw new InvalidOperationException("Published chapters are locked after contract approval.");

            var bookId = chapter.BookId;


            _inkVerseDB.Chapters.Remove(chapter);
            await _inkVerseDB.SaveChangesAsync();
            await RecalcBookWordCountAsync(bookId);

            return true;
        }
        public async Task<List<object>> GetByBookGroupedAsync(int bookId)
        {
            var chapters = await _inkVerseDB.Chapters
                .Where(c => c.BookId == bookId)
                .Include(c => c.Arc)
                .OrderBy(c => c.ChapterNumber)
                .Select(c => new ChapterReadDto
                {
                    Id = c.ID,
                    Title = c.Title,
                    Content = string.Empty,
                    ChapterNumber = c.ChapterNumber,
                    WordCount = c.WordCount,
                    BookId = c.BookId,
                    ArcId = c.ArcId,
                    ArcName = c.Arc != null ? c.Arc.Name : null,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            await ApplyMonetizationSummariesAsync(chapters);

            return chapters
                .GroupBy(c => c.ArcName ?? "No Arc")
                .Select(g => new
                {
                    ArcName = g.Key,
                    Chapters = g.ToList()
                })
                .ToList<object>();
        }

        public async Task<FirstChapterDto?> GetFirstChapterAsync(int bookId)
        {
            var first = await _inkVerseDB.Chapters
                .Where(c => c.BookId == bookId)
                .OrderBy(c => c.ChapterNumber)
                .Select(c => new FirstChapterDto { Id = c.ID })
                .FirstOrDefaultAsync();

            return first;

        }

        private async Task RecalcBookWordCountAsync(int bookId)
        {
            var total = await _inkVerseDB.Chapters
                .Where(c => c.BookId == bookId)
                .SumAsync(c => (int?)c.WordCount) ?? 0;

            var book = await _inkVerseDB.Books.FirstOrDefaultAsync(b => b.ID == bookId);
            if (book == null) return;

            book.WordCount = total;
            book.UpdatedAt = DateTime.UtcNow;

            await _inkVerseDB.SaveChangesAsync();
        }

        private async Task ApplyMonetizationSummariesAsync(List<ChapterReadDto> chapters)
        {
            if (!chapters.Any()) return;

            var chapterIds = chapters.Select(item => item.Id).ToList();
            var monetization = await _inkVerseDB.ChapterMonetizations
                .Where(item => chapterIds.Contains(item.ChapterId))
                .ToDictionaryAsync(item => item.ChapterId);

            foreach (var chapter in chapters)
            {
                if (!monetization.TryGetValue(chapter.Id, out var item) || !item.IsPaid)
                {
                    chapter.IsPaid = false;
                    chapter.IsLocked = false;
                    chapter.IsUnlocked = true;
                    continue;
                }

                var book = await _inkVerseDB.Books
                    .Where(item => item.ID == chapter.BookId)
                    .Select(item => new { item.AuthorId })
                    .FirstOrDefaultAsync();

                if (!await _monetization.CanChargeChapterAsync(chapter.Id, chapter.BookId, book?.AuthorId))
                {
                    chapter.IsPaid = false;
                    chapter.IsLocked = false;
                    chapter.IsUnlocked = true;
                    chapter.PriceCoins = 0;
                    chapter.Teaser = null;
                    continue;
                }

                chapter.IsPaid = true;
                chapter.IsLocked = true;
                chapter.IsUnlocked = false;
                chapter.PriceCoins = item.PriceCoins;
                chapter.Teaser = item.Teaser;
            }
        }

        private static string StripHtml(string value)
        {
            var chars = new List<char>(value.Length);
            var insideTag = false;
            foreach (var character in value)
            {
                if (character == '<')
                {
                    insideTag = true;
                    continue;
                }
                if (character == '>')
                {
                    insideTag = false;
                    chars.Add(' ');
                    continue;
                }
                if (!insideTag) chars.Add(character);
            }

            return new string(chars.ToArray()).Replace("&nbsp;", " ");
        }

    }
}
