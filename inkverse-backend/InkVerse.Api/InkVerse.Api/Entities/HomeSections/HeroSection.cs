using InkVerse.Api.Entities.Base;

public class HeroBanner : CrudBase
{
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string? RedirectUrl { get; set; } // Could be BookId or custom link
    public bool IsActive { get; set; } = true;
}
