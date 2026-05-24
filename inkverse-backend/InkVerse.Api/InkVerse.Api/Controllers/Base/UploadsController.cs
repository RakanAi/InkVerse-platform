using InkVerse.Api.DTOs.Uploads;
using InkVerse.Api.Services.InterFace;
using InkVerse.Api.Services.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace InkVerse.Api.Controllers
{
    [ApiController]
    [Route("api/uploads")]
    public class UploadsController : ControllerBase
    {
        private readonly IFileStorageService _fileStorage;

        public UploadsController(IFileStorageService fileStorage)
        {
            _fileStorage = fileStorage;
        }

        private static readonly HashSet<string> AllowedExt = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".webp"
        };

        // Adjust limits per your needs
        private const long MaxBytes = 5 * 1024 * 1024; // 5 MB

        private async Task<string> SaveImage(
            IFormFile file,
            string folder,
            CancellationToken cancellationToken = default)
        {
            ValidateImage(file);

            var stored = await _fileStorage.SaveAsync(file, folder, cancellationToken);
            return stored.Url;
        }

        private void ValidateImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new InvalidOperationException("No file uploaded.");

            if (file.Length > MaxBytes)
                throw new InvalidOperationException("File too large (max 5MB).");

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !AllowedExt.Contains(ext))
                throw new InvalidOperationException("Only .jpg, .jpeg, .png, .webp are allowed.");
        }

        private static string BuildBookCoverFolder(UploadImageDto dto)
        {
            var rawName = dto.EntityName;
            if (string.IsNullOrWhiteSpace(rawName))
            {
                rawName = Path.GetFileNameWithoutExtension(dto.File.FileName)
                    .Replace("-cover", "", StringComparison.OrdinalIgnoreCase);
            }

            var bookSegment = StoragePath.BuildFolderSegment(rawName ?? "", "book");
            if (!string.IsNullOrWhiteSpace(dto.EntityId))
            {
                var idSegment = StoragePath.BuildFolderSegment(dto.EntityId, "book");
                bookSegment = $"book-{idSegment}-{bookSegment}";
            }

            return $"books/{bookSegment}/cover";
        }

        private static string BuildNamedAssetFolder(
            UploadImageDto dto,
            string rootFolder,
            string defaultEntity,
            string defaultPurpose)
        {
            var entitySegment = StoragePath.BuildFolderSegment(
                dto.EntityName ?? Path.GetFileNameWithoutExtension(dto.File.FileName),
                defaultEntity);

            var purposeSegment = StoragePath.BuildFolderSegment(dto.Purpose ?? defaultPurpose, defaultPurpose);

            return $"{rootFolder}/{entitySegment}/{purposeSegment}";
        }

        private string BuildUserAssetFolder(UploadImageDto dto, string defaultPurpose)
        {
            var rawName = dto.EntityName;
            if (string.IsNullOrWhiteSpace(rawName))
            {
                rawName = User.FindFirstValue(ClaimTypes.Name)
                    ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? "user";
            }

            var userSegment = StoragePath.BuildFolderSegment(rawName, "user");
            var purposeSegment = StoragePath.BuildFolderSegment(dto.Purpose ?? defaultPurpose, defaultPurpose);

            return $"users/{userSegment}/{purposeSegment}";
        }

        // =========================
        // 1) Admin Trend image upload
        // =========================
        [HttpPost("trends")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadTrendImage(
            [FromForm] UploadImageDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var url = await SaveImage(
                    dto.File,
                    BuildNamedAssetFolder(dto, "trends", "trend", "image"),
                    cancellationToken);
                return Ok(new { url });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("characters")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadCharacterImage(
            [FromForm] UploadImageDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var url = await SaveImage(
                    dto.File,
                    BuildNamedAssetFolder(dto, "characters", "character", "portrait"),
                    cancellationToken);
                return Ok(new { url });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("site-visuals")]
        [Authorize(Roles = "Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadSiteVisualImage(
            [FromForm] UploadImageDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var url = await SaveImage(
                    dto.File,
                    BuildNamedAssetFolder(dto, "site-visuals", "site-visual", "image"),
                    cancellationToken);
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
        public async Task<IActionResult> UploadBookCover_Admin(
            [FromForm] UploadImageDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var url = await SaveImage(dto.File, BuildBookCoverFolder(dto), cancellationToken);
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
        public async Task<IActionResult> UploadBookCover_User(
            [FromForm] UploadImageDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var url = await SaveImage(dto.File, BuildBookCoverFolder(dto), cancellationToken);
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
        public async Task<IActionResult> UploadUserAvatar(
            [FromForm] UploadImageDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var url = await SaveImage(dto.File, BuildUserAssetFolder(dto, "avatar"), cancellationToken);
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
        public async Task<IActionResult> UploadUserBanner(
            [FromForm] UploadImageDto dto,
            CancellationToken cancellationToken)
        {
            try
            {
                var url = await SaveImage(dto.File, BuildUserAssetFolder(dto, "banner"), cancellationToken);
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
