using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Chapter;
using InkVerse.Api.Entities;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class ChapterService : IChapterService
    {
        private readonly InkVerseDB _inkVerseDB;

        public ChapterService(InkVerseDB inkVerseDB)
        {
            _inkVerseDB = inkVerseDB;
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
            return await _inkVerseDB.Chapters
                .Where(c => c.BookId == bookId)
                .Include(c => c.Arc)
                .OrderBy(c => c.ChapterNumber)
                .Select(c => new ChapterReadDto
                {
                    Id = c.ID,
                    Title = c.Title,
                    Content = c.Content,
                    ChapterNumber = c.ChapterNumber,
                    WordCount = c.WordCount,
                    BookId = c.BookId,
                    ArcId = c.ArcId,
                    ArcName = c.ArcId != null ? c.Arc.Name : null,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<ChapterReadDto> CreateAsync(ChapterCreateDto dto)
        {
            var bookExists = await _inkVerseDB.Books.AnyAsync(b => b.ID == dto.BookId);
            if (!bookExists)
                throw new ArgumentException("Invalid book ID");

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
            await RecalcBookWordCountAsync(dto.BookId);


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



        public async Task<ChapterReadDto?> UpdateAsync(int id, ChapterUpdateDto dto)
        {
            var chapter = await _inkVerseDB.Chapters.FindAsync(id);
            if (chapter == null) return null;

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


        public async Task<bool> DeleteAsync(int id)
        {
            var chapter = await _inkVerseDB.Chapters.FindAsync(id);
            if (chapter == null) return false;

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
                    Content = c.Content,
                    ChapterNumber = c.ChapterNumber,
                    WordCount = c.WordCount,
                    BookId = c.BookId,
                    ArcId = c.ArcId,
                    ArcName = c.Arc != null ? c.Arc.Name : null




                })
                .ToListAsync();

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

    }
}
