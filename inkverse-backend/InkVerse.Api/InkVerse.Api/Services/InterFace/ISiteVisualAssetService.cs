using InkVerse.Api.DTOs.SiteVisuals;

namespace InkVerse.Api.Services.InterFace;

public interface ISiteVisualAssetService
{
    Task<IReadOnlyList<SiteVisualAssetDto>> GetAllAsync(bool includeInactive = false);
    Task<SiteVisualAssetDto?> GetBySlotKeyAsync(string slotKey, bool includeInactive = false);
    Task<SiteVisualAssetDto> UpdateAsync(string slotKey, SiteVisualAssetUpdateDto dto, string? updatedById);
}
