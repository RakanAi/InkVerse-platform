using InkVerse.Api.DTOs.Achievements;

namespace InkVerse.Api.Services.InterFace;

public interface IAchievementService
{
    Task<ReaderProgressionDto> GetProgressionAsync(string userId, string? timezone = null);
    Task<AchievementsPageDto> GetAchievementsAsync(string userId);
    Task<ReadSessionStartDto> StartReadSessionAsync(int chapterId, string userId, string? timezone);
    Task<CompleteReadResultDto> CompleteChapterReadAsync(int chapterId, string userId, CompleteReadRequestDto dto);
    Task<IReadOnlyList<AchievementBadgeDto>> RefreshAchievementsAsync(string userId);
}
