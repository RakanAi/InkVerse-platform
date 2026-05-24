using System.Security.Claims;
using InkVerse.Api.DTOs.Monetization;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Authorize(Roles = "Author,Admin")]
[Route("api/author/story-studio")]
public class AuthorStoryStudioController : ControllerBase
{
    private readonly IAiStudioService _aiStudio;

    public AuthorStoryStudioController(IAiStudioService aiStudio)
    {
        _aiStudio = aiStudio;
    }

    [HttpGet("books/{bookId:int}/notebook")]
    public async Task<IActionResult> GetNotebook(int bookId)
    {
        return Ok(await _aiStudio.GetNotebookAsync(bookId, GetUserId(), User.IsInRole("Admin")));
    }

    [HttpPost("books/{bookId:int}/notebook")]
    public async Task<IActionResult> CreateNotebookEntry(int bookId, [FromBody] CreateNotebookEntryDto dto)
    {
        return Ok(await _aiStudio.CreateNotebookEntryAsync(bookId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpPost("proofreading/orders")]
    public async Task<IActionResult> CreateProofreadingDraft([FromBody] ProofreadingOrderRequestDto dto)
    {
        return Ok(await _aiStudio.CreateProofreadingDraftAsync(GetUserId(), dto));
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("No user id found in token.");
    }
}
