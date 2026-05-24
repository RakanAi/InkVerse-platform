using System.Security.Claims;
using InkVerse.Api.DTOs.BookBible;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers;

[ApiController]
[Authorize(Roles = "Author,Admin")]
[Route("api/author/book-bible/books/{bookId:int}")]
public class AuthorBookBibleController : ControllerBase
{
    private readonly IBookBibleService _bookBible;

    public AuthorBookBibleController(IBookBibleService bookBible)
    {
        _bookBible = bookBible;
    }

    [HttpGet]
    public async Task<IActionResult> GetSnapshot(int bookId)
    {
        return Ok(await _bookBible.GetSnapshotAsync(bookId, GetUserId(), User.IsInRole("Admin")));
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(int bookId, [FromBody] BookBibleProfileUpdateDto dto)
    {
        return Ok(await _bookBible.UpdateProfileAsync(bookId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpPost("world-entries")]
    public async Task<IActionResult> CreateWorldEntry(int bookId, [FromBody] BookWorldEntryWriteDto dto)
    {
        return Ok(await _bookBible.CreateWorldEntryAsync(bookId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpPut("world-entries/{entryId:int}")]
    public async Task<IActionResult> UpdateWorldEntry(int bookId, int entryId, [FromBody] BookWorldEntryWriteDto dto)
    {
        return Ok(await _bookBible.UpdateWorldEntryAsync(bookId, entryId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpDelete("world-entries/{entryId:int}")]
    public async Task<IActionResult> DeleteWorldEntry(int bookId, int entryId)
    {
        await _bookBible.DeleteWorldEntryAsync(bookId, entryId, GetUserId(), User.IsInRole("Admin"));
        return NoContent();
    }

    [HttpPost("characters")]
    public async Task<IActionResult> CreateCharacter(int bookId, [FromBody] BookCharacterProfileWriteDto dto)
    {
        return Ok(await _bookBible.CreateCharacterAsync(bookId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpPut("characters/{characterId:int}")]
    public async Task<IActionResult> UpdateCharacter(int bookId, int characterId, [FromBody] BookCharacterProfileWriteDto dto)
    {
        return Ok(await _bookBible.UpdateCharacterAsync(bookId, characterId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpDelete("characters/{characterId:int}")]
    public async Task<IActionResult> DeleteCharacter(int bookId, int characterId)
    {
        await _bookBible.DeleteCharacterAsync(bookId, characterId, GetUserId(), User.IsInRole("Admin"));
        return NoContent();
    }

    [HttpPost("relationships")]
    public async Task<IActionResult> CreateRelationship(int bookId, [FromBody] BookCharacterRelationshipWriteDto dto)
    {
        return Ok(await _bookBible.CreateRelationshipAsync(bookId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpPut("relationships/{relationshipId:int}")]
    public async Task<IActionResult> UpdateRelationship(int bookId, int relationshipId, [FromBody] BookCharacterRelationshipWriteDto dto)
    {
        return Ok(await _bookBible.UpdateRelationshipAsync(bookId, relationshipId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpDelete("relationships/{relationshipId:int}")]
    public async Task<IActionResult> DeleteRelationship(int bookId, int relationshipId)
    {
        await _bookBible.DeleteRelationshipAsync(bookId, relationshipId, GetUserId(), User.IsInRole("Admin"));
        return NoContent();
    }

    [HttpPost("plot-threads")]
    public async Task<IActionResult> CreatePlotThread(int bookId, [FromBody] BookPlotThreadWriteDto dto)
    {
        return Ok(await _bookBible.CreatePlotThreadAsync(bookId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpPut("plot-threads/{threadId:int}")]
    public async Task<IActionResult> UpdatePlotThread(int bookId, int threadId, [FromBody] BookPlotThreadWriteDto dto)
    {
        return Ok(await _bookBible.UpdatePlotThreadAsync(bookId, threadId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpDelete("plot-threads/{threadId:int}")]
    public async Task<IActionResult> DeletePlotThread(int bookId, int threadId)
    {
        await _bookBible.DeletePlotThreadAsync(bookId, threadId, GetUserId(), User.IsInRole("Admin"));
        return NoContent();
    }

    [HttpPost("timeline-events")]
    public async Task<IActionResult> CreateTimelineEvent(int bookId, [FromBody] BookTimelineEventWriteDto dto)
    {
        return Ok(await _bookBible.CreateTimelineEventAsync(bookId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpPut("timeline-events/{eventId:int}")]
    public async Task<IActionResult> UpdateTimelineEvent(int bookId, int eventId, [FromBody] BookTimelineEventWriteDto dto)
    {
        return Ok(await _bookBible.UpdateTimelineEventAsync(bookId, eventId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpDelete("timeline-events/{eventId:int}")]
    public async Task<IActionResult> DeleteTimelineEvent(int bookId, int eventId)
    {
        await _bookBible.DeleteTimelineEventAsync(bookId, eventId, GetUserId(), User.IsInRole("Admin"));
        return NoContent();
    }

    [HttpPost("ai/quote")]
    public async Task<IActionResult> QuoteSuggestions(int bookId, [FromBody] BookBibleAiQuoteRequestDto dto)
    {
        return Ok(await _bookBible.QuoteSuggestionsAsync(bookId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpPost("ai/suggestions")]
    public async Task<IActionResult> CreateSuggestions(int bookId, [FromBody] BookBibleAiQuoteRequestDto dto)
    {
        return Ok(await _bookBible.CreateSuggestionsAsync(bookId, GetUserId(), User.IsInRole("Admin"), dto));
    }

    [HttpPost("suggestions/{suggestionId:int}/accept")]
    public async Task<IActionResult> AcceptSuggestion(int bookId, int suggestionId)
    {
        return Ok(await _bookBible.AcceptSuggestionAsync(bookId, suggestionId, GetUserId(), User.IsInRole("Admin")));
    }

    [HttpPost("suggestions/{suggestionId:int}/reject")]
    public async Task<IActionResult> RejectSuggestion(int bookId, int suggestionId)
    {
        return Ok(await _bookBible.RejectSuggestionAsync(bookId, suggestionId, GetUserId(), User.IsInRole("Admin")));
    }

    private string GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new UnauthorizedAccessException("No user id found in token.");
    }
}
