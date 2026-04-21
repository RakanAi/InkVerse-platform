using Microsoft.EntityFrameworkCore;
using InkVerse.Api.Data;

namespace InkVerse.Api.Middleware
{
    public class AiApiKeyMiddleware
    {
        private readonly RequestDelegate _next;

        public AiApiKeyMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, InkVerseDB db)
        {
            var path = context.Request.Path.Value?.ToLower();

            var isAiEndpoint =
                path == "/api/reviews/for-ai" ||
                (path != null && path.StartsWith("/api/reviews/") && path.EndsWith("/analysis"));

            if (!isAiEndpoint)
            {
                await _next(context);
                return;
            }

            if (!context.Request.Headers.TryGetValue("x-api-key", out var apiKeyValue))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new { message = "API key missing." });
                return;
            }

            var apiKey = apiKeyValue.ToString();

            var isValid = await db.ApiKeys
                .AnyAsync(x => !x.IsDeleted && x.Key == apiKey);

            if (!isValid)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsJsonAsync(new { message = "Invalid API key." });
                return;
            }

            await _next(context);
        }
    }
}