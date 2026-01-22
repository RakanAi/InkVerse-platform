using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;

namespace InkVerse.Api.Controllers.GenraTagTrend
{
    [Route("api/genres")]
    [ApiController]
    public class GenresController : ControllerBase
    {
        private readonly InkVerseDB _inkVerseDB;

        public GenresController(InkVerseDB inkVerseDB)
        {
            _inkVerseDB = inkVerseDB;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllGenres()
        {
            var genres = await _inkVerseDB.Genres.ToListAsync();
            return Ok(genres);
        }
    }
}
