using System.Security.Claims;
using InkVerse.Api.DTOs.Monetization;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers.Admin;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/book-contracts")]
public class AdminBookContractsController : ControllerBase
{
    private readonly IBookContractService _contracts;

    public AdminBookContractsController(IBookContractService contracts)
    {
        _contracts = contracts;
    }

    [HttpGet]
    public async Task<IActionResult> GetQueue([FromQuery] string? status = null)
    {
        try
        {
            return Ok(await _contracts.GetAdminQueueAsync(status));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{bookId:int}/approve")]
    public async Task<IActionResult> Approve(int bookId, [FromBody] BookContractReviewRequestDto dto)
    {
        try
        {
            return Ok(await _contracts.ApproveAsync(bookId, GetUserId(), dto));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{bookId:int}/reject")]
    public async Task<IActionResult> Reject(int bookId, [FromBody] BookContractReviewRequestDto dto)
    {
        try
        {
            return Ok(await _contracts.RejectAsync(bookId, GetUserId(), dto));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{bookId:int}/revoke")]
    public async Task<IActionResult> Revoke(int bookId, [FromBody] BookContractReviewRequestDto dto)
    {
        try
        {
            return Ok(await _contracts.RevokeAsync(bookId, GetUserId(), dto));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("No user id found in token.");
    }
}
