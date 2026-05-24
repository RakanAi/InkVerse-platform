using System.Security.Claims;
using InkVerse.Api.DTOs.Monetization;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Authorize(Roles = "Author,Admin")]
[Route("api/author/monetization")]
public class AuthorMonetizationController : ControllerBase
{
    private readonly IMonetizationService _monetization;

    public AuthorMonetizationController(IMonetizationService monetization)
    {
        _monetization = monetization;
    }

    [HttpGet("agreement")]
    public async Task<IActionResult> GetAgreement()
    {
        return Ok(await _monetization.GetAuthorAgreementStatusAsync(GetUserId()));
    }

    [HttpPost("agreement/accept")]
    public async Task<IActionResult> AcceptAgreement([FromBody] AcceptAuthorAgreementDto dto)
    {
        if (!dto.Accept) return BadRequest(new { message = "Agreement must be accepted." });
        return Ok(await _monetization.AcceptAuthorAgreementAsync(GetUserId()));
    }

    [HttpGet("earnings")]
    public async Task<IActionResult> GetEarnings()
    {
        return Ok(await _monetization.GetAuthorEarningsAsync(GetUserId()));
    }

    [HttpPost("payout-requests")]
    public async Task<IActionResult> RequestPayout([FromBody] CreatePayoutRequestDto dto)
    {
        return Ok(await _monetization.RequestPayoutAsync(GetUserId(), dto));
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("No user id found in token.");
    }
}
