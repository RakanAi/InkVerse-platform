using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.Chapter;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Controllers
{
    // <summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ChaptersController : ControllerBase
    {
        private readonly IChapterService _chapterService;
        private readonly IMonetizationService _monetizationService;

        public ChaptersController(IChapterService chapterService, IMonetizationService monetizationService)
        {
            _chapterService = chapterService;
            _monetizationService = monetizationService;
        }
        
        // Creates a new chapter.
        
        [Authorize(Roles = "Admin,Author")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ChapterCreateDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var chapter = await _chapterService.CreateAsync(dto, userId, User.IsInRole("Admin"));
                return CreatedAtAction(nameof(Get), new { id = chapter.Id }, chapter);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Gets a chapter by its ID.

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var chapter = await _chapterService.GetByIdAsync(id);
            if (chapter == null) return NotFound();
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            chapter = await _monetizationService.ApplyChapterAccessAsync(chapter, userId, User.IsInRole("Admin"));
            return Ok(chapter);
        }
        // Gets all chapters for a specific book.

        [HttpGet("book/{bookId}")]
        public async Task<IActionResult> GetByBook(int bookId)
        {
            var chapters = await _chapterService.GetByBookAsync(bookId);
            return Ok(chapters);
        }

        // Updates an existing chapter by its ID.

        [Authorize(Roles = "Admin,Author")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] ChapterUpdateDto dto)
        {
            try
            {
                var updated = await _chapterService.UpdateAsync(
                    id,
                    dto,
                    User.FindFirstValue(ClaimTypes.NameIdentifier),
                    User.IsInRole("Admin"));
                if (updated == null) return NotFound();
                return Ok(updated);
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
        // Deletes a chapter by its ID.
        [Authorize(Roles = "Admin,Author")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            try
            {
                var success = await _chapterService.DeleteAsync(
                    id,
                    User.FindFirstValue(ClaimTypes.NameIdentifier),
                    User.IsInRole("Admin"));
                if (!success) return NotFound();
                return NoContent();
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


        [HttpGet("book/{bookId}/grouped")]
        public async Task<IActionResult> GetChaptersGrouped(int bookId)
        {
            var groupedChapters = await _chapterService.GetByBookGroupedAsync(bookId);
            return Ok(groupedChapters);
        }

        [HttpGet("books/{bookId}/first-chapter")]
        public async Task<IActionResult> GetFirstChapter(int bookId)
        {
            var first = await _chapterService.GetFirstChapterAsync(bookId);
            if (first == null) return NotFound(new {message = "No chapter found for this book"});

            return Ok(first);
        }


    }


}
