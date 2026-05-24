using System.Security.Claims;
using InkVerse.Api.DTOs.Monetization;
using InkVerse.Api.Services.InterFace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InkVerse.Api.Controllers.Admin;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/books/{bookId:int}/ai-services-approval")]
public class AdminAiServicesController : ControllerBase
{
    private readonly IAiStudioService _aiStudio;

    public AdminAiServicesController(IAiStudioService aiStudio)
    {
        _aiStudio = aiStudio;
    }

    [HttpGet]
    public async Task<IActionResult> GetApproval(int bookId)
    {
        return Ok(await _aiStudio.GetBookAiApprovalAsync(bookId));
    }

    [HttpPut]
    public async Task<IActionResult> UpdateApproval(int bookId, [FromBody] UpdateBookAiApprovalDto dto)
    {
        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        return Ok(await _aiStudio.UpdateBookAiApprovalAsync(bookId, adminId, dto));
    }
}
