using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace InkVerse.Api.Entities.Identity
{
    public class RefreshToken
    { 
        [Key]
        public int Id { get; set; } 
        public string Token { get; set; } = string.Empty; 
        public DateTime CreatedOn { get; set; } 
        public DateTime ExpiresOn { get; set; } 
        public DateTime? RevokedOn { get; set; } 
        public bool IsActive => RevokedOn == null && !IsExpired; 
        public bool IsExpired => DateTime.UtcNow >= ExpiresOn; 
        
        // Foreign key relationship
        public string? ApplicationUserId { get; set; } 
        public AppUser? ApplicationUser { get; set; } 
    } 
}