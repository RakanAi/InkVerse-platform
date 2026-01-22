using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.Services.InterFace;

[ApiController]
[Route("api")]
public class UserLibraryController : ControllerBase
{
    private readonly IUserLibraryService _library;

    public UserLibraryController(IUserLibraryService library)
    {
        _library = library;
    }

    [Authorize]
    [HttpGet("me/library")]
    public async Task<IActionResult> MyLibrary()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var items = await _library.GetUserLibraryAsync(userId);
        return Ok(items);
    }

    [Authorize]
    [HttpGet("books/{bookId:int}/in-library")]
    public async Task<IActionResult> InLibrary(int bookId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var exists = await _library.IsInLibraryAsync(userId, bookId);
        return Ok(new { inLibrary = exists });
    }

    [Authorize]
    [HttpPost("books/{bookId:int}/library")]
    public async Task<IActionResult> Add(int bookId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var ok = await _library.AddBookToLibraryAsync(userId, bookId);
        return ok ? Ok() : BadRequest("Cannot add (maybe already exists or book not found).");
    }

    [Authorize]
    [HttpDelete("books/{bookId:int}/library")]
    public async Task<IActionResult> Remove(int bookId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var ok = await _library.RemoveBookFromLibraryAsync(userId, bookId);
        return ok ? NoContent() : NotFound();
    }

    public class StatusDto { public string Status { get; set; } = "Reading"; }

    [Authorize]
    [HttpPut("books/{bookId:int}/library/status")]
    public async Task<IActionResult> UpdateStatus(int bookId, [FromBody] StatusDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var ok = await _library.UpdateStatusAsync(userId, bookId, dto.Status);
        return ok ? Ok() : BadRequest("Invalid status or entry not found.");
    }

    [Authorize]
    [HttpPost("books/{bookId:int}/library/touch-last-read/{chapterId:int}")]
    public async Task<IActionResult> TouchLastRead(int bookId, int chapterId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var ok = await _library.TouchLastReadAsync(userId, bookId, chapterId);
        return ok ? Ok() : BadRequest("Entry not found.");
    }
}
