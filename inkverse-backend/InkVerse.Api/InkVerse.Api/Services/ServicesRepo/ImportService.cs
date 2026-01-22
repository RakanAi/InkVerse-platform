using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Import;
using InkVerse.Api.Entities;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class ChapterImportService : IChapterImportService
    {
        private readonly InkVerseDB _db;

        public ChapterImportService(InkVerseDB db)
        {
            _db = db;
        }

        public async Task<ChapterImportResultDto> ImportChaptersAsync(int bookId, ChaptersImportDto dto)
        {
            if (dto == null) throw new ArgumentNullException(nameof(dto));
            if (bookId <= 0) throw new ArgumentException("Invalid bookId.");

            var bookExists = await _db.Books.AnyAsync(b => b.ID == bookId);
            if (!bookExists) throw new InvalidOperationException($"BookId {bookId} does not exist.");

            var raw = dto.Chapters ?? new List<ChapterImportItemDto>();

            // Normalize + sort
            var items = raw
                .Select((c, idx) => new
                {
                    Raw = c,
                    Index = idx + 1,
                    Number = c.Number
                })
                .OrderBy(x => x.Number ?? int.MaxValue)
                .ThenBy(x => x.Index)
                .ToList();

            // existing chapter numbers to avoid duplicates
            var existingNumbers = await _db.Chapters
                .Where(c => c.BookId == bookId)
                .Select(c => c.ChapterNumber)
                .ToHashSetAsync();

            // choose auto numbering start
            int nextAuto = 1;
            if (existingNumbers.Count > 0) nextAuto = existingNumbers.Max() + 1;

            // If incoming has numbered chapters, don't conflict with them
            var incomingNumbers = items.Where(x => x.Number is int).Select(x => x.Number!.Value).ToHashSet();
            nextAuto = Math.Max(nextAuto, incomingNumbers.Count > 0 ? incomingNumbers.Max() + 1 : nextAuto);

            int inserted = 0, dup = 0, empty = 0;

            foreach (var item in items)
            {
                var title = (item.Raw.Title ?? "").Trim();
                var content = (item.Raw.Content ?? "").Trim();

                if (string.IsNullOrWhiteSpace(content))
                {
                    empty++;
                    continue;
                }

                int chNo = item.Number ?? nextAuto++;

                // If already exists => skip
                if (existingNumbers.Contains(chNo))
                {
                    dup++;
                    continue;
                }

                if (string.IsNullOrWhiteSpace(title))
                    title = $"Chapter {chNo}";

                var chapter = new Chapter
                {
                    BookId = bookId,
                    ChapterNumber = chNo,
                    Title = title,
                    Content = content,
                    WordCount = CountWords(content),
                    ArcId = null
                };

                _db.Chapters.Add(chapter);
                existingNumbers.Add(chNo);
                inserted++;
            }

            await _db.SaveChangesAsync();

            // Update book word count (sum is safest)
            var totalWords = await _db.Chapters
                .Where(c => c.BookId == bookId)
                .SumAsync(c => c.WordCount);

            var book = await _db.Books.FirstAsync(b => b.ID == bookId);
            book.WordCount = totalWords;
            await _db.SaveChangesAsync();

            var totalAfter = await _db.Chapters.CountAsync(c => c.BookId == bookId);

            return new ChapterImportResultDto
            {
                BookId = bookId,
                Inserted = inserted,
                SkippedDuplicates = dup,
                SkippedEmpty = empty,
                TotalAfter = totalAfter
            };
        }

        private static int CountWords(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return 0;
            var parts = Regex.Split(text.Trim(), @"\s+");
            return parts.Count(p => !string.IsNullOrWhiteSpace(p));
        }
    }
}
