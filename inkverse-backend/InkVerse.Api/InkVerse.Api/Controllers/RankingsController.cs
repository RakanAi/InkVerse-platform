using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Book;

[Route("api/rankings")]
[ApiController]
public class RankingsController : ControllerBase
{
    private readonly InkVerseDB _db;

    public RankingsController(InkVerseDB db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetRankings()
    {
        var now = DateTime.UtcNow;
        var weekAgo = now.AddDays(-7);
        var monthAgo = now.AddMonths(-1);

        var weeklyReads = await _db.Books
            .Where(b => b.CreatedAt >= weekAgo) // Optional: filter if reads tracked per time
            .OrderByDescending(b => b.ReadCount) // or custom logic
            .Take(10)
            .Select(b => new RankedBookDTO
            {
                Id = b.ID,
                Title = b.Title,
                Image = b.CoverImageUrl,
                Rating = b.Rating,
                ReadCount = b.ReadCount
            }).ToListAsync();

        var monthlyReads = await _db.Books
            .Where(b => b.CreatedAt >= monthAgo)
            .OrderByDescending(b => b.ReadCount)
            .Take(10)
            .Select(b => new RankedBookDTO
            {
                Id = b.ID,
                Title = b.Title,
                Image = b.CoverImageUrl,
                Rating = b.Rating,
                ReadCount = b.ReadCount
            }).ToListAsync();

        var weeklyRatings = await _db.Books
            .Where(b => b.CreatedAt >= weekAgo)
            .OrderByDescending(b => b.Rating)
            .Take(10)
            .Select(b => new RankedBookDTO
            {
                Id = b.ID,
                Title = b.Title,
                Image = b.CoverImageUrl,
                Rating = b.Rating,
                ReadCount = b.ReadCount
            }).ToListAsync();

        var monthlyRatings = await _db.Books
            .Where(b => b.CreatedAt >= monthAgo)
            .OrderByDescending(b => b.Rating)
            .Take(10)
            .Select(b => new RankedBookDTO
            {
                Id = b.ID,
                Title = b.Title,
                Image = b.CoverImageUrl,
                Rating = b.Rating,
                ReadCount = b.ReadCount
            }).ToListAsync();

        return Ok(new
        {
            weeklyReadRanking = weeklyReads,
            monthlyReadRanking = monthlyReads,
            weeklyRatingRanking = weeklyRatings,
            monthlyRatingRanking = monthlyRatings
        });
    }
}
