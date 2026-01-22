using InkVerse.Api.DTOs.Admin;

namespace InkVerse.Api.Services.InterFace
{
    public interface IAdminDashboardService
    {
        Task<AdminDashboardDto> GetStatsAsync();
    }
}
