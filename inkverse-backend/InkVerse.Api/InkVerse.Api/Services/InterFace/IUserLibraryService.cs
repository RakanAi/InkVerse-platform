using InkVerse.Api.DTOs.User;
using InkVerse.Api.DTOs.UserLibrary;


namespace InkVerse.Api.Services.InterFace
{
    public interface IUserLibraryService
    {
        Task<List<UserLibraryDto>> GetUserLibraryAsync(string userId);
        Task<bool> AddBookToLibraryAsync(string userId, int bookId);
        Task<bool> RemoveBookFromLibraryAsync(string userId, int bookId);
        Task<bool> UpdateStatusAsync(string userId, int bookId, string status);
        Task<bool> IsInLibraryAsync(string userId, int bookId);
        Task<bool> TouchLastReadAsync(string userId, int bookId, int chapterId);
        
    }

}
