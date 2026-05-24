namespace InkVerse.Api.DTOs.Reports;

public class CreateContentReportDto
{
    public string TargetType { get; set; } = "";
    public string TargetId { get; set; } = "";
    public string Reason { get; set; } = "";
    public string? Details { get; set; }
}

public class ContentReportDto
{
    public int Id { get; set; }
    public string TargetType { get; set; } = "";
    public string TargetId { get; set; } = "";
    public string Reason { get; set; } = "";
    public string? Details { get; set; }
    public string Status { get; set; } = "";
    public string TargetTitle { get; set; } = "";
    public string TargetPreview { get; set; } = "";
    public string TargetContext { get; set; } = "";
    public string? TargetUrl { get; set; }
    public string? AdminTargetUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminContentReportDto : ContentReportDto
{
    public string ReporterId { get; set; } = "";
    public string ReporterName { get; set; } = "";
    public string? ReporterEmail { get; set; }
    public string? TargetOwnerId { get; set; }
    public string? TargetOwnerName { get; set; }
    public string? TargetOwnerEmail { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedById { get; set; }
    public string? ResolvedByName { get; set; }
    public string? AdminNote { get; set; }
}

public class ReportDecisionDto
{
    public string? AdminNote { get; set; }
}
