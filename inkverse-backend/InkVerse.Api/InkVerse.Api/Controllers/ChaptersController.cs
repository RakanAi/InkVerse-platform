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

        public ChaptersController(IChapterService chapterService)
        {
            _chapterService = chapterService;
        }
        
        // Creates a new chapter.
        
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ChapterCreateDto dto)
        {
            var chapter = await _chapterService.CreateAsync(dto);
            return CreatedAtAction(nameof(Get), new { id = chapter.Id }, chapter);
        }

        // Gets a chapter by its ID.

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var chapter = await _chapterService.GetByIdAsync(id);
            if (chapter == null) return NotFound();
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

        [HttpPut("{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] ChapterUpdateDto dto)
        {
            var updated = await _chapterService.UpdateAsync(id, dto);
            if (updated == null) return NotFound();
            return Ok(updated);
        }
        // Deletes a chapter by its ID.
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var success = await _chapterService.DeleteAsync(id);
            if (!success) return NotFound();
            return NoContent();
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
