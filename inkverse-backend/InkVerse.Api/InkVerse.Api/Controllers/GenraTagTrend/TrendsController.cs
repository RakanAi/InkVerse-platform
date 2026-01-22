using Microsoft.AspNetCore.Mvc;
using InkVerse.Api.DTOs.Trends;
using InkVerse.Api.Services.Trends;

namespace InkVerse.Api.Controllers.Public
{
    [ApiController]
    [Route("api/trends")]
    public class TrendsController : ControllerBase
    {
        private readonly ITrendService _svc;

        public TrendsController(ITrendService svc)
        {
            _svc = svc;
        }

        [HttpGet]
        public async Task<ActionResult<List<TrendDto>>> GetActive()
        {
            // public should only see active trends
            var trends = await _svc.GetAllAsync(includeInactive: false);
            return Ok(trends);
        }

        [HttpGet("{trendId:int}/books")]
        public async Task<IActionResult> GetTrendBooks(int trendId, [FromQuery] int take = 20)
        {
            var books = await _svc.GetTrendBooksAsync(trendId, take);

            // if trend doesn't exist, return 404 (better)
            if (books.Count == 0)
                return NotFound("Trend not found or no books linked.");

            return Ok(books);
        }
    }
}
