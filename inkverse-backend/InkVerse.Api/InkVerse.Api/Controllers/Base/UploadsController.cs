using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InkVerse.Api.DTOs.Uploads;

namespace InkVerse.Api.Controllers
{
    [ApiController]
    [Route("api/uploads")]
    public class UploadsController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadsController(IWebHostEnvironment env)
        {
            _env = env;
        }

        private static readonly HashSet<string> AllowedExt = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp"
        };

        // Adjust limits per your needs
        private const long MaxBytes = 5 * 1024 * 1024; // 5 MB

        private async Task<string> SaveImage(IFormFile file, string folder)
        {
            if (file == null || file.Length == 0)
                throw new InvalidOperationException("No file uploaded.");

            if (file.Length > MaxBytes)
                throw new InvalidOperationException("File too large (max 5MB).");

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedExt.Contains(ext))
                throw new InvalidOperationException("Only .jpg, .jpeg, .png, .webp are allowed.");

            // Ensure wwwroot exists
            var webRoot = _env.WebRootPath;
            if (string.IsNullOrWhiteSpace(webRoot))
                webRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

            var uploadsRoot = Path.Combine(webRoot, "uploads", folder);
            Directory.CreateDirectory(uploadsRoot);

            var fileName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
            var fullPath = Path.Combine(uploadsRoot, fileName);

            await using var stream = System.IO.File.Create(fullPath);
            await file.CopyToAsync(stream);

            // URL that frontend will use + you store in DB
            return $"/uploads/{folder}/{fileName}";
        }

        // =========================
        // 1) Admin Trend image upload
        // =========================
        [HttpPost("trends")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadTrendImage([FromForm] UploadImageDto dto)
        {
            try
            {
                var url = await SaveImage(dto.File, "trends");
                return Ok(new { url });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // =================================
        // 2) Admin Book cover upload (Admin)
        // =================================
        [HttpPost("books/admin")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadBookCover_Admin([FromForm] UploadImageDto dto)
        {
            try
            {
                var url = await SaveImage(dto.File, "books");
                return Ok(new { url = Abs(url) });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ==========================================
        // 3) User Book cover upload (future Authors)
        // ==========================================
        [HttpPost("books/user")]
        [Authorize] // later: [Authorize(Roles="Author")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(MaxBytes)]
        public async Task<IActionResult> UploadBookCover_User([FromForm] UploadImageDto dto)
        {
            try
            {
                var url = await SaveImage(dto.File, "books/user"); // or "books" if you prefer
                return Ok(new { url });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ==========================================
        // 4) User Account upload (avatar / profile)
        // ==========================================
        [HttpPost("users/avatar")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadUserAvatar([FromForm] UploadImageDto dto)
        {
            try
            {
                var url = await SaveImage(dto.File, "users/avatars");
                return Ok(new { url });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Optional: banner/cover image for profile
        [HttpPost("users/banner")]
        [Authorize]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(MaxBytes)]
        public async Task<IActionResult> UploadUserBanner([FromForm] UploadImageDto dto)
        {
            try
            {
                var url = await SaveImage(dto.File, "users/banners");
                return Ok(new { url });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
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
