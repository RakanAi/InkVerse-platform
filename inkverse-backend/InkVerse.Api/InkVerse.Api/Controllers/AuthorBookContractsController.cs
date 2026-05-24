using System.Security.Claims;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Authorize(Roles = "Author,Admin")]
[Route("api/author/books/{bookId:int}/contract")]
public class AuthorBookContractsController : ControllerBase
{
    private readonly IBookContractService _contracts;

    public AuthorBookContractsController(IBookContractService contracts)
    {
        _contracts = contracts;
    }

    [HttpGet]
    public async Task<IActionResult> GetContract(int bookId)
    {
        try
        {
            return Ok(await _contracts.GetAuthorBookContractAsync(bookId, GetUserId(), User.IsInRole("Admin")));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("attest-rights")]
    public async Task<IActionResult> AttestRights(int bookId)
    {
        try
        {
            return Ok(await _contracts.AttestRightsAsync(bookId, GetUserId(), User.IsInRole("Admin")));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
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
