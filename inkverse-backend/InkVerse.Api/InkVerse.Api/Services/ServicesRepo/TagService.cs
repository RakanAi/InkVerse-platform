using Microsoft.EntityFrameworkCore;
using System;
using InkVerse.Api.Data; // <-- change to your DbContext namespace
using InkVerse.Api.Services.InterFace;
using static InkVerse.Api.DTOs.TagTrenGen.TagDtos;

namespace InkVerse.Api.Services.Tags
{
    public class TagService : ITagService
    {
        private readonly InkVerseDB _db;
        public TagService(InkVerseDB db) => _db = db;

        public async Task<List<TagDto>> GetAllAsync(bool includeInactive = true)
        {
            var q = _db.Tags.AsQueryable();
            if (!includeInactive) q = q.Where(t => t.IsActive);

            return await q
                .OrderBy(t => t.Name)
                .Select(t => new TagDto
                {
                    Id = t.ID, // 🔁 if your Tag key is Id, change to t.Id
                    Name = t.Name,
                    IsActive = t.IsActive

                })
                .ToListAsync();
        }

        public async Task<TagDto?> GetByIdAsync(int id)
        {
            var t = await _db.Tags.FirstOrDefaultAsync(x => x.ID == id); // 🔁 x.Id
            if (t == null) return null;

            return new TagDto
            {
                Id = t.ID,
                Name = t.Name,
                IsActive = t.IsActive

            };
        }

        public async Task<TagDto> CreateAsync(TagCreateDto dto)
        {
            var name = dto.Name?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Tag name is required.");

            var exists = await _db.Tags.AnyAsync(t => t.Name == name);
            if (exists) throw new InvalidOperationException("Tag name already exists.");

            var entity = new Tag
            {
                Name = name,
                IsActive = dto.IsActive
            };

            _db.Tags.Add(entity);
            await _db.SaveChangesAsync();

            return new TagDto
            {
                Id = entity.ID,
                Name = entity.Name,
                IsActive = entity.IsActive

            };
        }

        public async Task<TagDto?> UpdateAsync(int id, TagUpdateDto dto)
        {
            var entity = await _db.Tags.FirstOrDefaultAsync(t => t.ID == id); // 🔁 t.Id
            if (entity == null) return null;

            var name = dto.Name?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Tag name is required.");

            var nameUsedByOther = await _db.Tags.AnyAsync(t => t.Name == name && t.ID != id);
            if (nameUsedByOther) throw new InvalidOperationException("Tag name already exists.");

            entity.Name = name;
            entity.IsActive = dto.IsActive;

            await _db.SaveChangesAsync();

            return new TagDto
            {
                Id = entity.ID,
                Name = entity.Name,
                IsActive = entity.IsActive

            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var entity = await _db.Tags.FirstOrDefaultAsync(t => t.ID == id);
            if (entity == null) return false;

            // remove tag from all books (many-to-many)
            var books = await _db.Books.Include(b => b.Tags)
                .Where(b => b.Tags.Any(t => t.ID == id))
                .ToListAsync();

            foreach (var b in books)
                b.Tags.Remove(entity);

            _db.Tags.Remove(entity);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddToBookAsync(int tagId, int bookId)
        {
            var book = await _db.Books.Include(b => b.Tags)
                .FirstOrDefaultAsync(b => b.ID == bookId); // 🔁 b.ID if needed
            if (book == null) return false;

            var tag = await _db.Tags.FirstOrDefaultAsync(t => t.ID == tagId);
            if (tag == null) return false;

            if (book.Tags.Any(t => t.ID == tagId)) return true;

            book.Tags.Add(tag);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveFromBookAsync(int tagId, int bookId)
        {
            var book = await _db.Books.Include(b => b.Tags)
                .FirstOrDefaultAsync(b => b.ID == bookId);
            if (book == null) return false;

            var tag = book.Tags.FirstOrDefault(t => t.ID == tagId);
            if (tag == null) return false;

            book.Tags.Remove(tag);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<List<int>> GetBookIdsAsync(int tagId)
        {
            return await _db.Books
                .Where(b => b.Tags.Any(t => t.ID == tagId))
                .Select(b => b.ID)
                .ToListAsync();
        }
        public async Task<List<TagDto>> GetPopularAsync(int take = 80)
        {
            take = take <= 0 ? 80 : Math.Min(take, 100);

            return await _db.Tags
                .Where(t => t.IsActive)
                .OrderByDescending(t => t.Books.Count)  // ✅ popularity by usage
                .ThenBy(t => t.Name)
                .Take(take)
                .Select(t => new TagDto
                {
                    Id = t.ID,
                    Name = t.Name
                })
                .ToListAsync();
        }


    }
}
