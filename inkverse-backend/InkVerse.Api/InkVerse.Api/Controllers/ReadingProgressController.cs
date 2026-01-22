using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Controllers
{
    [ApiController]
    [Route("api")]
    public class ReadingProgressController : ControllerBase
    {
        private readonly IReadingProgressService _readingProgressService;

        public ReadingProgressController(IReadingProgressService readingProgressService)
        {
            _readingProgressService = readingProgressService;
        }

        [Authorize]
        [HttpGet("books/{bookId:int}/reading-progress")]
        public async Task<IActionResult> GetReadingProgress(int bookId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var chapterId = await _readingProgressService.GetLastReadChapterAsync(bookId, userId);

            return Ok(new { lastReadChapterId = chapterId });
        }

        [Authorize]
        [HttpPost("books/{bookId:int}/reading-progress/{chapterId:int}")]
        public async Task<IActionResult> UpdateReadingProgress(int bookId, int chapterId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            await _readingProgressService.UpdateLastReadChapterAsync(bookId, chapterId, userId);
            return Ok();
        }



    }
}
