using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.DTOs.Uploads
{
    public class UploadImageDto
    {
        [Required]
        public IFormFile File { get; set; } = default!;

        public string? EntityId { get; set; }
        public string? EntityName { get; set; }
        public string? Purpose { get; set; }
    }
}
