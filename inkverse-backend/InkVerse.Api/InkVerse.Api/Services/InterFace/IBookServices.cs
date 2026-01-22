using InkVerse.Api.DTOs.Book;
using InkVerse.Api.Entities.Enums;
using InkVerse.Api.Helpers;

namespace InkVerse.Api.Services.InterFace
{
    public interface IBookServices
    {
        Task<List<BookReadDto>> GetAllBooksAsync(QueryObject query);
        Task<BookReadDto?> GetBookByIdAsync(int id);
        Task<BookReadDto> CreateBookAsync(BookCreateDto dto, string authorId);
        Task<BookReadDto?> UpdateBookAsync(int id, BookUpdateDto dto, string userId, bool isAdmin);
        Task<bool> DeleteBookAsync(int id);
        Task<List<BookReadDto>> GetBooksByAuthorAsync(string authorId);
        Task<List<BookReadDto>> SearchBooksAsync(string searchTerm);

        Task RecalcAllBookWordCountsAsync();

        Task<List<BookReadDto>> GetTopBooksByVerseTypeAsync(VerseType verseType, int take = 10);
        Task<PagedResult<BookReadDto>> BrowseBooksAsync(BookBrowseQuery query);

    }
}
