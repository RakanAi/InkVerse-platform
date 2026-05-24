using System.Security.Claims;
using InkVerse.Api.DTOs.Monetization;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/ai-services")]
public class AiServicesController : ControllerBase
{
    private readonly IAiStudioService _aiStudio;

    public AiServicesController(IAiStudioService aiStudio)
    {
        _aiStudio = aiStudio;
    }

    [HttpPost("quote")]
    public async Task<IActionResult> Quote([FromBody] AiQuoteRequestDto dto)
    {
        return Ok(await _aiStudio.QuoteAsync(GetUserId(), dto));
    }

    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] AiOrderRequestDto dto)
    {
        return Ok(await _aiStudio.CreateOrderAsync(GetUserId(), dto));
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("No user id found in token.");
    }
}
