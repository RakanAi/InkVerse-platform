using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.UserLibrary;
using InkVerse.Api.Entities;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Services.ServicesRepo
{
    public class UserLibraryService : IUserLibraryService
    {
        private readonly InkVerseDB _inkVerse;

        public UserLibraryService(InkVerseDB inkVerse)
        {
            _inkVerse = inkVerse;
        }

        public async Task<List<UserLibraryDto>> GetUserLibraryAsync(string userId)
        {
            var library = await _inkVerse.UserLibraries
                .Where(x => x.UserId == userId)
                .Include(x => x.Book)
                .OrderByDescending(x => x.LastReadAt ?? x.CreatedAt)
                .ToListAsync();


            return library.Select(x => new UserLibraryDto
            {
                BookId = x.BookId,
                Title = x.Book.Title,
                CoverImageUrl = x.Book.CoverImageUrl,
                Status = x.Status,
                LastReadChapterId = x.LastReadChapterId,
                LastReadAt = x.LastReadAt,
                IsInLibrary = x.IsInLibrary

            }).ToList();

        }

        public async Task<bool> AddBookToLibraryAsync(string userId, int bookId)
        {
            var entry = await _inkVerse.UserLibraries
                .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == bookId);

            if (entry != null)
            {
                entry.IsInLibrary = true;
                entry.Status = entry.Status ?? "Reading";
                entry.UpdatedAt = DateTime.UtcNow;
                await _inkVerse.SaveChangesAsync();
                return true;
            }

            // create new
            _inkVerse.UserLibraries.Add(new UserLibrary
            {
                UserId = userId,
                BookId = bookId,
                Status = "Reading",
                IsInLibrary = true,
                CreatedAt = DateTime.UtcNow
            });
            await _inkVerse.SaveChangesAsync();
            return true;
        }

        public async Task<bool> RemoveBookFromLibraryAsync(string userId, int bookId)
        {
            var entry = await _inkVerse.UserLibraries
                .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == bookId);

            if (entry == null) return false;

            entry.IsInLibrary = false;
            entry.UpdatedAt = DateTime.UtcNow;
            await _inkVerse.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateStatusAsync(string userId, int bookId, string status)
        {
            var validStatuses = new[] { "Reading", "Completed", "Dropped", "Planned" };
            if (!validStatuses.Contains(status)) return false;

            var entry = await _inkVerse.UserLibraries
                .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == bookId);

            if (entry == null) return false;

            entry.Status = status;
            entry.UpdatedAt = DateTime.UtcNow;

            await _inkVerse.SaveChangesAsync();
            return true;
        }
        public async Task<bool> IsInLibraryAsync(string userId, int bookId)
        {
            return await _inkVerse.UserLibraries
                .AnyAsync(x => x.UserId == userId && x.BookId == bookId && x.IsInLibrary);
        }

        public async Task<bool> TouchLastReadAsync(string userId, int bookId, int chapterId)
        {
            var entry = await _inkVerse.UserLibraries
                .FirstOrDefaultAsync(x => x.UserId == userId && x.BookId == bookId);

            if (entry == null)
            {
                // auto-add to library when user starts reading (optional)
                entry = new UserLibrary
                {
                    UserId = userId,
                    BookId = bookId,
                    Status = "Reading",
                    IsInLibrary = false,
                    CreatedAt = DateTime.UtcNow
                };
                _inkVerse.UserLibraries.Add(entry);
            }

            entry.LastReadChapterId = chapterId;
            entry.LastReadAt = DateTime.UtcNow;
            entry.UpdatedAt = DateTime.UtcNow;

            await _inkVerse.SaveChangesAsync();
            return true;
        }
    }
}
