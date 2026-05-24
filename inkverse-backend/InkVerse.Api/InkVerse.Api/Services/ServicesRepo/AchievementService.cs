using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Achievements;
using InkVerse.Api.Entities.Achievements;
using InkVerse.Api.Services.InterFace;
using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Services.ServicesRepo;

public class AchievementService : IAchievementService
{
    private const int RequiredScrollPercent = 60;
    private const int RequiredActiveSeconds = 30;
    private readonly InkVerseDB _db;
    private readonly IMonetizationService _monetization;

    public AchievementService(InkVerseDB db, IMonetizationService monetization)
    {
        _db = db;
        _monetization = monetization;
    }

    public async Task<ReaderProgressionDto> GetProgressionAsync(string userId, string? timezone = null)
    {
        await SeedAchievementDefinitionsAsync();
        var progress = await EnsureProgressAsync(userId, timezone);
        await _db.SaveChangesAsync();
        return await ToProgressionDtoAsync(progress);
    }

    public async Task<AchievementsPageDto> GetAchievementsAsync(string userId)
    {
        await SeedAchievementDefinitionsAsync();
        await RefreshAchievementsAsync(userId);

        var progress = await EnsureProgressAsync(userId, null);
        var metrics = await GetMetricsAsync(userId, progress);
        var unlocked = await _db.UserAchievements
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .ToDictionaryAsync(item => item.AchievementKey);

        var achievements = await _db.AchievementDefinitions
            .AsNoTracking()
            .Where(item => item.IsActive)
            .OrderBy(item => item.Category)
            .ThenBy(item => item.MetricType)
            .ThenBy(item => item.Threshold)
            .ToListAsync();

        return new AchievementsPageDto
        {
            Progress = await ToProgressionDtoAsync(progress),
            Achievements = achievements.Select(definition =>
            {
                var current = metrics.TryGetValue(definition.MetricType, out var value) ? value : 0;
                var isUnlocked = unlocked.TryGetValue(definition.Key, out var userAchievement);

                return new AchievementProgressDto
                {
                    Key = definition.Key,
                    Title = definition.Title,
                    Description = definition.Description,
                    Category = definition.Category,
                    Tier = definition.Tier,
                    Threshold = definition.Threshold,
                    MetricType = definition.MetricType,
                    IsUnlocked = isUnlocked,
                    UnlockedAt = userAchievement?.UnlockedAt,
                    ProgressSnapshot = userAchievement?.ProgressSnapshot ?? 0,
                    CurrentProgress = current,
                    ProgressPercent = definition.Threshold <= 0
                        ? 100
                        : Math.Clamp((int)Math.Floor(current * 100.0 / definition.Threshold), 0, 100),
                };
            }).ToList(),
        };
    }

    public async Task<ReadSessionStartDto> StartReadSessionAsync(int chapterId, string userId, string? timezone)
    {
        var chapter = await _db.Chapters
            .Include(item => item.Book)
            .FirstOrDefaultAsync(item => item.ID == chapterId);

        if (chapter == null)
        {
            throw new InvalidOperationException("Chapter not found.");
        }

        if (await IsChapterLockedForUserAsync(chapter, userId))
        {
            throw new InvalidOperationException("Unlock this chapter before reader progress can count.");
        }

        var session = new ReaderReadSession
        {
            SessionId = Guid.NewGuid().ToString("N"),
            UserId = userId,
            ChapterId = chapterId,
            StartedAt = DateTime.UtcNow,
            Timezone = NormalizeTimezone(timezone),
            CreatedAt = DateTime.UtcNow,
        };

        _db.ReaderReadSessions.Add(session);

        var progress = await EnsureProgressAsync(userId, timezone);
        progress.Timezone = session.Timezone;

        await _db.SaveChangesAsync();

        return new ReadSessionStartDto
        {
            SessionId = session.SessionId,
            StartedAt = session.StartedAt,
        };
    }

    public async Task<CompleteReadResultDto> CompleteChapterReadAsync(int chapterId, string userId, CompleteReadRequestDto dto)
    {
        await SeedAchievementDefinitionsAsync();

        var progress = await EnsureProgressAsync(userId, dto.Timezone);
        var previousLevel = progress.Level;

        if (await _db.ReaderChapterReads.AnyAsync(item => item.UserId == userId && item.ChapterId == chapterId))
        {
            await _db.SaveChangesAsync();
            return new CompleteReadResultDto
            {
                Counted = false,
                AlreadyCounted = true,
                PreviousLevel = previousLevel,
                LevelChanged = false,
                Progress = await ToProgressionDtoAsync(progress),
            };
        }

        if (string.IsNullOrWhiteSpace(dto.SessionId))
        {
            throw new InvalidOperationException("A read session is required.");
        }

        var session = await _db.ReaderReadSessions
            .FirstOrDefaultAsync(item =>
                item.SessionId == dto.SessionId &&
                item.UserId == userId &&
                item.ChapterId == chapterId);

        if (session == null)
        {
            throw new InvalidOperationException("Read session not found.");
        }

        if (session.IsCompleted)
        {
            throw new InvalidOperationException("This read session was already completed.");
        }

        var elapsed = DateTime.UtcNow - session.StartedAt;
        if (elapsed < TimeSpan.FromSeconds(RequiredActiveSeconds))
        {
            throw new InvalidOperationException("Keep reading a little longer before progress can count.");
        }

        var scrollPercent = Math.Clamp(dto.ScrollPercent, 0, 100);
        var activeSeconds = Math.Max(0, dto.ActiveSeconds);
        if (scrollPercent < RequiredScrollPercent || activeSeconds < RequiredActiveSeconds)
        {
            throw new InvalidOperationException("Reader progress requires 60% scroll and 30 seconds of active reading.");
        }

        var chapter = await _db.Chapters
            .Include(item => item.Book)
            .FirstOrDefaultAsync(item => item.ID == chapterId);

        if (chapter == null)
        {
            throw new InvalidOperationException("Chapter not found.");
        }

        if (!string.IsNullOrWhiteSpace(chapter.Book?.AuthorId) &&
            string.Equals(chapter.Book.AuthorId, userId, StringComparison.Ordinal))
        {
            session.IsCompleted = true;
            session.CompletedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return new CompleteReadResultDto
            {
                Counted = false,
                AlreadyCounted = false,
                PreviousLevel = previousLevel,
                LevelChanged = false,
                Progress = await ToProgressionDtoAsync(progress),
            };
        }

        if (await IsChapterLockedForUserAsync(chapter, userId))
        {
            throw new InvalidOperationException("Unlock this chapter before reader progress can count.");
        }

        _db.ReaderChapterReads.Add(new ReaderChapterRead
        {
            UserId = userId,
            ChapterId = chapterId,
            BookId = chapter.BookId,
            CountedAt = DateTime.UtcNow,
            ScrollPercent = scrollPercent,
            ActiveSeconds = activeSeconds,
            CreatedAt = DateTime.UtcNow,
        });

        session.IsCompleted = true;
        session.CompletedAt = DateTime.UtcNow;

        var timezone = NormalizeTimezone(dto.Timezone ?? session.Timezone);
        progress.Timezone = timezone;
        progress.TotalUniqueChaptersRead += 1;
        ApplyLevel(progress);
        ApplyDailyStreak(progress, timezone);

        await _db.SaveChangesAsync();
        var unlocked = await RefreshAchievementsAsync(userId);

        progress = await EnsureProgressAsync(userId, null);

        return new CompleteReadResultDto
        {
            Counted = true,
            AlreadyCounted = false,
            PreviousLevel = previousLevel,
            LevelChanged = progress.Level > previousLevel,
            Progress = await ToProgressionDtoAsync(progress),
            UnlockedAchievements = unlocked,
        };
    }

    public async Task<IReadOnlyList<AchievementBadgeDto>> RefreshAchievementsAsync(string userId)
    {
        await SeedAchievementDefinitionsAsync();
        var progress = await EnsureProgressAsync(userId, null);
        var metrics = await GetMetricsAsync(userId, progress);
        var existingKeys = await _db.UserAchievements
            .Where(item => item.UserId == userId)
            .Select(item => item.AchievementKey)
            .ToListAsync();

        var existing = existingKeys.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var definitions = await _db.AchievementDefinitions
            .Where(item => item.IsActive)
            .OrderBy(item => item.Threshold)
            .ToListAsync();

        var newlyUnlocked = new List<AchievementBadgeDto>();

        foreach (var definition in definitions)
        {
            var current = metrics.TryGetValue(definition.MetricType, out var value) ? value : 0;
            if (current < definition.Threshold || existing.Contains(definition.Key))
            {
                continue;
            }

            var userAchievement = new UserAchievement
            {
                UserId = userId,
                AchievementKey = definition.Key,
                Tier = definition.Tier,
                ProgressSnapshot = current,
                UnlockedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
            };

            _db.UserAchievements.Add(userAchievement);
            existing.Add(definition.Key);
            newlyUnlocked.Add(ToBadgeDto(definition, userAchievement));
        }

        if (newlyUnlocked.Count > 0 || _db.ChangeTracker.HasChanges())
        {
            await _db.SaveChangesAsync();
        }

        return newlyUnlocked;
    }

    private async Task<ReaderProgress> EnsureProgressAsync(string userId, string? timezone)
    {
        var progress = await _db.ReaderProgresses.FirstOrDefaultAsync(item => item.UserId == userId);
        if (progress == null)
        {
            progress = new ReaderProgress
            {
                UserId = userId,
                Timezone = NormalizeTimezone(timezone),
                CreatedAt = DateTime.UtcNow,
            };
            ApplyLevel(progress);
            _db.ReaderProgresses.Add(progress);
            return progress;
        }

        if (!string.IsNullOrWhiteSpace(timezone))
        {
            progress.Timezone = NormalizeTimezone(timezone);
        }

        ApplyLevel(progress);
        return progress;
    }

    private async Task<bool> IsChapterLockedForUserAsync(Chapter chapter, string userId)
    {
        var monetization = await _db.ChapterMonetizations
            .FirstOrDefaultAsync(item => item.ChapterId == chapter.ID);

        if (monetization?.IsPaid != true)
        {
            return false;
        }

        if (!await _monetization.CanChargeChapterAsync(chapter.ID, chapter.BookId, chapter.Book?.AuthorId))
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(chapter.Book?.AuthorId) &&
            string.Equals(chapter.Book.AuthorId, userId, StringComparison.Ordinal))
        {
            return false;
        }

        return !await _db.ChapterUnlocks.AnyAsync(item =>
            item.UserId == userId &&
            item.ChapterId == chapter.ID);
    }

    private static void ApplyLevel(ReaderProgress progress)
    {
        var remaining = Math.Max(0, progress.TotalUniqueChaptersRead);
        var level = 1;

        while (remaining >= RequirementForNextLevel(level))
        {
            remaining -= RequirementForNextLevel(level);
            level += 1;
        }

        progress.Level = level;
        progress.CurrentLevelProgress = remaining;
        progress.NextLevelRequirement = RequirementForNextLevel(level);
    }

    private static int RequirementForNextLevel(int currentLevel)
    {
        if (currentLevel < 10) return 100;
        if (currentLevel < 25) return 200;
        return 500;
    }

    private static void ApplyDailyStreak(ReaderProgress progress, string timezone)
    {
        var today = GetLocalDate(DateTime.UtcNow, timezone);
        var lastDate = progress.LastStreakLocalDate?.Date;

        if (lastDate == today)
        {
            return;
        }

        if (lastDate == today.AddDays(-1))
        {
            progress.DailyReadStreak += 1;
        }
        else
        {
            progress.DailyReadStreak = 1;
        }

        progress.LongestStreak = Math.Max(progress.LongestStreak, progress.DailyReadStreak);
        progress.LastStreakLocalDate = today;
    }

    private async Task<Dictionary<string, int>> GetMetricsAsync(string userId, ReaderProgress progress)
    {
        var readBookGroups = await _db.ReaderChapterReads
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .GroupBy(item => item.BookId)
            .Select(group => new { BookId = group.Key, ReadCount = group.Count() })
            .ToListAsync();

        var readBookIds = readBookGroups.Select(item => item.BookId).ToList();
        var chapterCounts = readBookIds.Count == 0
            ? new Dictionary<int, int>()
            : await _db.Chapters
                .AsNoTracking()
                .Where(item => readBookIds.Contains(item.BookId))
                .GroupBy(item => item.BookId)
                .Select(group => new { BookId = group.Key, Count = group.Count() })
                .ToDictionaryAsync(item => item.BookId, item => item.Count);

        var completedBooks = readBookGroups.Count(item =>
            chapterCounts.TryGetValue(item.BookId, out var count) &&
            count > 0 &&
            item.ReadCount >= count);

        return new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["chapters_read"] = progress.TotalUniqueChaptersRead,
            ["books_started"] = readBookGroups.Count,
            ["books_completed"] = completedBooks,
            ["daily_read_streak"] = progress.DailyReadStreak,
            ["comments_posted"] = await _db.ChapterComments
                .AsNoTracking()
                .CountAsync(item => item.UserId == userId && !item.IsDeleted),
            ["reviews_posted"] = await _db.Reviews
                .AsNoTracking()
                .CountAsync(item => item.UserId == userId && !item.IsDeleted),
            ["library_saves"] = await _db.UserLibraries
                .AsNoTracking()
                .CountAsync(item => item.UserId == userId && item.IsInLibrary),
        };
    }

    private async Task<ReaderProgressionDto> ToProgressionDtoAsync(ReaderProgress progress)
    {
        return new ReaderProgressionDto
        {
            Level = progress.Level,
            TotalUniqueChaptersRead = progress.TotalUniqueChaptersRead,
            CurrentLevelProgress = progress.CurrentLevelProgress,
            NextLevelRequirement = progress.NextLevelRequirement,
            DailyReadStreak = progress.DailyReadStreak,
            LongestStreak = progress.LongestStreak,
            LastStreakLocalDate = progress.LastStreakLocalDate,
            Timezone = progress.Timezone,
            FeaturedAchievements = await GetFeaturedAchievementsAsync(progress.UserId),
        };
    }

    private async Task<IReadOnlyList<AchievementBadgeDto>> GetFeaturedAchievementsAsync(string userId)
    {
        var unlocked = await _db.UserAchievements
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.UnlockedAt)
            .ToListAsync();

        if (unlocked.Count == 0)
        {
            return [];
        }

        var keys = unlocked.Select(item => item.AchievementKey).ToList();
        var definitions = await _db.AchievementDefinitions
            .AsNoTracking()
            .Where(item => keys.Contains(item.Key))
            .ToDictionaryAsync(item => item.Key);

        return unlocked
            .Where(item => definitions.ContainsKey(item.AchievementKey))
            .OrderByDescending(item => TierRank(item.Tier))
            .ThenByDescending(item => item.UnlockedAt)
            .Take(4)
            .Select(item => ToBadgeDto(definitions[item.AchievementKey], item))
            .ToList();
    }

    private static AchievementBadgeDto ToBadgeDto(AchievementDefinition definition, UserAchievement achievement)
    {
        return new AchievementBadgeDto
        {
            Key = definition.Key,
            Title = definition.Title,
            Description = definition.Description,
            Category = definition.Category,
            Tier = definition.Tier,
            Threshold = definition.Threshold,
            MetricType = definition.MetricType,
            UnlockedAt = achievement.UnlockedAt,
            ProgressSnapshot = achievement.ProgressSnapshot,
        };
    }

    private async Task SeedAchievementDefinitionsAsync()
    {
        if (await _db.AchievementDefinitions.AnyAsync())
        {
            return;
        }

        var now = DateTime.UtcNow;
        _db.AchievementDefinitions.AddRange(BuildSeedDefinitions().Select(item => new AchievementDefinition
        {
            Key = item.Key,
            Title = item.Title,
            Description = item.Description,
            Category = item.Category,
            Tier = item.Tier,
            Threshold = item.Threshold,
            MetricType = item.MetricType,
            IsActive = true,
            CreatedAt = now,
        }));

        await _db.SaveChangesAsync();
    }

    private static IEnumerable<AchievementSeed> BuildSeedDefinitions()
    {
        var tiers = new[] { "Bronze", "Silver", "Gold", "Diamond" };
        foreach (var item in BuildTiered("chapters_read", "Reading", "Chapter Trail", "Unique chapters read", [10, 50, 200, 1000], tiers))
            yield return item;
        foreach (var item in BuildTiered("books_started", "Reading", "First Pages", "Books started by counting a chapter read", [1, 5, 25, 100], tiers))
            yield return item;
        foreach (var item in BuildTiered("books_completed", "Reading", "Last Page", "Books completed with all current chapters counted", [1, 3, 10, 50], tiers))
            yield return item;
        foreach (var item in BuildTiered("daily_read_streak", "Reading", "Daily Flame", "Consecutive local days with a counted chapter", [3, 7, 30, 100], tiers))
            yield return item;
        foreach (var item in BuildTiered("comments_posted", "Social", "Conversation Starter", "Chapter comments and replies posted", [5, 25, 100, 500], tiers))
            yield return item;
        foreach (var item in BuildTiered("reviews_posted", "Social", "Reviewer", "Book reviews posted", [1, 5, 25, 100], tiers))
            yield return item;
        foreach (var item in BuildTiered("library_saves", "Social", "Shelf Builder", "Books saved to library", [5, 25, 100, 300], tiers))
            yield return item;
    }

    private static IEnumerable<AchievementSeed> BuildTiered(
        string metricType,
        string category,
        string title,
        string description,
        IReadOnlyList<int> thresholds,
        IReadOnlyList<string> tiers)
    {
        for (var index = 0; index < thresholds.Count && index < tiers.Count; index += 1)
        {
            var tier = tiers[index];
            yield return new AchievementSeed(
                $"{metricType}.{tier.ToLowerInvariant()}",
                $"{title}: {tier}",
                $"{description}: {thresholds[index]:N0}.",
                category,
                tier,
                thresholds[index],
                metricType);
        }
    }

    private static int TierRank(string tier)
    {
        return tier.ToLowerInvariant() switch
        {
            "diamond" => 4,
            "gold" => 3,
            "silver" => 2,
            "bronze" => 1,
            _ => 0,
        };
    }

    private static string NormalizeTimezone(string? timezone)
    {
        return string.IsNullOrWhiteSpace(timezone) ? "UTC" : timezone.Trim()[..Math.Min(timezone.Trim().Length, 80)];
    }

    private static DateTime GetLocalDate(DateTime utcNow, string timezone)
    {
        try
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById(timezone);
            return TimeZoneInfo.ConvertTimeFromUtc(utcNow, zone).Date;
        }
        catch
        {
            return utcNow.Date;
        }
    }

    private sealed record AchievementSeed(
        string Key,
        string Title,
        string Description,
        string Category,
        string Tier,
        int Threshold,
        string MetricType);
}
