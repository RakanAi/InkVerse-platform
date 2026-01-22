using Microsoft.EntityFrameworkCore;
using System;
using InkVerse.Api.Data; // <-- change to your DbContext namespace
using InkVerse.Api.DTOs.Genres;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.Genres
{
    public class GenreService : IGenreService
    {
        private readonly InkVerseDB _db;
        public GenreService(InkVerseDB db) => _db = db;

        public async Task<List<GenreDto>> GetAllAsync(bool includeInactive = true)
        {
            var q = _db.Genres.AsQueryable();
            if (!includeInactive) q = q.Where(g => g.IsActive);

            return await q
                .OrderBy(g => g.Name)
                .Select(g => new GenreDto
                {
                    Id = g.ID, // 🔁 g.Id if needed
                    Name = g.Name,
                    Slug = g.Slug,
                    IsActive = g.IsActive
                })
                .ToListAsync();
        }

        public async Task<GenreDto?> GetByIdAsync(int id)
        {
            var g = await _db.Genres.FirstOrDefaultAsync(x => x.ID == id);
            if (g == null) return null;

            return new GenreDto
            {
                Id = g.ID,
                Name = g.Name,
                Slug = g.Slug,
                IsActive = g.IsActive
            };
        }

        public async Task<GenreDto> CreateAsync(GenreCreateDto dto)
        {
            var name = dto.Name?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Genre name is required.");

            var exists = await _db.Genres.AnyAsync(g => g.Name == name);
            if (exists) throw new InvalidOperationException("Genre name already exists.");

            var entity = new Genre
            {
                Name = name,
                Slug = dto.Slug?.Trim(),
                IsActive = dto.IsActive
            };

            _db.Genres.Add(entity);
            await _db.SaveChangesAsync();

            return new GenreDto
            {
                Id = entity.ID,
                Name = entity.Name,
                Slug = entity.Slug,
                IsActive = entity.IsActive
            };
        }

        public async Task<GenreDto?> UpdateAsync(int id, GenreUpdateDto dto)
        {
            var entity = await _db.Genres.FirstOrDefaultAsync(g => g.ID == id);
            if (entity == null) return null;

            var name = dto.Name?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Genre name is required.");

            var nameUsedByOther = await _db.Genres.AnyAsync(g => g.Name == name && g.ID != id);
            if (nameUsedByOther) throw new InvalidOperationException("Genre name already exists.");

            entity.Name = name;
            entity.Slug = dto.Slug?.Trim();
            entity.IsActive = dto.IsActive;

            await _db.SaveChangesAsync();

            return new GenreDto
            {
                Id = entity.ID,
                Name = entity.Name,
                Slug = entity.Slug,
                IsActive = entity.IsActive
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _db.Genres.FirstOrDefaultAsync(g => g.ID == id);
            if (entity == null) return false;

            var books = await _db.Books.Include(b => b.Genres)
                .Where(b => b.Genres.Any(g => g.ID == id))
                .ToListAsync();

            foreach (var b in books)
                b.Genres.Remove(entity);

            _db.Genres.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddToBookAsync(int genreId, int bookId)
        {
            var book = await _db.Books.Include(b => b.Genres)
                .FirstOrDefaultAsync(b => b.ID == bookId);
            if (book == null) return false;

            var genre = await _db.Genres.FirstOrDefaultAsync(g => g.ID == genreId);
            if (genre == null) return false;

            if (book.Genres.Any(g => g.ID == genreId)) return true;

            book.Genres.Add(genre);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveFromBookAsync(int genreId, int bookId)
        {
            var book = await _db.Books.Include(b => b.Genres)
                .FirstOrDefaultAsync(b => b.ID == bookId);
            if (book == null) return false;

            var genre = book.Genres.FirstOrDefault(g => g.ID == genreId);
            if (genre == null) return false;

            book.Genres.Remove(genre);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<List<int>> GetBookIdsAsync(int genreId)
        {
            return await _db.Books
                .Where(b => b.Genres.Any(g => g.ID == genreId))
                .Select(b => b.ID)
                .ToListAsync();
        }
    }
}
