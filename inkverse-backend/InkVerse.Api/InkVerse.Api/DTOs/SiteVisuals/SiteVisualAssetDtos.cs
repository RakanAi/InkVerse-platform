namespace InkVerse.Api.DTOs.SiteVisuals;

public class SiteVisualAssetDto
{
    public int Id { get; set; }
    public string SlotKey { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string AltText { get; set; } = string.Empty;
    public double ImagePositionX { get; set; } = 50;
    public double ImagePositionY { get; set; } = 50;
    public double ImageScale { get; set; } = 1;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class SiteVisualAssetUpdateDto
{
    public string? ImageUrl { get; set; }
    public string? AltText { get; set; }
    public double? ImagePositionX { get; set; }
    public double? ImagePositionY { get; set; }
    public double? ImageScale { get; set; }
    public bool IsActive { get; set; } = true;
}
