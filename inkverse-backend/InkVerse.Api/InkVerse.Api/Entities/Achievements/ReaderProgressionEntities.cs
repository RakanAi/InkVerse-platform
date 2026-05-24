using InkVerse.Api.Entities.Base;
using InkVerse.Api.Entities.Identity;

namespace InkVerse.Api.Entities.Achievements;

public class ReaderProgress : CrudBase
{
    public required string UserId { get; set; }
    public AppUser? User { get; set; }
    public int Level { get; set; } = 1;
    public int TotalUniqueChaptersRead { get; set; }
    public int CurrentLevelProgress { get; set; }
    public int NextLevelRequirement { get; set; } = 100;
    public int DailyReadStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateTime? LastStreakLocalDate { get; set; }
    public string Timezone { get; set; } = "UTC";
}

public class ReaderChapterRead : CrudBase
{
    public required string UserId { get; set; }
    public AppUser? User { get; set; }
    public int ChapterId { get; set; }
    public int BookId { get; set; }
    public DateTime CountedAt { get; set; } = DateTime.UtcNow;
    public int ScrollPercent { get; set; }
    public int ActiveSeconds { get; set; }
}

public class ReaderReadSession : CrudBase
{
    public required string SessionId { get; set; }
    public required string UserId { get; set; }
    public int ChapterId { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public bool IsCompleted { get; set; }
    public string Timezone { get; set; } = "UTC";
}

public class AchievementDefinition : CrudBase
{
    public required string Key { get; set; }
    public required string Title { get; set; }
    public string Description { get; set; } = string.Empty;
    public required string Category { get; set; }
    public required string Tier { get; set; }
    public int Threshold { get; set; }
    public required string MetricType { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UserAchievement : CrudBase
{
    public required string UserId { get; set; }
    public AppUser? User { get; set; }
    public required string AchievementKey { get; set; }
    public required string Tier { get; set; }
    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;
    public int ProgressSnapshot { get; set; }
}
