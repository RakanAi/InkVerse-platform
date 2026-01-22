using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/maintenance")]
    [Authorize(Roles = "Admin")]
    public class AdminMaintenanceController : ControllerBase
    {
        private readonly IBookServices _bookService;

        public AdminMaintenanceController(IBookServices bookService)
        {
            _bookService = bookService;
        }

        [HttpPost("recalc-book-wordcounts")]
        public async Task<IActionResult> RecalcAll()
        {
            await _bookService.RecalcAllBookWordCountsAsync();
            return Ok(new { message = "Recalculated all book word counts." });
        }
    }
}
