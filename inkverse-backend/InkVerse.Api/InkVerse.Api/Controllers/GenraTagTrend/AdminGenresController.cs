using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InkVerse.Api.Services.InterFace;
using InkVerse.Api.DTOs.Genres;
using InkVerse.Api.DTOs.Common;


namespace InkVerse.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/genres")]
    [Authorize(Roles = "Admin")]
    public class AdminGenresController : ControllerBase
    {
        private readonly IGenreService _svc;

        public AdminGenresController(IGenreService svc)
        {
            _svc = svc;
        }

        [HttpGet]
        public async Task<ActionResult<List<GenreDto>>> GetAll([FromQuery] bool includeInactive = true)
        {
            var items = await _svc.GetAllAsync(includeInactive);
            return Ok(items);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<GenreDto>> GetById(int id)
        {
            var item = await _svc.GetByIdAsync(id);
            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<ActionResult<GenreDto>> Create([FromBody] GenreCreateDto dto)
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
        public async Task<ActionResult<GenreDto>> Update(int id, [FromBody] GenreUpdateDto dto)
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

        // Link genre to book
        [HttpPost("{genreId:int}/books")]
        public async Task<IActionResult> AddToBook(int genreId, [FromBody] BookLinkDto dto)
        {
            if (dto.BookId <= 0) return BadRequest("BookId is required.");

            var ok = await _svc.AddToBookAsync(genreId, dto.BookId);
            return ok ? Ok() : NotFound("Genre or Book not found.");
        }

        // Unlink genre from book
        [HttpDelete("{genreId:int}/books/{bookId:int}")]
        public async Task<IActionResult> RemoveFromBook(int genreId, int bookId)
        {
            var ok = await _svc.RemoveFromBookAsync(genreId, bookId);
            return ok ? NoContent() : NotFound();
        }

        // List linked books (ids)
        [HttpGet("{genreId:int}/books")]
        public async Task<ActionResult<List<int>>> GetBookIds(int genreId)
        {
            var ids = await _svc.GetBookIdsAsync(genreId);
            return Ok(ids);
        }
    }
}
