namespace InkVerse.Api.DTOs.Achievements;

public class AchievementBadgeDto
{
    public string Key { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Tier { get; set; } = string.Empty;
    public int Threshold { get; set; }
    public string MetricType { get; set; } = string.Empty;
    public DateTime? UnlockedAt { get; set; }
    public int ProgressSnapshot { get; set; }
}

public class ReaderProgressionDto
{
    public int Level { get; set; } = 1;
    public int TotalUniqueChaptersRead { get; set; }
    public int CurrentLevelProgress { get; set; }
    public int NextLevelRequirement { get; set; } = 100;
    public int DailyReadStreak { get; set; }
    public int LongestStreak { get; set; }
    public DateTime? LastStreakLocalDate { get; set; }
    public string Timezone { get; set; } = "UTC";
    public IReadOnlyList<AchievementBadgeDto> FeaturedAchievements { get; set; } = [];
}

public class AchievementProgressDto : AchievementBadgeDto
{
    public bool IsUnlocked { get; set; }
    public int CurrentProgress { get; set; }
    public int ProgressPercent { get; set; }
}

public class AchievementsPageDto
{
    public ReaderProgressionDto Progress { get; set; } = new();
    public IReadOnlyList<AchievementProgressDto> Achievements { get; set; } = [];
}

public class ReadSessionStartRequestDto
{
    public string? Timezone { get; set; }
}

public class ReadSessionStartDto
{
    public string SessionId { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
}

public class CompleteReadRequestDto
{
    public string? SessionId { get; set; }
    public int ScrollPercent { get; set; }
    public int ActiveSeconds { get; set; }
    public string? Timezone { get; set; }
}

public class CompleteReadResultDto
{
    public bool Counted { get; set; }
    public bool AlreadyCounted { get; set; }
    public bool LevelChanged { get; set; }
    public int PreviousLevel { get; set; } = 1;
    public ReaderProgressionDto Progress { get; set; } = new();
    public IReadOnlyList<AchievementBadgeDto> UnlockedAchievements { get; set; } = [];
}
