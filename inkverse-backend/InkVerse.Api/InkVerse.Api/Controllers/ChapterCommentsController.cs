using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.Comment;
using InkVerse.Api.Services.InterFace;

[ApiController]
[Route("api")]
public class ChapterCommentsController : ControllerBase
{
    private readonly IChapterCommentService _service;

    public ChapterCommentsController(IChapterCommentService service)
    {
        _service = service;
    }

    // Public: guests can read
    [HttpGet("chapters/{chapterId:int}/comments")]
    public async Task<IActionResult> Get(int chapterId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); // null if guest
        var comments = await _service.GetChapterCommentsAsync(chapterId, userId);
        return Ok(comments);
    }

    [Authorize]
    [HttpPost("chapters/{chapterId:int}/comments")]
    public async Task<IActionResult> Create(int chapterId, [FromBody] CommentCreateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var created = await _service.AddCommentAsync(chapterId, userId, dto);
        return Ok(created);
    }

    [Authorize]
    [HttpPost("comments/{commentId:int}/reaction")]
    public async Task<IActionResult> React(int commentId, [FromBody] ReactionDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await _service.ToggleReactionAsync(commentId, userId, dto.Value);
        return Ok();
    }

    [Authorize]
    [HttpDelete("comments/{commentId:int}")]
    public async Task<IActionResult> Delete(int commentId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await _service.DeleteCommentAsync(commentId, userId);
        return NoContent();
    }

    [Authorize]
    [HttpPut("comments/{commentId:int}")]
    public async Task<IActionResult> Update(int commentId, [FromBody] CommentUpdateDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var updated = await _service.UpdateCommentAsync(commentId, userId, dto);
        return Ok(updated);
    }
}

public class ReactionDto
{
    public int Value { get; set; } // 1 or -1
}
