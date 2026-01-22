using InkVerse.Api.DTOs.Chapter;

namespace InkVerse.Api.Services.InterFace
{
    public interface IArcService
    {
        Task<List<ArcReadDto>> GetArcsAsync(int bookId);

        Task<ArcReadDto> CreateArcAsync(int bookId, ArcCreateDto dto, string userId, bool isAdmin);
    }
}
