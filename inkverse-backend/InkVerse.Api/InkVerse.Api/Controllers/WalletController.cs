using System.Security.Claims;
using InkVerse.Api.DTOs.Monetization;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/wallet")]
public class WalletController : ControllerBase
{
    private readonly IMonetizationService _monetization;

    public WalletController(IMonetizationService monetization)
    {
        _monetization = monetization;
    }

    [HttpGet]
    public async Task<IActionResult> GetWallet()
    {
        return Ok(await _monetization.GetWalletAsync(GetUserId()));
    }

    [HttpGet("ledger")]
    public async Task<IActionResult> GetLedger()
    {
        return Ok(await _monetization.GetWalletLedgerAsync(GetUserId()));
    }

    [HttpGet("packs")]
    public IActionResult GetPacks()
    {
        return Ok(_monetization.GetCoinPacks());
    }

    [HttpPost("checkout-sessions")]
    public async Task<IActionResult> CreateCheckoutSession([FromBody] CreateCheckoutSessionDto dto)
    {
        return Ok(await _monetization.CreateCheckoutSessionAsync(GetUserId(), dto));
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("No user id found in token.");
    }
}
