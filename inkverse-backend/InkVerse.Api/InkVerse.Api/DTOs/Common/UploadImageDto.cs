using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.DTOs.Uploads
{
    public class UploadImageDto
    {
        [Required]
        public IFormFile File { get; set; } = default!;
    }
}