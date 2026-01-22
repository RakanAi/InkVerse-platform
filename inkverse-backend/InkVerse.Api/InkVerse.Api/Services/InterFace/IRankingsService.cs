using InkVerse.Api.DTOs.Book;

namespace InkVerse.Api.Services.InterFace
{
    public interface IRankingsService
    {
        Task<RankingsResponseDto> GetRankingsAsync(DateTime? nowUtc = null, CancellationToken ct = default);
    }
}