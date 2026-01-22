using Microsoft.AspNetCore.Mvc;
using InkVerse.Api.Services.InterFace;
using static InkVerse.Api.DTOs.TagTrenGen.TagDtos;

namespace InkVerse.Api.Controllers.GenraTagTrend
{
    [Route("api/tags")]
    [ApiController]
    public class TagsController : ControllerBase
    {
        private readonly ITagService _svc;

        public TagsController(ITagService svc)
        {
            _svc = svc;
        }

        // Public: return only ACTIVE tags
        [HttpGet]
        public async Task<ActionResult<List<TagDto>>> GetAll()
        {
            var tags = await _svc.GetAllAsync(includeInactive: false);
            return Ok(tags);
        }

        // Public: popular tags (ACTIVE only)
        [HttpGet("popular")]
        public async Task<ActionResult<List<TagDto>>> GetPopularAsync([FromQuery] int take = 80)
        {
            var tags = await _svc.GetPopularAsync(take);
            return Ok(tags);
        }
    }
}
