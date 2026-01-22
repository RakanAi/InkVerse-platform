using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InkVerse.Api.DTOs.Import;
using InkVerse.Api.Services.InterFace;

[ApiController]
[Route("api/books")]
public class ChapterImportController : ControllerBase
{
    private readonly IChapterImportService _import;

    public ChapterImportController(IChapterImportService import)
    {
        _import = import;
    }

    [Authorize]
    [HttpPost("{bookId:int}/chapters/import")]
    public async Task<IActionResult> ImportChapters(int bookId, [FromBody] ChaptersImportDto dto)
    {
        var result = await _import.ImportChaptersAsync(bookId, dto);
        return Ok(result);
    }
}
