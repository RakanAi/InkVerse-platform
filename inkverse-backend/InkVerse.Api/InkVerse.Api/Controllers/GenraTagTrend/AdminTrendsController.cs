using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InkVerse.Api.DTOs.Book;
using InkVerse.Api.DTOs.Trends;
using InkVerse.Api.Services.Trends;

namespace InkVerse.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/trends")]
    [Authorize(Roles = "Admin")]
    public class AdminTrendsController : ControllerBase
    {
        private readonly ITrendService _svc;

        public AdminTrendsController(ITrendService svc)
        {
            _svc = svc;
        }

        [HttpGet]
        public async Task<ActionResult<List<TrendDto>>> GetAll([FromQuery] bool includeInactive = true)
        {
            var trends = await _svc.GetAllAsync(includeInactive);
            return Ok(trends);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TrendDto>> GetById(int id)
        {
            var trend = await _svc.GetByIdAsync(id);
            if (trend == null) return NotFound();
            return Ok(trend);
        }

        [HttpPost]
        public async Task<ActionResult<TrendDto>> Create([FromBody] TrendCreateDto dto)
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
        public async Task<ActionResult<TrendDto>> Update(int id, [FromBody] TrendUpdateDto dto)
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

        // Link a book to a trend
        [HttpPost("{trendId:int}/books")]
        public async Task<IActionResult> AddBook(int trendId, [FromBody] TrendBookLinkDto dto)
        {
            if (dto.BookId <= 0) return BadRequest("BookId is required.");

            var ok = await _svc.AddBookAsync(trendId, dto.BookId);
            return ok ? Ok() : NotFound("Trend or Book not found.");
        }

        // Unlink a book from a trend
        [HttpDelete("{trendId:int}/books/{bookId:int}")]
        public async Task<IActionResult> RemoveBook(int trendId, int bookId)
        {
            var ok = await _svc.RemoveBookAsync(trendId, bookId);
            return ok ? NoContent() : NotFound();
        }

        // List linked books (ids)
        [HttpGet("{trendId:int}/book-ids")]
        public async Task<ActionResult<List<int>>> GetBookIds(int trendId)
        {
            var ids = await _svc.GetBookIdsAsync(trendId);
            return Ok(ids);
        }
        // List linked books (full info)
        [HttpGet("{trendId:int}/books")]
        public async Task<ActionResult<List<BookReadDto>>> GetBooks(int trendId, [FromQuery] int take = 50)
        {
            var books = await _svc.GetTrendBooksAsync(trendId, take);
            return Ok(books);
        }
    }
}
