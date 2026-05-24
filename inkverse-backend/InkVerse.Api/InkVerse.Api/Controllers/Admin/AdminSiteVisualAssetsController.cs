using System.Security.Claims;
using InkVerse.Api.DTOs.SiteVisuals;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/site-visual-assets")]
[Authorize(Roles = "Admin")]
public class AdminSiteVisualAssetsController : ControllerBase
{
    private readonly ISiteVisualAssetService _assets;

    public AdminSiteVisualAssetsController(ISiteVisualAssetService assets)
    {
        _assets = assets;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SiteVisualAssetDto>>> GetAll()
    {
        var assets = await _assets.GetAllAsync(includeInactive: true);
        return Ok(assets);
    }

    [HttpPut("{slotKey}")]
    public async Task<ActionResult<SiteVisualAssetDto>> Update(
        string slotKey,
        [FromBody] SiteVisualAssetUpdateDto dto)
    {
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var updated = await _assets.UpdateAsync(slotKey, dto, userId);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
