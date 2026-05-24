namespace InkVerse.Api.DTOs.Moderation;

public class ModerationCaseDto
{
    public int Id { get; set; }
    public string TargetType { get; set; } = "";
    public string TargetId { get; set; } = "";
    public string? TargetOwnerId { get; set; }
    public string? TargetOwnerName { get; set; }
    public string Source { get; set; } = "";
    public int? SourceReportId { get; set; }
    public string Status { get; set; } = "";
    public string Severity { get; set; } = "";
    public string Category { get; set; } = "";
    public int ConfidenceScore { get; set; }
    public bool RequiresAdmin { get; set; }
    public bool IsAutoHandled { get; set; }
    public string Title { get; set; } = "";
    public string TargetPreview { get; set; } = "";
    public string TargetContext { get; set; } = "";
    public string? TargetUrl { get; set; }
    public string? AdminTargetUrl { get; set; }
    public string ClawbotSummary { get; set; } = "";
    public string SuggestedAction { get; set; } = "";
    public string AutoAction { get; set; } = "";
    public DateTime? AutoActionTakenAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedById { get; set; }
    public string? ResolvedByName { get; set; }
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<ModerationCaseMessageDto> Messages { get; set; } = [];
}

public class ModerationCaseMessageDto
{
    public int Id { get; set; }
    public int CaseId { get; set; }
    public string? SenderId { get; set; }
    public string? SenderName { get; set; }
    public string Audience { get; set; } = "";
    public string MessageType { get; set; } = "";
    public string Body { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class ModerationCaseDecisionDto
{
    public string Action { get; set; } = "";
    public string? AdminNote { get; set; }
    public string? MessageToReporter { get; set; }
    public string? MessageToTargetOwner { get; set; }
}

public class ModerationCaseMessageCreateDto
{
    public string Audience { get; set; } = "internal";
    public string Body { get; set; } = "";
}

public class ClawbotModerationRunRequestDto
{
    public int Take { get; set; } = 50;
}

public class ClawbotModerationRunResultDto
{
    public int Scanned { get; set; }
    public int CreatedCases { get; set; }
    public int AutoHandled { get; set; }
    public int RequiresAdmin { get; set; }
    public List<ModerationCaseDto> Cases { get; set; } = [];
}
