using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using InkVerse.Api.DTOs.Admin;
using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;

        public AdminUsersController(UserManager<AppUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userManager.Users
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            var result = new List<AdminUserDto>(users.Count);
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                result.Add(new AdminUserDto
                {
                    Id = user.Id,
                    UserName = user.UserName ?? "",
                    Email = user.Email ?? "",
                    CreatedAt = user.CreatedAt,
                    IsCommentBanned = user.IsCommentBanned,
                    IsBlocked = user.IsBlocked,
                    Roles = roles.ToList(),
                });
            }

            return Ok(result);
        }

        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateModeration(string userId, [FromBody] UpdateUserModerationDto dto)
        {
            var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrWhiteSpace(currentAdminId) && currentAdminId == userId)
            {
                return BadRequest("You cannot moderate your own account.");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) return NotFound();

            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains("Admin"))
            {
                return BadRequest("Admin accounts cannot be blocked from this panel.");
            }

            user.IsCommentBanned = dto.IsCommentBanned;
            user.IsBlocked = dto.IsBlocked;

            var update = await _userManager.UpdateAsync(user);
            if (!update.Succeeded) return BadRequest(update.Errors);

            return Ok(new AdminUserDto
            {
                Id = user.Id,
                UserName = user.UserName ?? "",
                Email = user.Email ?? "",
                CreatedAt = user.CreatedAt,
                IsCommentBanned = user.IsCommentBanned,
                IsBlocked = user.IsBlocked,
                Roles = roles.ToList(),
            });
        }
    }
}
