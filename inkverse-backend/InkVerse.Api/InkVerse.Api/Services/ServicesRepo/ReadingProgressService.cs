using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;
using InkVerse.Api.Entities;
using InkVerse.Api.Services.InterFace;

public class ReadingProgressService : IReadingProgressService
{
    private readonly InkVerseDB _db;

    public ReadingProgressService(InkVerseDB db)
    {
        _db = db;
    }

    public async Task<int?> GetLastReadChapterAsync(int bookId, string userId)
    {
        return await _db.ReadingProgress
            .Where(x => x.BookId == bookId && x.UserId == userId)
            .Select(x => (int?)x.ChapterId)
            .FirstOrDefaultAsync();
    }

    public async Task UpdateLastReadChapterAsync(int bookId, int chapterId, string userId)
    {
        // Optional safety check (prevents FK crash)
        var chapterOk = await _db.Chapters.AnyAsync(c => c.ID == chapterId);
        if (!chapterOk) throw new Exception($"Chapter {chapterId} not found");

        var progress = await _db.ReadingProgress
            .SingleOrDefaultAsync(x => x.BookId == bookId && x.UserId == userId);

        if (progress == null)
        {
            progress = new ReadingProgress
            {
                BookId = bookId,
                UserId = userId,
                ChapterId = chapterId,
                UpdatedAt = DateTime.UtcNow
            };
            _db.ReadingProgress.Add(progress);
        }
        else
        {
            progress.ChapterId = chapterId;
            progress.UpdatedAt = DateTime.UtcNow;
        }

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            Console.WriteLine("DbUpdateException: " + ex.Message);
            Console.WriteLine("Inner: " + ex.InnerException?.Message);
            throw;
        }
    }
}
