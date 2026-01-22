using InkVerse.Api.DTOs.Genres;

namespace InkVerse.Api.Services.InterFace
{
    public interface IGenreService
    {
        Task<List<GenreDto>> GetAllAsync(bool includeInactive = true);
        Task<GenreDto?> GetByIdAsync(int id);

        Task<GenreDto> CreateAsync(GenreCreateDto dto);
        Task<GenreDto?> UpdateAsync(int id, GenreUpdateDto dto);
        Task<bool> DeleteAsync(int id);

        Task<bool> AddToBookAsync(int genreId, int bookId);
        Task<bool> RemoveFromBookAsync(int genreId, int bookId);
        Task<List<int>> GetBookIdsAsync(int genreId);
    }
}
