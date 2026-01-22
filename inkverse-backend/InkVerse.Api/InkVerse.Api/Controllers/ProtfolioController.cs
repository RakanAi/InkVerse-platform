/*using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Extensions;
using InkVerse.Api.Services.InterFace;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class PortfolioController : ControllerBase
{
    private readonly IPortfolioService _portfolioService;
    private readonly UserManager<AppUser> _userManager;
    private readonly IBookServices _bookServices;

    public PortfolioController(UserManager<AppUser> userManger ,IPortfolioService portfolioService, IBookServices bookServices )
    {
        _portfolioService = portfolioService;
        _userManager = userManger;
        _bookServices = bookServices;
    }

    [HttpGet("MyPortfolio")]
    public async Task<IActionResult> GetMyPortfolio()
    {
        var userId = User.GetUserId(); // Use your ClaimsExtensions
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("Invalid token or user ID");

        // Optionally, you can also check if the user exists
        var user = await _userManager.FindByIdAsync(userId);

        var portfolio = await _portfolioService.GetPortfolioByUserIdAsync(userId);

        return Ok(portfolio);
    }
}
*/