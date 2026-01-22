using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InkVerse.Api.Services.InterFace;
using static InkVerse.Api.DTOs.TagTrenGen.TagDtos;
using InkVerse.Api.DTOs.Common;


namespace InkVerse.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/tags")]
    [Authorize(Roles = "Admin")]
    public class AdminTagsController : ControllerBase
    {
        private readonly ITagService _svc;

        public AdminTagsController(ITagService svc)
        {
            _svc = svc;
        }

        [HttpGet]
        public async Task<ActionResult<List<TagDto>>> GetAll([FromQuery] bool includeInactive = true)
        {
            var items = await _svc.GetAllAsync(includeInactive);
            return Ok(items);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TagDto>> GetById(int id)
        {
            var item = await _svc.GetByIdAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<ActionResult<TagDto>> Create([FromBody] TagCreateDto dto)
        {
            try
            {
                var created = await _svc.CreateAsync(dto);
                return Ok(created);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<TagDto>> Update(int id, [FromBody] TagUpdateDto dto)
        {
            try
            {
                var updated = await _svc.UpdateAsync(id, dto);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _svc.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }

        // Link tag to book
        [HttpPost("{tagId:int}/books")]
        public async Task<IActionResult> AddToBook(int tagId, [FromBody] BookLinkDto dto)
        {
            if (dto.BookId <= 0) return BadRequest("BookId is required.");

            var ok = await _svc.AddToBookAsync(tagId, dto.BookId);
            return ok ? Ok() : NotFound("Tag or Book not found.");
        }

        // Unlink tag from book
        [HttpDelete("{tagId:int}/books/{bookId:int}")]
        public async Task<IActionResult> RemoveFromBook(int tagId, int bookId)
        {
            var ok = await _svc.RemoveFromBookAsync(tagId, bookId);
            return ok ? NoContent() : NotFound();
        }

        // List linked books (ids)
        [HttpGet("{tagId:int}/books")]
        public async Task<ActionResult<List<int>>> GetBookIds(int tagId)
        {
            var ids = await _svc.GetBookIdsAsync(tagId);
            return Ok(ids);
        }
    }
}
