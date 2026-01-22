using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.Chapter;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/books/{bookId:int}/arcs")]
    [Authorize(Roles = "Admin,Author")]
    public class AdminArcsController : ControllerBase
    {
        private readonly IArcService _arcService;

        public AdminArcsController(IArcService arcService)
        {
            _arcService = arcService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(int bookId)
        {
            var items = await _arcService.GetArcsAsync(bookId);
            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> Create(int bookId, [FromBody] ArcCreateDto dto)
        {
            try
            {
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var isAdmin = User.IsInRole("Admin");
                if (string.IsNullOrEmpty(userId)) return Unauthorized();

                var created = await _arcService.CreateArcAsync(bookId, dto, userId, isAdmin);
                return Ok(created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
