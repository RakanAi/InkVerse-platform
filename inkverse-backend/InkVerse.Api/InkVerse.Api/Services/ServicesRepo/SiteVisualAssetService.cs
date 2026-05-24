using InkVerse.Api.Data;
using InkVerse.Api.DTOs.SiteVisuals;
using InkVerse.Api.Entities.SiteVisuals;
using InkVerse.Api.Services.InterFace;
using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Services.ServicesRepo;

public class SiteVisualAssetService : ISiteVisualAssetService
{
    private static readonly IReadOnlyList<SiteVisualSlotDefinition> KnownSlots =
    [
        new(
            "home.hero",
            "Home hero image",
            "Large visual poster shown in the home page hero.",
            "InkVerse home hero artwork"),
        new(
            "author.onboarding",
            "Author onboarding image",
            "Visual shown before a signed-in reader becomes an author.",
            "InkVerse author studio visual")
    ];

    private readonly InkVerseDB _db;

    public SiteVisualAssetService(InkVerseDB db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<SiteVisualAssetDto>> GetAllAsync(bool includeInactive = false)
    {
        await EnsureKnownSlotsAsync();

        var query = _db.SiteVisualAssets.AsNoTracking();
        if (!includeInactive)
        {
            query = query.Where(item => item.IsActive);
        }

        var assets = await query
            .OrderBy(item => item.ID)
            .ToListAsync();

        return assets.Select(ToDto).ToList();
    }

    public async Task<SiteVisualAssetDto?> GetBySlotKeyAsync(string slotKey, bool includeInactive = false)
    {
        await EnsureKnownSlotsAsync();

        var normalized = NormalizeSlotKey(slotKey);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        var asset = await _db.SiteVisualAssets
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.SlotKey == normalized);

        if (asset == null || (!includeInactive && !asset.IsActive))
        {
            return null;
        }

        return ToDto(asset);
    }

    public async Task<SiteVisualAssetDto> UpdateAsync(string slotKey, SiteVisualAssetUpdateDto dto, string? updatedById)
    {
        await EnsureKnownSlotsAsync();

        var normalized = NormalizeSlotKey(slotKey);
        if (KnownSlots.All(slot => slot.SlotKey != normalized))
        {
            throw new InvalidOperationException("Unknown visual asset slot.");
        }

        var asset = await _db.SiteVisualAssets.FirstOrDefaultAsync(item => item.SlotKey == normalized);
        if (asset == null)
        {
            throw new InvalidOperationException("Visual asset slot was not initialized.");
        }

        asset.ImageUrl = dto.ImageUrl?.Trim() ?? string.Empty;
        asset.AltText = dto.AltText?.Trim() ?? asset.AltText;
        asset.ImagePositionX = Clamp(dto.ImagePositionX ?? asset.ImagePositionX, 0, 100);
        asset.ImagePositionY = Clamp(dto.ImagePositionY ?? asset.ImagePositionY, 0, 100);
        asset.ImageScale = Clamp(dto.ImageScale ?? asset.ImageScale, 1, 3);
        asset.IsActive = dto.IsActive;
        asset.UpdatedAt = DateTime.UtcNow;
        asset.UpdatedById = updatedById;

        await _db.SaveChangesAsync();
        return ToDto(asset);
    }

    private async Task EnsureKnownSlotsAsync()
    {
        var existing = await _db.SiteVisualAssets.ToDictionaryAsync(
            item => item.SlotKey,
            StringComparer.OrdinalIgnoreCase);

        var changed = false;

        foreach (var slot in KnownSlots)
        {
            if (!existing.TryGetValue(slot.SlotKey, out var asset))
            {
                _db.SiteVisualAssets.Add(new SiteVisualAsset
                {
                    SlotKey = slot.SlotKey,
                    Name = slot.Name,
                    Description = slot.Description,
                    AltText = slot.DefaultAltText,
                    ImagePositionX = 50,
                    ImagePositionY = 50,
                    ImageScale = 1,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                });
                changed = true;
                continue;
            }

            if (asset.Name != slot.Name || asset.Description != slot.Description)
            {
                asset.Name = slot.Name;
                asset.Description = slot.Description;
                asset.UpdatedAt = DateTime.UtcNow;
                changed = true;
            }

            if (string.IsNullOrWhiteSpace(asset.AltText))
            {
                asset.AltText = slot.DefaultAltText;
                changed = true;
            }
        }

        if (changed)
        {
            await _db.SaveChangesAsync();
        }
    }

    private static string NormalizeSlotKey(string? slotKey)
        => string.IsNullOrWhiteSpace(slotKey) ? string.Empty : slotKey.Trim().ToLowerInvariant();

    private static double Clamp(double value, double min, double max)
        => Math.Min(max, Math.Max(min, value));

    private static SiteVisualAssetDto ToDto(SiteVisualAsset asset)
        => new()
        {
            Id = asset.ID,
            SlotKey = asset.SlotKey,
            Name = asset.Name,
            Description = asset.Description,
            ImageUrl = asset.ImageUrl,
            AltText = asset.AltText,
            ImagePositionX = asset.ImagePositionX,
            ImagePositionY = asset.ImagePositionY,
            ImageScale = asset.ImageScale <= 0 ? 1 : asset.ImageScale,
            IsActive = asset.IsActive,
            CreatedAt = asset.CreatedAt,
            UpdatedAt = asset.UpdatedAt,
        };

    private sealed record SiteVisualSlotDefinition(
        string SlotKey,
        string Name,
        string Description,
        string DefaultAltText);
}
