using InkVerse.Api.DTOs.Moderation;

namespace InkVerse.Api.Services.InterFace;

public interface IModerationService
{
    Task<ClawbotModerationRunResultDto> RunClawbotScanAsync(int take, string? actorId = null);
    Task<List<ModerationCaseDto>> GetCasesAsync(string? status, string? source, string? type, bool? requiresAdmin);
    Task<ModerationCaseDto?> GetCaseAsync(int id);
    Task<ModerationCaseDto?> DecideCaseAsync(int id, string adminId, ModerationCaseDecisionDto dto);
    Task<ModerationCaseDto?> AddMessageAsync(int id, string adminId, ModerationCaseMessageCreateDto dto);
    Task<int> CountAdminQueueAsync();
    Task<int> CountAutoHandledTodayAsync();
}
