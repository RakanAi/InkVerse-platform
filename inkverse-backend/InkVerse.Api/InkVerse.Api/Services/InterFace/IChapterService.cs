using InkVerse.Api.DTOs.Chapter;
using InkVerse.Api.Entities;

namespace InkVerse.Api.Services.InterFace
{
    public interface IChapterService
    {
        Task<List<ChapterReadDto>> GetByBookAsync(int bookId);
        Task<ChapterReadDto> CreateAsync(ChapterCreateDto dto, string? userId = null, bool isAdmin = false);
        Task<ChapterReadDto?> GetByIdAsync(int id);
        Task<ChapterReadDto?> UpdateAsync(int id, ChapterUpdateDto dto, string? userId = null, bool isAdmin = false);
        Task<bool> DeleteAsync(int id, string? userId = null, bool isAdmin = false);
        Task<List<object>> GetByBookGroupedAsync(int bookId);

        Task<FirstChapterDto?> GetFirstChapterAsync(int bookId);
    }
}
