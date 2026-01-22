using InkVerse.Api.DTOs.Chapter;

namespace InkVerse.Api.Services.InterFace
{
    public interface IAdminChapterService
    {
        Task<List<ChapterReadDto>> GetChaptersByBookAsync(int bookId);

        Task<ChapterReadDto?> GetChapterAsync(int bookId, int chapterId);

        Task<ChapterReadDto> CreateChapterAsync(int bookId, ChapterCreateDto dto, string userId, bool isAdmin);

        Task<ChapterReadDto?> UpdateChapterAsync(int bookId, int chapterId, ChapterUpdateDto dto, string userId, bool isAdmin);

        Task<bool> DeleteChapterAsync(int bookId, int chapterId, string userId, bool isAdmin);


    }
}
