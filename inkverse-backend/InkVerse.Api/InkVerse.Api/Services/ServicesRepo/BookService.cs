using Microsoft.EntityFrameworkCore;
using System.Linq;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Book;
using InkVerse.Api.Entities.Enums;
using InkVerse.Api.Helpers;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class BookService : IBookServices
    {
        private readonly InkVerseDB _inkVerseDB;

        public BookService(InkVerseDB inkVerseDB)
        {
            _inkVerseDB = inkVerseDB;
        }

        public async Task<List<BookReadDto>> GetAllBooksAsync(QueryObject query)
        {
            var booksQuery = _inkVerseDB.Books
                .Include(b => b.Genres)
                .Include(b => b.Tags)
                .Include(b => b.Author)
                .AsQueryable();

            var term = query.SearchTerm?.Trim();
            if (!string.IsNullOrWhiteSpace(term))
            {
                booksQuery = booksQuery.Where(b =>
                    (b.Title ?? "").Contains(term) ||
                    (b.Description ?? "").Contains(term));
            }

            var sortBy = query.SortBy ?? "Title";
            var isAscending = query.IsAscending ?? true; // default to ascending if null

            if (sortBy.Equals("Title", StringComparison.OrdinalIgnoreCase))
            {
                booksQuery = isAscending
                    ? booksQuery.OrderBy(b => b.Title)
                    : booksQuery.OrderByDescending(b => b.Title);
            }
            else if (sortBy.Equals("CreatedAt", StringComparison.OrdinalIgnoreCase))
            {
                booksQuery = isAscending
                    ? booksQuery.OrderBy(b => b.CreatedAt)
                    : booksQuery.OrderByDescending(b => b.CreatedAt);
            }
            else if (sortBy.Equals("AverageRating", StringComparison.OrdinalIgnoreCase))
            {
                booksQuery = isAscending
                    ? booksQuery.OrderBy(b => b.AverageRating)
                    : booksQuery.OrderByDescending(b => b.AverageRating);


            }
            var pageNumber = query.PageNumber < 1 ? 1 : query.PageNumber;
            var skipNumber = (pageNumber - 1) * query.PageSize;
            // Final projection and execution
            var books = await booksQuery
                .Skip(skipNumber)
                .Take(query.PageSize)
                .Select(b => new BookReadDto
                {
                    Id = b.ID,
                    Title = b.Title,
                    Description = b.Description,
                    CoverImageUrl = b.CoverImageUrl,

                    IsFanfic = b.IsFanfic,
                    Status = b.Status.ToString(),
                    WordCount = b.WordCount,
                    TotalViews = b.TotalViews,
                    AverageRating = b.AverageRating,

                    AuthorId = b.AuthorId,
                    AuthorName = b.AuthorName ?? b.Author.UserName,

                    Genres = b.Genres.Select(g => g.Name).ToList(),
                    Tags = b.Tags.Select(t => t.Name).ToList(),

                    VerseType = b.VerseType.ToString(),
                    OriginType = b.OriginType.ToString(),
                })
                .ToListAsync();

            return books;
        }

        public async Task<BookReadDto?> GetBookByIdAsync(int id)
        {

            return await _inkVerseDB.Books
                .Where(b => b.ID == id)
                .Include(b => b.Genres)
                .Include(b => b.Tags)
                .Include(b => b.Author)
                .Select(b => new BookReadDto
                {
                    Id = b.ID,
                    Title = b.Title,
                    Description = b.Description,
                    CoverImageUrl = b.CoverImageUrl,
                    IsFanfic = b.IsFanfic,
                    Status = b.Status.ToString(),
                    AuthorName = b.Author.UserName,
                    WordCount = b.WordCount,
                    TotalViews = b.TotalViews,
                    AverageRating = b.AverageRating,
                    VerseType = b.VerseType.ToString(),
                    OriginType = b.OriginType.ToString(),
                    Genres = b.Genres.Select(g => g.Name).ToList(),
                    Tags = b.Tags.Select(t => t.Name).ToList(),
                    GenreIds = b.Genres.Select(g => g.ID).ToList(),
                    TagIds = b.Tags.Select(t => t.ID).ToList(),
                    SourceUrl = b.SourceUrl,


                }).FirstOrDefaultAsync();
        }

        public async Task<BookReadDto> CreateBookAsync(BookCreateDto dto, string authorId)
        {
            var genres = await _inkVerseDB.Genres
                .Where(g => dto.GenreIds.Contains(g.ID))
                .ToListAsync();

            var tags = await _inkVerseDB.Tags
                .Where(t => dto.TagIds.Contains(t.ID))
                .ToListAsync();

            VerseType verseType;
            if (!Enum.TryParse(dto.VerseType, true, out verseType))
                verseType = VerseType.Original;

            OriginType originType;
            if (!Enum.TryParse(dto.OriginType, true, out originType))
                originType = OriginType.PlatformOriginal;

            BookStatus status;
            if(!Enum.TryParse(dto.Status, true, out status))
                status = BookStatus.Ongoing;



            var book = new Book
            {
                Title = dto.Title,
                Description = dto.Description,
                CoverImageUrl = dto.CoverImageUrl,
                IsFanfic = (verseType == VerseType.Fanfic || verseType == VerseType.AU),
                TotalViews = 0,
                AverageRating = 0,
                WordCount = 0,
                SourceUrl = dto.SourceUrl,

                AuthorId = authorId, // ✅ from token, not from dto
                AuthorName = null,

                Genres = genres,
                Tags = tags,
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false,

                Status = status,

                VerseType = verseType,
                OriginType = originType,
            };

            _inkVerseDB.Books.Add(book);
            await _inkVerseDB.SaveChangesAsync();

            return new BookReadDto
            {
                Id = book.ID,
                Title = book.Title,
                Description = book.Description,
                CoverImageUrl = book.CoverImageUrl,
                Status = book.Status.ToString(),
                WordCount = book.WordCount,
                TotalViews = book.TotalViews,
                AverageRating = book.AverageRating,
                IsFanfic = book.IsFanfic,
                VerseType = book.VerseType.ToString(),
                OriginType = book.OriginType.ToString(),
                Genres = genres.Select(g => g.Name).ToList(),
                Tags = tags.Select(t => t.Name).ToList(),
                SourceUrl = book.SourceUrl,

            };
        }


        public async Task<BookReadDto?> UpdateBookAsync(int id, BookUpdateDto dto, string userId, bool isAdmin)
        {
            var book = await _inkVerseDB.Books
                .Include(b => b.Genres)
                .Include(b => b.Tags)
                .Include(b => b.Author)
                .FirstOrDefaultAsync(b => b.ID == id);

            if (book == null) return null;


            if (!isAdmin && book.AuthorId != userId)
                throw new UnauthorizedAccessException("You are not allowed to edit this book.");


            VerseType verseType;
            if (!Enum.TryParse(dto.VerseType, true, out verseType))
                verseType = VerseType.Original;

            OriginType originType;
            if (!Enum.TryParse(dto.OriginType, true, out originType))
                originType = OriginType.PlatformOriginal;

            BookStatus status;
            if (!Enum.TryParse(dto.Status, true, out status))
                status = BookStatus.Ongoing;

            book.VerseType = verseType;
            book.OriginType = originType;

            // Update scalar fields
            book.Title = dto.Title;
            book.Description = dto.Description;
            book.CoverImageUrl = dto.CoverImageUrl;
            book.IsFanfic = (verseType == VerseType.Fanfic || verseType == VerseType.AU);
            book.Status = status;
            book.UpdatedAt = DateTime.UtcNow;
            book.SourceUrl = dto.SourceUrl;


            // Replace genres/tags (many-to-many)
            book.Genres.Clear();
            book.Tags.Clear();

            var genres = await _inkVerseDB.Genres
                .Where(g => dto.GenreIds.Contains(g.ID))
                .ToListAsync();

            var tags = await _inkVerseDB.Tags
                .Where(t => dto.TagIds.Contains(t.ID))
                .ToListAsync();





            foreach (var g in genres) book.Genres.Add(g);
            foreach (var t in tags) book.Tags.Add(t);

            await _inkVerseDB.SaveChangesAsync();

            return new BookReadDto
            {
                Id = book.ID,
                Title = book.Title,
                Description = book.Description,
                CoverImageUrl = book.CoverImageUrl,
                IsFanfic = (verseType == VerseType.Fanfic),
                Status = book.Status.ToString(),
                WordCount = book.WordCount,
                TotalViews = book.TotalViews,
                AverageRating = book.AverageRating,
                AuthorName = book.Author?.UserName,
                VerseType = book.VerseType.ToString(),
                OriginType = book.OriginType.ToString(),
                Genres = book.Genres.Select(g => g.Name).ToList(),
                Tags = book.Tags.Select(t => t.Name).ToList(),
                GenreIds = book.Genres.Select(g => g.ID).ToList(),
                TagIds = book.Tags.Select(t => t.ID).ToList(),
                SourceUrl= book.SourceUrl,

            };
        }

        public async Task<bool> DeleteBookAsync(int id)
        {
            var book = await _inkVerseDB.Books.FindAsync(id);
            if (book == null) return false;

            _inkVerseDB.Books.Remove(book);
            await _inkVerseDB.SaveChangesAsync();
            return true;
        }

        public async Task<List<BookReadDto>> GetBooksByAuthorAsync(string authorId)
        {
            return await _inkVerseDB.Books
                .Where(b => b.AuthorId == authorId)
                .Include(b => b.Genres)
                .Include(b => b.Tags)
                .Select(b => new BookReadDto
                {
                    Id = b.ID,
                    Title = b.Title,
                    Description = b.Description,
                    IsFanfic = b.IsFanfic,
                    VerseType = b.VerseType.ToString(),
                    OriginType = b.OriginType.ToString(),
                    Genres = b.Genres.Select(g => g.Name).ToList(),
                    Tags = b.Tags.Select(t => t.Name).ToList()
                }).ToListAsync();
        }

        public async Task<List<BookReadDto>> SearchBooksAsync(string searchTerm)
        {
            var term = searchTerm ?? "";

            return await _inkVerseDB.Books
                .Where(b =>
                        (b.Title ?? "").Contains(term) ||
                        (b.Description ?? "").Contains(term)).Include(b => b.Genres)
                .Include(b => b.Tags)
                .Select(b => new BookReadDto
                {
                    Id = b.ID,
                    Title = b.Title,
                    Description = b.Description,
                    IsFanfic = b.IsFanfic,
                    VerseType = b.VerseType.ToString(),
                    OriginType = b.OriginType.ToString(),
                    Genres = b.Genres.Select(g => g.Name).ToList(),
                    Tags = b.Tags.Select(t => t.Name).ToList()
                }).ToListAsync();
        }

        public async Task RecalcAllBookWordCountsAsync()
        {
            var bookIds = await _inkVerseDB.Books.Select(b => b.ID).ToListAsync();

            foreach (var id in bookIds)
            {
                var total = await _inkVerseDB.Chapters
                    .Where(c => c.BookId == id)
                    .SumAsync(c => (int?)c.WordCount) ?? 0;

                var book = await _inkVerseDB.Books.FirstOrDefaultAsync(b => b.ID == id);
                if (book != null)
                    book.WordCount = total;
            }

            await _inkVerseDB.SaveChangesAsync();
        }

        public async Task<List<BookReadDto>> GetTopBooksByVerseTypeAsync(VerseType verseType, int take = 10)
        {
            take = take <= 0 ? 10 : Math.Min(take, 20);

            return await _inkVerseDB.Books
                .Include(b => b.Author)
                .Where(b => !b.IsDeleted && b.VerseType == verseType)
                .OrderByDescending(b => b.TotalViews)       // v1 “top” rule
                .ThenByDescending(b => b.AverageRating)
                .Take(take)
                .Select(b => new BookReadDto
                {
                    Id = b.ID,
                    Title = b.Title,
                    Description = b.Description,
                    CoverImageUrl = b.CoverImageUrl,
                    Status = b.Status.ToString(),
                    WordCount = b.WordCount,
                    TotalViews = b.TotalViews,
                    AverageRating = b.AverageRating,
                    AuthorId = b.AuthorId,
                    AuthorName = b.AuthorName ?? b.Author.UserName,
                    IsFanfic = b.IsFanfic,
                    VerseType = b.VerseType.ToString(),
                    OriginType = b.OriginType.ToString(),
                    Genres = b.Genres.Select(g => g.Name).ToList(),
                    Tags = b.Tags.Select(t => t.Name).ToList()
                })
                .ToListAsync();
        }

        public async Task<PagedResult<BookReadDto>> BrowseBooksAsync(BookBrowseQuery query)
        {
            var q = _inkVerseDB.Books
                .AsNoTracking()
                .Where(b => !b.IsDeleted)
                .Include(b => b.Author)
                .Include(b => b.Genres)
                .Include(b => b.Tags)

                .AsQueryable();

            if (query.VerseType.HasValue)
                q = q.Where(b=> b.VerseType == query.VerseType.Value);
            if (query.OriginType.HasValue)
                q = q.Where(b=> b.OriginType == query.OriginType.Value);

            if (query.Statuses != null && query.Statuses.Length > 0)
                q = q.Where(b => query.Statuses.Contains(b.Status));

            var term = query.SearchTerm?.Trim();
            if (!String.IsNullOrWhiteSpace(term))
            {
                q = q.Where(b =>
                   (b.Title ?? "").Contains(term) ||
                   (b.Description ?? "").Contains(term) ||
                   ((b.AuthorName ?? b.Author.UserName) ?? "").Contains(term)
                );


            }
            if (query.MinRating.HasValue)
                q = q.Where(b=> b.AverageRating >=  query.MinRating.Value);
            if (query.GenreIds != null && query.GenreIds.Length > 0)
                q = q.Where(b=> b.Genres.Any(g=> query.GenreIds.Contains(g.ID)));
            if (query.ExcludeGenreIds != null && query.ExcludeGenreIds.Length > 0)
                q = q.Where(b => !b.Genres.Any(g => query.ExcludeGenreIds.Contains(g.ID)));
            if (query.TagIds != null && query.TagIds.Length > 0)
                q = q.Where(b => b.Tags.Any(t => query.TagIds.Contains(t.ID)));
            if (query.ExcludeTagIds != null && query.ExcludeTagIds .Length > 0)
                q = q.Where(b => !b.Tags.Any(t => query.ExcludeTagIds.Contains(t.ID)));
            if (query.MinReviewCount.HasValue && query.MinReviewCount.Value > 0)
                q = q.Where(b => _inkVerseDB.Reviews.Count(r => r.BookId == b.ID) >= query.MinReviewCount.Value);

            if (query.TrendId.HasValue)
            {
                var tid = query.TrendId.Value;
                q = q.Where(b => b.BookTrends.Any(bt => bt.TrendID == tid));
            }

            if (query.TimeRange != TimeRange.All)
            {
                var now = DateTime.UtcNow;
                DateTime from = query.TimeRange switch
                {
                    TimeRange.Weekly => now.AddDays(-7),
                    TimeRange.Month => now.AddMonths(-1),
                    TimeRange.HalfYear => now.AddMonths(-6),
                    TimeRange.Year => now.AddYears(-1),
                    _ => DateTime.MinValue
                };

                q = q.Where(b => b.CreatedAt >= from);
            }




            var sortBy = (query.SortBy ?? "UpdatedAt").Trim();
            var asc = query.IsAscending ?? false;

            q = sortBy.ToLower() switch
            {
                "updatedat" => asc
                    ? q.OrderBy(b => b.UpdatedAt ?? b.CreatedAt)
                    : q.OrderByDescending(b => b.UpdatedAt ?? b.CreatedAt),

                "createdat" => asc
                    ? q.OrderBy(b => b.CreatedAt)
                    : q.OrderByDescending(b => b.CreatedAt),

                "totalviews" => asc
                    ? q.OrderBy(b => b.TotalViews)
                    : q.OrderByDescending(b => b.TotalViews),

                "title" => asc
                    ? q.OrderBy(b => b.Title)
                    : q.OrderByDescending(b => b.Title),

                "averagerating" => asc
                    ? q.OrderBy(b => b.AverageRating)
                    : q.OrderByDescending(b => b.AverageRating),

                "reviewcount" => asc
                    ? q.OrderBy(b => _inkVerseDB.Reviews.Count(r => r.BookId == b.ID))
                    : q.OrderByDescending(b => _inkVerseDB.Reviews.Count(r => r.BookId == b.ID)),

                "chaptercount" => asc
                    ? q.OrderBy(b => _inkVerseDB.Chapters.Count(c => c.BookId == b.ID))
                    : q.OrderByDescending(b => _inkVerseDB.Chapters.Count(c => c.BookId == b.ID)),

                "random" => q.OrderBy(_ => Guid.NewGuid()),

                _ => asc ? q.OrderBy(b => b.Title) : q.OrderByDescending(b => b.Title),
            };


            // 10) Paging
            var pageSize = query.PageSize <= 0 ? 24 : query.PageSize;
            var pageNumber = query.PageNumber <= 0 ? 1 : query.PageNumber;

            var totalCount = await q.CountAsync();
            var items = await q
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(b => new BookReadDto
                {
                    Id = b.ID,
                    Title = b.Title,
                    Description = b.Description,
                    CoverImageUrl = b.CoverImageUrl,

                    AuthorId = b.AuthorId,
                    AuthorName = b.AuthorName ?? b.Author.UserName,

                    Status = b.Status.ToString(),
                    WordCount = b.WordCount,
                    TotalViews = b.TotalViews,
                    AverageRating = b.AverageRating,

                    CreatedAt = b.CreatedAt,
                    UpdatedAt = b.UpdatedAt,

                    ReviewsCount = _inkVerseDB.Reviews.Count(r => r.BookId == b.ID),
                    ChaptersCount = _inkVerseDB.Chapters.Count(c => c.BookId == b.ID),

                    IsFanfic = b.IsFanfic,
                    VerseType = b.VerseType.ToString(),
                    OriginType = b.OriginType.ToString(),

                    Genres = b.Genres.Select(g => g.Name).ToList(),
                    Tags = b.Tags.Select(t => t.Name).ToList(),
                    GenreIds = b.Genres.Select(g => g.ID).ToList(),
                    TagIds = b.Tags.Select(t => t.ID).ToList(),

                    SourceUrl = b.SourceUrl,

                })
                .ToListAsync();

            return new PagedResult<BookReadDto>
            {
                Items = items,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount
            };

        }


    }

}
