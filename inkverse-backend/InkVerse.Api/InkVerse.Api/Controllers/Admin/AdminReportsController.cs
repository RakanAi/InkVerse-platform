using System.Security.Claims;
using InkVerse.Api.DTOs.Reports;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/reports")]
[Authorize(Roles = "Admin")]
public class AdminReportsController : ControllerBase
{
    private readonly IContentReportService _reports;

    public AdminReportsController(IContentReportService reports)
    {
        _reports = reports;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? status = null, [FromQuery] string? type = null)
    {
        try
        {
            return Ok(await _reports.GetAdminReportsAsync(status, type));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detail(int id)
    {
        var report = await _reports.GetAdminReportAsync(id);
        return report == null ? NotFound() : Ok(report);
    }

    [HttpPost("{id:int}/resolve")]
    public Task<IActionResult> Resolve(int id, [FromBody] ReportDecisionDto dto)
    {
        return Decide(id, dto, resolve: true);
    }

    [HttpPost("{id:int}/dismiss")]
    public Task<IActionResult> Dismiss(int id, [FromBody] ReportDecisionDto dto)
    {
        return Decide(id, dto, resolve: false);
    }

    private async Task<IActionResult> Decide(int id, ReportDecisionDto dto, bool resolve)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(adminId)) return Unauthorized();

        var report = resolve
            ? await _reports.ResolveReportAsync(id, adminId, dto.AdminNote)
            : await _reports.DismissReportAsync(id, adminId, dto.AdminNote);

        return report == null ? NotFound() : Ok(report);
    }
}
