using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.Chapter;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/books/{bookId:int}/chapters")]
    [Authorize(Roles = "Admin,Author")]
    public class AdminChaptersController : ControllerBase
    {
        private readonly IAdminChapterService _chapterService;

        public AdminChaptersController(IAdminChapterService chapterService)
        {
            _chapterService = chapterService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(int bookId)
        {
            var items = await _chapterService.GetChaptersByBookAsync(bookId);
            return Ok(items);
        }

        [HttpGet("{chapterId:int}")]
        public async Task<IActionResult> GetOne(int bookId, int chapterId)
        {
            var item = await _chapterService.GetChapterAsync(bookId, chapterId);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<IActionResult> Create(int bookId, [FromBody] ChapterCreateDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var created = await _chapterService.CreateChapterAsync(bookId, dto, userId, isAdmin);
            return Ok(created);
        }

        [HttpPut("{chapterId:int}")]
        public async Task<IActionResult> Update(int bookId, int chapterId, [FromBody] ChapterUpdateDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var isAdmin = User.IsInRole("Admin");
                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var updated = await _chapterService.UpdateChapterAsync(bookId, chapterId, dto, userId, isAdmin);
                if (updated == null) return NotFound();

                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{chapterId:int}")]
        public async Task<IActionResult> Delete(int bookId, int chapterId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var ok = await _chapterService.DeleteChapterAsync(bookId, chapterId, userId, isAdmin);
            if (!ok) return NotFound();

            return Ok();
        }




    }
}
