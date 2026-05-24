using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.Entities.SiteVisuals;

public class SiteVisualAsset
{
    [Key]
    public int ID { get; set; }

    [MaxLength(120)]
    public string SlotKey { get; set; } = string.Empty;

    [MaxLength(160)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string ImageUrl { get; set; } = string.Empty;

    [MaxLength(240)]
    public string AltText { get; set; } = string.Empty;

    public double ImagePositionX { get; set; } = 50;

    public double ImagePositionY { get; set; } = 50;

    public double ImageScale { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedById { get; set; }
}
