using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.Book;
using InkVerse.Api.Entities.Enums;
using InkVerse.Api.Helpers;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly IBookServices _bookService;

        public BooksController(IBookServices bookService)
        {
            _bookService = bookService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] QueryObject query)
        {
            var books = await _bookService.GetAllBooksAsync(query);
            foreach (var b in books)
                b.CoverImageUrl = Abs(b.CoverImageUrl);

            return Ok(books);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var book = await _bookService.GetBookByIdAsync(id);
            if (book == null) return NotFound();

            book.CoverImageUrl = Abs(book.CoverImageUrl);
            return Ok(book);
        }

        [Authorize(Roles = "Admin,Author")]
        [HttpPost]
        public async Task<IActionResult> CreateBook([FromBody] BookCreateDto dto)
        {
            // Try common claim types (works across setups)
            var userId =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst("sub")?.Value;


            if (string.IsNullOrEmpty(userId))
                return Unauthorized("No user id found in token.");

            var created = await _bookService.CreateBookAsync(dto, userId);

            return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
        }

        [Authorize]
        [HttpGet("claims")]
        public IActionResult Claims()
        {
            return Ok(User.Claims.Select(c => new { c.Type, c.Value }));
        }


        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Author")]
        public async Task<IActionResult> Update(int id, [FromBody] BookUpdateDto dto)
        {
            var userId =
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                User.FindFirst("sub")?.Value;

            var isAdmin = User.IsInRole("Admin");

            var result = await _bookService.UpdateBookAsync(id, dto, userId!, isAdmin);
            if (result == null) return NotFound();

            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles ="Admin")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var success = await _bookService.DeleteBookAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpGet("top-by-verse")]
        public async Task<IActionResult> TopByVerse([FromQuery] string verseType = "Original", [FromQuery] int take = 5)
        {
            if (!Enum.TryParse<VerseType>(verseType, true, out var vt))
                vt = VerseType.Original;

            var list = await _bookService.GetTopBooksByVerseTypeAsync(vt, take);
            return Ok(list);
        }
        [HttpGet("browse")]
        public async Task<IActionResult> Browse([FromQuery] BookBrowseQuery query)
        {
            var result = await _bookService.BrowseBooksAsync(query);
            return Ok(result);
        }
        private string? Abs(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return url;
            if (url.StartsWith("http://") || url.StartsWith("https://")) return url;

            var path = url.StartsWith("/") ? url : "/" + url;
            return $"{Request.Scheme}://{Request.Host}{path}";
        }

    }



}
