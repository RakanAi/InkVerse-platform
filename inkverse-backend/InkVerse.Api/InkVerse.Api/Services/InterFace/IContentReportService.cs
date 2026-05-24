using InkVerse.Api.DTOs.Reports;

namespace InkVerse.Api.Services.InterFace;

public interface IContentReportService
{
    Task<ContentReportDto> CreateReportAsync(string reporterId, CreateContentReportDto dto);
    Task<List<AdminContentReportDto>> GetAdminReportsAsync(string? status, string? type);
    Task<AdminContentReportDto?> GetAdminReportAsync(int id);
    Task<AdminContentReportDto?> ResolveReportAsync(int id, string adminId, string? note);
    Task<AdminContentReportDto?> DismissReportAsync(int id, string adminId, string? note);
    Task<int> CountOpenReportsAsync();
}
