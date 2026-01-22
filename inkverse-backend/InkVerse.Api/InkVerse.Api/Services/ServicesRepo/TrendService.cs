using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;     // <-- change to your DbContext namespace
using InkVerse.Api.DTOs.Book;
using InkVerse.Api.DTOs.Trends;
using InkVerse.Api.Entities;
using InkVerse.Api.Entities.TrendEnti;
using InkVerse.Api.Services.InterFace; // Trend, BookTrend, Book

namespace InkVerse.Api.Services.Trends
{
    public class TrendService : ITrendService
    {
        private readonly InkVerseDB _db;

        public TrendService(InkVerseDB db)
        {
            _db = db;
        }

        public async Task<List<TrendDto>> GetAllAsync(bool includeInactive = true)
        {
            var query = _db.Trends.AsQueryable();

            if (!includeInactive)
                query = query.Where(t => t.IsActive);

            return await query
                .OrderBy(t => t.SortOrder)
                .ThenBy(t => t.Name)
                .Select(t => new TrendDto
                {
                    Id = t.ID,
                    Name = t.Name,
                    ImageUrl = t.ImageUrl,
                    Slug = t.Slug,
                    Description = t.Description,
                    IsActive = t.IsActive,
                    SortOrder = t.SortOrder
                })
                .ToListAsync();
        }

        public async Task<TrendDto?> GetByIdAsync(int id)
        {
            var t = await _db.Trends.FirstOrDefaultAsync(x => x.ID == id);
            if (t == null) return null;

            return new TrendDto
            {
                Id = t.ID,
                Name = t.Name,
                ImageUrl = t.ImageUrl, // ✅ add
                Slug = t.Slug,
                Description = t.Description,
                IsActive = t.IsActive,
                SortOrder = t.SortOrder
            };
        }

        public async Task<TrendDto> CreateAsync(TrendCreateDto dto)
        {
            var name = dto.Name?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Trend name is required.");

            // optional: enforce unique name at service layer too
            var exists = await _db.Trends.AnyAsync(t => t.Name == name);
            if (exists)
                throw new InvalidOperationException("Trend name already exists.");

            var entity = new Trend
            {
                Name = name,
                ImageUrl = dto.ImageUrl?.Trim() ?? "", 
                Slug = dto.Slug?.Trim(),
                Description = dto.Description?.Trim() ?? "",
                IsActive = dto.IsActive,
                SortOrder = dto.SortOrder,
                CreatedAt = DateTime.UtcNow
            };

            _db.Trends.Add(entity);
            await _db.SaveChangesAsync();

            return new TrendDto
            {
                Id = entity.ID,
                Name = entity.Name,
                ImageUrl = entity.ImageUrl,
                Slug = entity.Slug,
                Description = entity.Description,
                IsActive = entity.IsActive,
                SortOrder = entity.SortOrder
            };
        }

        public async Task<TrendDto?> UpdateAsync(int id, TrendUpdateDto dto)
        {
            var entity = await _db.Trends.FirstOrDefaultAsync(t => t.ID == id);
            if (entity == null) return null;

            var name = dto.Name?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Trend name is required.");

            var nameUsedByOther = await _db.Trends.AnyAsync(t => t.Name == name && t.ID != id);
            if (nameUsedByOther)
                throw new InvalidOperationException("Trend name already exists.");

            entity.Name = name;
            entity.Slug = dto.Slug?.Trim();
            entity.Description = dto.Description?.Trim() ?? "";
            entity.IsActive = dto.IsActive;
            entity.SortOrder = dto.SortOrder;
            entity.UpdatedAt = DateTime.UtcNow;
            entity.ImageUrl = dto.ImageUrl?.Trim() ?? "";


            await _db.SaveChangesAsync();

            return new TrendDto
            {
                Id = entity.ID,
                Name = entity.Name,
                ImageUrl = entity.ImageUrl, // ✅ add
                Slug = entity.Slug,
                Description = entity.Description,
                IsActive = entity.IsActive,
                SortOrder = entity.SortOrder
            };
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var trend = await _db.Trends.FirstOrDefaultAsync(t => t.ID == id);
            if (trend == null) return false;

            // remove links first (safe)
            var links = await _db.BookTrends.Where(x => x.TrendID == id).ToListAsync();
            if (links.Count > 0)
                _db.BookTrends.RemoveRange(links);

            _db.Trends.Remove(trend);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> AddBookAsync(int trendId, int bookId)
        {
            // ensure both exist
            var trendExists = await _db.Trends.AnyAsync(t => t.ID == trendId);
            var bookExists = await _db.Books.AnyAsync(b => b.ID == bookId); // if your Book key isn't "Id", adjust
            if (!trendExists || !bookExists) return false;

            var exists = await _db.BookTrends.AnyAsync(x => x.BookId == bookId && x.TrendID == trendId);
            if (exists) return true;

            _db.BookTrends.Add(new BookTrend
            {
                BookId = bookId,
                TrendID = trendId,
                AddedAt = DateTime.UtcNow
            });

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveBookAsync(int trendId, int bookId)
        {
            var link = await _db.BookTrends
                .FirstOrDefaultAsync(x => x.BookId == bookId && x.TrendID == trendId);

            if (link == null) return false;

            _db.BookTrends.Remove(link);
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<List<int>> GetBookIdsAsync(int trendId)
        {
            return await _db.BookTrends
                .Where(x => x.TrendID == trendId)
                .Select(x => x.BookId)
                .ToListAsync();
        }

        public async Task<List<BookReadDto>> GetTrendBooksAsync(int trendId, int take = 20)
        {
            take = take <= 0 ? 20 : Math.Min(take, 50);

            var trendExists = await _db.Trends.AnyAsync(t => t.ID == trendId);
            if (!trendExists) return new List<BookReadDto>();

            var books = await _db.Books
                    .AsNoTracking()
                    .Where(b => b.BookTrends.Any(bt => bt.TrendID == trendId))
                    .Include(b => b.Author)
                    .Include(b => b.Genres)
                    .Include(b => b.Tags)
                    .OrderByDescending(b =>
                        b.BookTrends
                         .Where(bt => bt.TrendID == trendId)
                         .Select(bt => bt.AddedAt)
                         .FirstOrDefault()
                    )
                    .Take(take)
                    .ToListAsync();


            var dtos = books.Select(b => new BookReadDto
            {
                Id = b.ID,
                Title = b.Title,
                Description = b.Description,
                CoverImageUrl = b.CoverImageUrl,

                AuthorId = b.AuthorId,
                AuthorName = !string.IsNullOrWhiteSpace(b.AuthorName)
                    ? b.AuthorName
                    : (b.Author != null ? b.Author.UserName : null),

                Status = b.Status.ToString(),
                WordCount = b.WordCount,
                TotalViews = b.TotalViews,

                // You have BOTH AverageRating and Rating.
                // We'll prioritize AverageRating because your DTO uses it.
                AverageRating = b.AverageRating != 0 ? b.AverageRating : b.Rating,

                IsFanfic = b.IsFanfic,

                Genres = [.. b.Genres.Select(g => g.Name)],
                Tags = [.. b.Tags.Select(t => t.Name)],
                GenreIds = [.. b.Genres.Select(g => g.ID)],
                TagIds = [.. b.Tags.Select(t => t.ID)],

                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt,

                ReviewsCount = 0,
                ChaptersCount = 0,

                VerseType = b.VerseType.ToString(),
                OriginType = b.OriginType.ToString(),
            }).ToList();

            return dtos;
        }

    }
}
