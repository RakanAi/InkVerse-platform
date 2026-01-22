using InkVerse.Api.DTOs.Chapter;
using InkVerse.Api.Entities;

namespace InkVerse.Api.Services.InterFace
{
    public interface IChapterService
    {
        Task<List<ChapterReadDto>> GetByBookAsync(int bookId);
        Task<ChapterReadDto> CreateAsync(ChapterCreateDto dto);
        Task<ChapterReadDto?> GetByIdAsync(int id);
        Task<ChapterReadDto?> UpdateAsync(int id, ChapterUpdateDto dto);
        Task<bool> DeleteAsync(int id);
        Task<List<object>> GetByBookGroupedAsync(int bookId);

        Task<FirstChapterDto?> GetFirstChapterAsync(int bookId);
    }
}
