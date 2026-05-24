using InkVerse.Api.DTOs.SiteVisuals;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Route("api/site-visual-assets")]
public class SiteVisualAssetsController : ControllerBase
{
    private readonly ISiteVisualAssetService _assets;

    public SiteVisualAssetsController(ISiteVisualAssetService assets)
    {
        _assets = assets;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SiteVisualAssetDto>>> GetActive()
    {
        var assets = await _assets.GetAllAsync(includeInactive: false);
        return Ok(assets);
    }

    [HttpGet("{slotKey}")]
    public async Task<ActionResult<SiteVisualAssetDto>> GetBySlotKey(string slotKey)
    {
        var asset = await _assets.GetBySlotKeyAsync(slotKey);
        return asset == null ? NotFound() : Ok(asset);
    }
}
