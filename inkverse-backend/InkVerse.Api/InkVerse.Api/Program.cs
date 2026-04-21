using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using InkVerse.Api.Data;
using InkVerse.Api.Entities.Identity;
using InkVerse.Api.Helpers.ImageHelper;
using InkVerse.Api.Services.Genres;
using InkVerse.Api.Services.InterFace;
using InkVerse.Api.Services.InterFace.Auth;
using InkVerse.Api.Services.ServicesRepo;
using InkVerse.Api.Services.Tags;
using InkVerse.Api.Services.Trends;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JWT>(builder.Configuration.GetSection("JWT"));
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(option =>
{
    option.SwaggerDoc("v1", new OpenApiInfo { Version = "1.0.0", Title = "InkVerse API" });
    option.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter a valid token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    option.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] { }
        }
    });
    option.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

builder.Services.AddDbContext<InkVerseDB>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
    options.EnableDetailedErrors();
    options.EnableSensitiveDataLogging();
});

builder.Services.AddIdentity<AppUser, IdentityRole>(option =>
{
    option.Password.RequireDigit = true;
    option.Password.RequiredLength = 8;
    option.Password.RequireLowercase = true;
    option.Password.RequireUppercase = true;
    option.Password.RequireNonAlphanumeric = true;
    option.User.RequireUniqueEmail = true;
})
    .AddEntityFrameworkStores<InkVerseDB>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = ctx =>
    {
        ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],
        ValidAudience = builder.Configuration["JWT:ValidAudience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["JWT:SigningKey"]!)
        ),
        RoleClaimType = ClaimTypes.Role
    };

    options.Events = new JwtBearerEvents
    {
        OnChallenge = context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IChapterService, ChapterService>();
builder.Services.AddScoped<IBookServices, BookService>();
builder.Services.AddScoped<IChapterCommentService, ChapterCommentService>();
builder.Services.AddScoped<IUserLibraryService, UserLibraryService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IReviewReplyService, ReviewReplyService>();
builder.Services.AddScoped<IReadingProgressService, ReadingProgressService>();
builder.Services.AddScoped<IMyReviewService, MyReviewService>();
builder.Services.AddScoped<ITrendService, TrendService>();
builder.Services.AddScoped<IGenreService, GenreService>();
builder.Services.AddScoped<ITagService, TagService>();
builder.Services.AddScoped<IAdminChapterService, AdminChapterService>();
builder.Services.AddScoped<IArcService, ArcService>();
builder.Services.AddScoped<IAdminDashboardService, AdminDashboardService>();
builder.Services.AddScoped<IChapterImportService, ChapterImportService>();
builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();

var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
if (!Directory.Exists(webRootPath))
{
    Directory.CreateDirectory(webRootPath);
}

var app = builder.Build();

await InkVerse.Api.Data.IdentitySeeder
    .SeedRolesAndAdminAsync(app.Services, app.Configuration);

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<InkVerseDB>();

    if (!await db.ApiKeys.AnyAsync())
    {
        db.ApiKeys.Add(new ApiKey
        {
            Name = "Clawbot Local",
            Key = "inkverse-local-clawbot-key-123",
            CreatedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
    }
}

// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
//    app.UseDeveloperExceptionPage();

//    app.UseSwagger();
//    app.UseSwaggerUI(c =>
//    {
//        c.SwaggerEndpoint("/swagger/v1/swagger.json", "InkVerse API v1");
//        c.RoutePrefix = "swagger";
//    });

app.UseExceptionHandler("/error");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseRouting();
app.UseCors("AllowAll");
app.UseMiddleware<InkVerse.Api.Middleware.AiApiKeyMiddleware>();
app.UseAuthentication();

app.Use(async (context, next) =>
{
    if (context.User?.Identity?.IsAuthenticated == true)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(userId))
        {
            var userManager = context.RequestServices.GetRequiredService<UserManager<AppUser>>();
            var user = await userManager.FindByIdAsync(userId);
            if (user?.IsBlocked == true)
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new { message = "Your account is blocked." });
                return;
            }
        }
    }

    await next();
});

app.UseAuthorization();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");
app.MapControllers();

app.Run();
