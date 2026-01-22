using InkVerse.Api.DTOs.Book;
using InkVerse.Api.DTOs.Trends;

namespace InkVerse.Api.Services.Trends
{
    public interface ITrendService
    {
        Task<List<TrendDto>> GetAllAsync(bool includeInactive = true);
        Task<TrendDto?> GetByIdAsync(int id);

        Task<TrendDto> CreateAsync(TrendCreateDto dto);
        Task<TrendDto?> UpdateAsync(int id, TrendUpdateDto dto);
        Task<bool> DeleteAsync(int id);

        Task<bool> AddBookAsync(int trendId, int bookId);
        Task<bool> RemoveBookAsync(int trendId, int bookId);

        Task<List<int>> GetBookIdsAsync(int trendId);

        Task<List<BookReadDto>> GetTrendBooksAsync(int trendId, int take = 20);

    }
}
