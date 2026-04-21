using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.Comment;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Services.InterFace;

[ApiController]
[Route("api")]
public class ChapterCommentsController : ControllerBase
{
    private readonly IChapterCommentService _service;
    private readonly UserManager<AppUser> _userManager;

    public ChapterCommentsController(IChapterCommentService service, UserManager<AppUser> userManager)
    {
        _service = service;
        _userManager = userManager;
    }

    [HttpGet("chapters/{chapterId:int}/comments")]
    public async Task<IActionResult> Get(int chapterId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var comments = await _service.GetChapterCommentsAsync(chapterId, userId);
        return Ok(comments);
    }

    [Authorize]
    [HttpPost("chapters/{chapterId:int}/comments")]
    public async Task<IActionResult> Create(int chapterId, [FromBody] CommentCreateDto dto)
    {
        var banCheck = await EnsureCanCommentAsync();
        if (banCheck != null) return banCheck;

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var created = await _service.AddCommentAsync(chapterId, userId, dto);
        return Ok(created);
    }

    [Authorize]
    [HttpPost("comments/{commentId:int}/reaction")]
    public async Task<IActionResult> React(int commentId, [FromBody] ReactionDto dto)
    {
        var banCheck = await EnsureCanCommentAsync();
        if (banCheck != null) return banCheck;

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
        var banCheck = await EnsureCanCommentAsync();
        if (banCheck != null) return banCheck;

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var updated = await _service.UpdateCommentAsync(commentId, userId, dto);
        return Ok(updated);
    }

    private async Task<IActionResult?> EnsureCanCommentAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        if (user.IsBlocked)
            return StatusCode(StatusCodes.Status403Forbidden, "Your account is blocked.");

        if (user.IsCommentBanned)
            return StatusCode(StatusCodes.Status403Forbidden, "You are banned from commenting.");

        return null;
    }
}

public class ReactionDto
{
    public int Value { get; set; }
}
