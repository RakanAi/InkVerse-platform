using System.Security.Claims;

namespace InkVerse.Api.Extensions
{
    public static class ClaimsExtensions
    {
        public static string? GetUserId(this ClaimsPrincipal user)
        {
            return user?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
        public static string? GetUserName(this ClaimsPrincipal user)
        {
            return user?.FindFirst(ClaimTypes.Name)?.Value;
        }
        public static string? GetEmail(this ClaimsPrincipal user)
        {
            return user?.FindFirst(ClaimTypes.Email)?.Value;
        }
        public static bool IsAuthenticated(this ClaimsPrincipal user)
        {
            return user?.Identity?.IsAuthenticated ?? false;
        }
    }
}
