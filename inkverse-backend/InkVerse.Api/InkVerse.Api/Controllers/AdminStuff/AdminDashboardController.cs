using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/dashboard")]
    [Authorize(Roles = "Admin")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IAdminDashboardService _service;

        public AdminDashboardController(IAdminDashboardService service)
        {
            _service = service;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> Stats()
        {
            var dto = await _service.GetStatsAsync();
            return Ok(dto);
        }
    }
}
