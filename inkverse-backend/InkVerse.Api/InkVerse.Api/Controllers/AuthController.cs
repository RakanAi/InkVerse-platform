using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using InkVerse.Api.DTOs.User;
using InkVerse.Api.Services.InterFace;

namespace InkVerse.Api.Controllers
{
    [Route("api/account")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterAsync([FromBody] RegisterDto model)
        {
           
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                var result = await _authService.RegisterAsync(model);
                if (!result.Success)
                {
                    return BadRequest(new { Message = "Registration failed", Errors = result.Error });
                }
                return Ok(result.User);
            }
            

        

        [HttpPost("login")]
        public async Task<IActionResult> LoginAsync([FromBody] LoginDto loginDto)
        {
            
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }
                var result = await _authService.LoginAsync(loginDto);
                if (!result.Success)
                {
                    return Unauthorized(new { Message = "Login failed", Errors = result.Error });
                }
                return Ok(result.User);
            }


        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var result = await _authService.GetMeAsync(User);
            if (!result.Success) return Unauthorized();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            return Ok(new
            {
                id = userId,
                userName = result.User?.UserName,
                email = result.User?.Email,
                roles = result.User?.Roles ?? new List<string>()
            });
        }



    }

}
