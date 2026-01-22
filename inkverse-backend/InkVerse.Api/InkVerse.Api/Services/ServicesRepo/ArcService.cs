using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Chapter;
using InkVerse.Api.Entities;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class ArcService : IArcService
    {
        private readonly InkVerseDB _db;

        public ArcService(InkVerseDB db)
        {
            _db = db;
        }

        public async Task<List<ArcReadDto>> GetArcsAsync(int bookId)
        {
            return await _db.Arcs
                .Where(a => a.BookId == bookId)
                .OrderBy(a => a.OrderIndex)
                .ThenBy(a => a.ID)
                .Select(a => new ArcReadDto
                {
                    Id = a.ID,
                    Name = a.Name,
                    OrderIndex = a.OrderIndex
                })
                .ToListAsync();
        }

        public async Task<ArcReadDto> CreateArcAsync(int bookId, ArcCreateDto dto, string userId, bool isAdmin)
        {
            var name = (dto.Name ?? "").Trim();
            if (string.IsNullOrWhiteSpace(name))
                throw new InvalidOperationException("Arc name is required.");

            var book = await _db.Books.FirstOrDefaultAsync(b => b.ID == bookId);
            if (book == null) throw new KeyNotFoundException("Book not found.");

            if (!isAdmin && book.AuthorId != userId)
                throw new UnauthorizedAccessException("You are not allowed to manage arcs for this book.");

            // prevent duplicate by code too (DB also enforces it)
            var exists = await _db.Arcs.AnyAsync(a => a.BookId == bookId && a.Name == name);
            if (exists)
                throw new InvalidOperationException("Arc name already exists in this book.");

            var maxOrder = await _db.Arcs
                .Where(a => a.BookId == bookId)
                .MaxAsync(a => (int?)a.OrderIndex) ?? 0;

            var arc = new Arc
            {
                BookId = bookId,
                Name = name,
                OrderIndex = maxOrder + 1
            };

            _db.Arcs.Add(arc);
            await _db.SaveChangesAsync();

            return new ArcReadDto
            {
                Id = arc.ID,
                Name = arc.Name,
                OrderIndex = arc.OrderIndex
            };
        }
    }
}
