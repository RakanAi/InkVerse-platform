using Amazon;
using Amazon.Runtime;
using Amazon.S3;
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
using InkVerse.Api.Services.Storage;
using InkVerse.Api.Services.Tags;
using InkVerse.Api.Services.Trends;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);
var databaseProvider = builder.Configuration["DatabaseProvider"] ?? "SqlServer";
var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

builder.Services.Configure<JWT>(builder.Configuration.GetSection("JWT"));
builder.Services.AddEndpointsApiExplorer();
builder.Services.Configure<FileStorageOptions>(builder.Configuration.GetSection(FileStorageOptions.SectionName));
builder.Services.AddHttpContextAccessor();

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
    if (string.Equals(databaseProvider, "Sqlite", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlite(defaultConnection);
    }
    else
    {
        options.UseSqlServer(defaultConnection);
    }

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
builder.Services.AddScoped<IMonetizationService, MonetizationService>();
builder.Services.AddScoped<IAiStudioService, AiStudioService>();
builder.Services.AddScoped<IBookBibleService, BookBibleService>();
builder.Services.AddScoped<IBookContractService, BookContractService>();
builder.Services.AddScoped<IContentReportService, ContentReportService>();
builder.Services.AddScoped<IModerationService, ModerationService>();
builder.Services.AddScoped<IAchievementService, AchievementService>();
builder.Services.AddScoped<ISiteVisualAssetService, SiteVisualAssetService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

if (string.Equals(
        builder.Configuration[$"{FileStorageOptions.SectionName}:Provider"],
        FileStorageOptions.R2Provider,
        StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddSingleton<IAmazonS3>(serviceProvider =>
    {
        var options = serviceProvider
            .GetRequiredService<IOptions<FileStorageOptions>>()
            .Value
            .R2;

        var endpoint = ResolveR2Endpoint(options);
        if (string.IsNullOrWhiteSpace(endpoint))
        {
            throw new InvalidOperationException(
                "Storage:R2:Endpoint or Storage:R2:AccountId is required when Storage:Provider is R2.");
        }

        AWSConfigsS3.UseSignatureVersion4 = true;

        return new AmazonS3Client(
            new BasicAWSCredentials(options.AccessKeyId, options.SecretAccessKey),
            new AmazonS3Config
            {
                ServiceURL = endpoint,
                AuthenticationRegion = string.IsNullOrWhiteSpace(options.Region) ? "auto" : options.Region,
                ForcePathStyle = true
            });
    });

    builder.Services.AddScoped<IFileStorageService, R2FileStorageService>();
}
else
{
    builder.Services.AddScoped<IFileStorageService, LocalFileStorageService>();
}

var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
if (!Directory.Exists(webRootPath))
{
    Directory.CreateDirectory(webRootPath);
}

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<InkVerseDB>();

    if (db.Database.IsSqlite())
    {
        await db.Database.EnsureCreatedAsync();
        await EnsureSqliteColumnAsync(db, "AspNetUsers", "ShowReviewsOnProfile", "INTEGER NOT NULL DEFAULT 1");
        await EnsureSqliteColumnAsync(db, "AspNetUsers", "ShowCommentsOnProfile", "INTEGER NOT NULL DEFAULT 1");
        await EnsureSqliteColumnAsync(db, "AspNetUsers", "ShowLibraryOnProfile", "INTEGER NOT NULL DEFAULT 0");
        await EnsureSqliteColumnAsync(db, "AspNetUsers", "ShowAuthorBooksOnProfile", "INTEGER NOT NULL DEFAULT 1");
        await EnsureSqliteColumnAsync(db, "AspNetUsers", "Timezone", "TEXT NOT NULL DEFAULT 'UTC'");
        await EnsureSqliteColumnAsync(db, "ChapterComments", "ParagraphId", "TEXT");
        await EnsureSqliteColumnAsync(db, "ReviewReplies", "ParentReplyId", "INTEGER NULL");
        await EnsureSqliteColumnAsync(db, "ReviewReplies", "IsDeleted", "INTEGER NOT NULL DEFAULT 0");
        await EnsureSqliteColumnAsync(db, "CharacterTemplates", "CharacterWorldId", "INTEGER NULL");
        await EnsureSqliteCommandAsync(db,
            """
            CREATE INDEX IF NOT EXISTS "IX_ReviewReplies_ParentReplyId"
            ON "ReviewReplies" ("ParentReplyId");
            """
        );
        await EnsureSqliteCommandAsync(db,
            """
            CREATE TABLE IF NOT EXISTS "CharacterWorlds" (
                "ID" INTEGER NOT NULL CONSTRAINT "PK_CharacterWorlds" PRIMARY KEY AUTOINCREMENT,
                "Name" TEXT NOT NULL,
                "Slug" TEXT NULL,
                "Summary" TEXT NOT NULL DEFAULT '',
                "ImageUrl" TEXT NOT NULL DEFAULT '',
                "IsActive" INTEGER NOT NULL DEFAULT 1,
                "SortOrder" INTEGER NOT NULL DEFAULT 0,
                "CreatedAt" TEXT NOT NULL,
                "UpdatedAt" TEXT NULL
            );
            """
        );
        await EnsureSqliteCommandAsync(db,
            """
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_CharacterWorlds_Slug"
            ON "CharacterWorlds" ("Slug");
            """
        );
        await EnsureSqliteCommandAsync(db,
            """
            CREATE TABLE IF NOT EXISTS "CharacterTemplates" (
                "ID" INTEGER NOT NULL CONSTRAINT "PK_CharacterTemplates" PRIMARY KEY AUTOINCREMENT,
                "Name" TEXT NOT NULL,
                "Slug" TEXT NULL,
                "Fandom" TEXT NOT NULL,
                "Role" TEXT NOT NULL,
                "Aliases" TEXT NULL,
                "ImageUrl" TEXT NOT NULL,
                "Summary" TEXT NOT NULL,
                "Profile" TEXT NULL,
                "IsActive" INTEGER NOT NULL DEFAULT 1,
                "SortOrder" INTEGER NOT NULL DEFAULT 0,
                "CreatedAt" TEXT NOT NULL,
                "UpdatedAt" TEXT NULL
            );
            """
        );
        await EnsureSqliteCommandAsync(db,
            """
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_CharacterTemplates_Slug"
            ON "CharacterTemplates" ("Slug");
            """
        );
        await EnsureSqliteCommandAsync(db,
            """
            CREATE TABLE IF NOT EXISTS "BookCharacters" (
                "BookId" INTEGER NOT NULL,
                "CharacterTemplateId" INTEGER NOT NULL,
                "AddedAt" TEXT NOT NULL,
                CONSTRAINT "PK_BookCharacters" PRIMARY KEY ("BookId", "CharacterTemplateId"),
                CONSTRAINT "FK_BookCharacters_Books_BookId" FOREIGN KEY ("BookId") REFERENCES "Books" ("ID") ON DELETE CASCADE,
                CONSTRAINT "FK_BookCharacters_CharacterTemplates_CharacterTemplateId" FOREIGN KEY ("CharacterTemplateId") REFERENCES "CharacterTemplates" ("ID") ON DELETE CASCADE
            );
            """
        );
        await EnsureSqliteCommandAsync(db,
            """
            CREATE INDEX IF NOT EXISTS "IX_BookCharacters_CharacterTemplateId"
            ON "BookCharacters" ("CharacterTemplateId");
            """
        );
        await EnsureSqliteCommandAsync(db,
            """
            CREATE INDEX IF NOT EXISTS "IX_CharacterTemplates_CharacterWorldId"
            ON "CharacterTemplates" ("CharacterWorldId");
            """
        );
        await EnsureMonetizationSqliteAsync(db);
        await EnsureBookBibleSqliteAsync(db);
        await EnsureReportsSqliteAsync(db);
        await EnsureNotificationsSqliteAsync(db);
        await EnsureModerationSqliteAsync(db);
        await EnsureReaderProgressionSqliteAsync(db);
        await EnsureSiteVisualAssetsSqliteAsync(db);
        await BootstrapCharacterWorldsAsync(db);
    }
}

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

static async Task EnsureSqliteColumnAsync(
    InkVerseDB db,
    string tableName,
    string columnName,
    string columnDefinition)
{
    var connection = db.Database.GetDbConnection();
    var shouldClose = connection.State != System.Data.ConnectionState.Open;

    if (shouldClose)
    {
        await connection.OpenAsync();
    }

    try
    {
        await using var pragma = connection.CreateCommand();
        pragma.CommandText = $"PRAGMA table_info(\"{tableName}\");";

        await using var reader = await pragma.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            if (string.Equals(
                reader["name"]?.ToString(),
                columnName,
                StringComparison.OrdinalIgnoreCase))
            {
                return;
            }
        }

        await using var alter = connection.CreateCommand();
        alter.CommandText =
            $"ALTER TABLE \"{tableName}\" ADD COLUMN \"{columnName}\" {columnDefinition};";
        await alter.ExecuteNonQueryAsync();
    }
    finally
    {
        if (shouldClose)
        {
            await connection.CloseAsync();
        }
    }
}

static string ResolveR2Endpoint(R2StorageOptions options)
{
    if (!string.IsNullOrWhiteSpace(options.Endpoint))
    {
        return options.Endpoint.TrimEnd('/');
    }

    if (!string.IsNullOrWhiteSpace(options.AccountId))
    {
        return $"https://{options.AccountId}.r2.cloudflarestorage.com";
    }

    return "";
}

static async Task EnsureSqliteCommandAsync(InkVerseDB db, string sql)
{
    var connection = db.Database.GetDbConnection();
    var shouldClose = connection.State != System.Data.ConnectionState.Open;

    if (shouldClose)
    {
        await connection.OpenAsync();
    }

    try
    {
        await using var command = connection.CreateCommand();
        command.CommandText = sql;
        await command.ExecuteNonQueryAsync();
    }
    finally
    {
        if (shouldClose)
        {
            await connection.CloseAsync();
        }
    }
}

static async Task EnsureMonetizationSqliteAsync(InkVerseDB db)
{
    await EnsureSqliteCommandAsync(db,
        """
        CREATE TABLE IF NOT EXISTS "WalletAccounts" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_WalletAccounts" PRIMARY KEY AUTOINCREMENT,
            "UserId" TEXT NOT NULL,
            "CoinBalance" INTEGER NOT NULL DEFAULT 0,
            "CreditBalance" INTEGER NOT NULL DEFAULT 0,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_WalletAccounts_UserId" ON "WalletAccounts" ("UserId");

        CREATE TABLE IF NOT EXISTS "CoinLedgerEntries" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_CoinLedgerEntries" PRIMARY KEY AUTOINCREMENT,
            "UserId" TEXT NOT NULL,
            "AmountCoins" INTEGER NOT NULL,
            "BalanceAfterCoins" INTEGER NOT NULL,
            "EntryType" TEXT NOT NULL,
            "SourceType" TEXT NOT NULL,
            "SourceId" TEXT NULL,
            "Description" TEXT NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS "CoinPurchases" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_CoinPurchases" PRIMARY KEY AUTOINCREMENT,
            "UserId" TEXT NOT NULL,
            "PackCode" TEXT NOT NULL,
            "Coins" INTEGER NOT NULL,
            "AmountCents" INTEGER NOT NULL,
            "Currency" TEXT NOT NULL,
            "Provider" TEXT NOT NULL,
            "ProviderReference" TEXT NOT NULL,
            "Status" TEXT NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS "ChapterMonetizations" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_ChapterMonetizations" PRIMARY KEY AUTOINCREMENT,
            "ChapterId" INTEGER NOT NULL,
            "IsPaid" INTEGER NOT NULL DEFAULT 0,
            "PriceCoins" INTEGER NOT NULL DEFAULT 5,
            "Teaser" TEXT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_ChapterMonetizations_ChapterId" ON "ChapterMonetizations" ("ChapterId");

        CREATE TABLE IF NOT EXISTS "ChapterUnlocks" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_ChapterUnlocks" PRIMARY KEY AUTOINCREMENT,
            "UserId" TEXT NOT NULL,
            "ChapterId" INTEGER NOT NULL,
            "PaidCoins" INTEGER NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_ChapterUnlocks_UserId_ChapterId" ON "ChapterUnlocks" ("UserId", "ChapterId");

        CREATE TABLE IF NOT EXISTS "AuthorAgreements" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_AuthorAgreements" PRIMARY KEY AUTOINCREMENT,
            "Version" TEXT NOT NULL,
            "Title" TEXT NOT NULL,
            "Body" TEXT NOT NULL,
            "IsActive" INTEGER NOT NULL DEFAULT 1,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_AuthorAgreements_Version" ON "AuthorAgreements" ("Version");

        CREATE TABLE IF NOT EXISTS "AuthorAgreementAcceptances" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_AuthorAgreementAcceptances" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "AuthorAgreementId" INTEGER NOT NULL,
            "Version" TEXT NOT NULL,
            "AcceptedAt" TEXT NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_AuthorAgreementAcceptances_AuthorId_Version" ON "AuthorAgreementAcceptances" ("AuthorId", "Version");

        CREATE TABLE IF NOT EXISTS "RoyaltyLedgerEntries" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_RoyaltyLedgerEntries" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "ReaderId" TEXT NULL,
            "BookId" INTEGER NOT NULL,
            "ChapterId" INTEGER NULL,
            "GrossCoins" INTEGER NOT NULL,
            "NetCoins" INTEGER NOT NULL,
            "AuthorCoins" INTEGER NOT NULL,
            "PlatformCoins" INTEGER NOT NULL,
            "EntryType" TEXT NOT NULL,
            "Status" TEXT NOT NULL,
            "AvailableAt" TEXT NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS "AuthorBalances" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_AuthorBalances" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "PendingCoins" INTEGER NOT NULL DEFAULT 0,
            "AvailableCoins" INTEGER NOT NULL DEFAULT 0,
            "WithdrawnCoins" INTEGER NOT NULL DEFAULT 0,
            "LifetimeCoins" INTEGER NOT NULL DEFAULT 0,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_AuthorBalances_AuthorId" ON "AuthorBalances" ("AuthorId");

        CREATE TABLE IF NOT EXISTS "PayoutRequests" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_PayoutRequests" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "AmountCoins" INTEGER NOT NULL,
            "Status" TEXT NOT NULL,
            "Provider" TEXT NOT NULL,
            "ProviderReference" TEXT NULL,
            "RequestedAt" TEXT NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS "BookAiApprovals" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_BookAiApprovals" PRIMARY KEY AUTOINCREMENT,
            "BookId" INTEGER NOT NULL,
            "TranslationEnabled" INTEGER NOT NULL DEFAULT 0,
            "TtsEnabled" INTEGER NOT NULL DEFAULT 0,
            "ApprovedById" TEXT NULL,
            "ApprovedAt" TEXT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_BookAiApprovals_BookId" ON "BookAiApprovals" ("BookId");

        CREATE TABLE IF NOT EXISTS "BookContracts" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_BookContracts" PRIMARY KEY AUTOINCREMENT,
            "BookId" INTEGER NOT NULL,
            "Status" TEXT NOT NULL,
            "SnapshotWordCount" INTEGER NOT NULL DEFAULT 0,
            "SnapshotChapterCount" INTEGER NOT NULL DEFAULT 0,
            "SnapshotTotalViews" INTEGER NOT NULL DEFAULT 0,
            "SnapshotVerseType" TEXT NOT NULL DEFAULT '',
            "SnapshotOriginType" TEXT NOT NULL DEFAULT '',
            "SnapshotBookStatus" TEXT NOT NULL DEFAULT '',
            "RightsAttestedById" TEXT NULL,
            "RightsAttestedAt" TEXT NULL,
            "ReviewedById" TEXT NULL,
            "ReviewNote" TEXT NULL,
            "ApprovedAt" TEXT NULL,
            "RejectedAt" TEXT NULL,
            "RevokedAt" TEXT NULL,
            "PaidChaptersAllowedAfter" TEXT NULL,
            "ContentLockedAfter" TEXT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_BookContracts_BookId" ON "BookContracts" ("BookId");

        CREATE TABLE IF NOT EXISTS "AiServiceCatalog" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_AiServiceCatalog" PRIMARY KEY AUTOINCREMENT,
            "ServiceKey" TEXT NOT NULL,
            "Audience" TEXT NOT NULL,
            "Name" TEXT NOT NULL,
            "BaseCredits" INTEGER NOT NULL DEFAULT 0,
            "PerHundredWordsCredits" INTEGER NOT NULL DEFAULT 0,
            "PerThousandWordsCredits" INTEGER NOT NULL DEFAULT 0,
            "MinimumCredits" INTEGER NOT NULL DEFAULT 0,
            "MaxWords" INTEGER NOT NULL DEFAULT 0,
            "IsActive" INTEGER NOT NULL DEFAULT 1,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_AiServiceCatalog_ServiceKey" ON "AiServiceCatalog" ("ServiceKey");

        CREATE TABLE IF NOT EXISTS "AiArtifacts" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_AiArtifacts" PRIMARY KEY AUTOINCREMENT,
            "ServiceKey" TEXT NOT NULL,
            "BookId" INTEGER NOT NULL,
            "ChapterId" INTEGER NULL,
            "Language" TEXT NOT NULL,
            "MimeType" TEXT NOT NULL,
            "Content" TEXT NOT NULL,
            "WordCount" INTEGER NOT NULL,
            "CreatedByUserId" TEXT NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS "IX_AiArtifacts_ServiceKey_ChapterId_Language" ON "AiArtifacts" ("ServiceKey", "ChapterId", "Language");

        CREATE TABLE IF NOT EXISTS "BookNotebookEntries" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_BookNotebookEntries" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "BookId" INTEGER NOT NULL,
            "EntryType" TEXT NOT NULL,
            "Title" TEXT NOT NULL,
            "Content" TEXT NOT NULL,
            "RelatedChapterId" INTEGER NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS "AiServiceOrders" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_AiServiceOrders" PRIMARY KEY AUTOINCREMENT,
            "UserId" TEXT NOT NULL,
            "ServiceKey" TEXT NOT NULL,
            "BookId" INTEGER NOT NULL,
            "ChapterId" INTEGER NULL,
            "AiArtifactId" INTEGER NULL,
            "NotebookEntryId" INTEGER NULL,
            "PriceCredits" INTEGER NOT NULL,
            "WordCount" INTEGER NOT NULL,
            "Status" TEXT NOT NULL,
            "Prompt" TEXT NOT NULL,
            "OutputPreview" TEXT NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS "ProofreadingDrafts" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_ProofreadingDrafts" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "BookId" INTEGER NOT NULL,
            "ChapterId" INTEGER NOT NULL,
            "OriginalContent" TEXT NOT NULL,
            "RevisedContent" TEXT NOT NULL,
            "PriceCredits" INTEGER NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        """
    );

    await EnsureSqliteColumnAsync(db, "BookContracts", "PaidChaptersAllowedAfter", "TEXT NULL");
    await EnsureSqliteColumnAsync(db, "BookContracts", "ContentLockedAfter", "TEXT NULL");
}

static async Task EnsureBookBibleSqliteAsync(InkVerseDB db)
{
    await EnsureSqliteCommandAsync(db,
        """
        CREATE TABLE IF NOT EXISTS "BookBibleProfiles" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_BookBibleProfiles" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "BookId" INTEGER NOT NULL,
            "Premise" TEXT NOT NULL DEFAULT '',
            "Themes" TEXT NOT NULL DEFAULT '',
            "Tone" TEXT NOT NULL DEFAULT '',
            "ReaderPromise" TEXT NOT NULL DEFAULT '',
            "AuthorNotes" TEXT NOT NULL DEFAULT '',
            "NeedsScan" INTEGER NOT NULL DEFAULT 0,
            "LastScannedAt" TEXT NULL,
            "LastChapterChangeAt" TEXT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_BookBibleProfiles_BookId" ON "BookBibleProfiles" ("BookId");

        CREATE TABLE IF NOT EXISTS "BookWorldEntries" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_BookWorldEntries" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "BookId" INTEGER NOT NULL,
            "EntryType" TEXT NOT NULL,
            "Name" TEXT NOT NULL,
            "Summary" TEXT NOT NULL,
            "Details" TEXT NOT NULL,
            "Tags" TEXT NOT NULL,
            "SortOrder" INTEGER NOT NULL DEFAULT 0,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS "IX_BookWorldEntries_BookId_EntryType" ON "BookWorldEntries" ("BookId", "EntryType");

        CREATE TABLE IF NOT EXISTS "BookCharacterProfiles" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_BookCharacterProfiles" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "BookId" INTEGER NOT NULL,
            "Name" TEXT NOT NULL,
            "Aliases" TEXT NOT NULL,
            "Role" TEXT NOT NULL,
            "Status" TEXT NOT NULL,
            "Appearance" TEXT NOT NULL,
            "Motivation" TEXT NOT NULL,
            "Fear" TEXT NOT NULL,
            "Goal" TEXT NOT NULL,
            "Secrets" TEXT NOT NULL,
            "ArcNotes" TEXT NOT NULL,
            "SortOrder" INTEGER NOT NULL DEFAULT 0,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS "IX_BookCharacterProfiles_BookId_Name" ON "BookCharacterProfiles" ("BookId", "Name");

        CREATE TABLE IF NOT EXISTS "BookCharacterRelationships" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_BookCharacterRelationships" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "BookId" INTEGER NOT NULL,
            "SourceCharacterId" INTEGER NOT NULL,
            "TargetCharacterId" INTEGER NOT NULL,
            "RelationType" TEXT NOT NULL,
            "Tension" TEXT NOT NULL,
            "Status" TEXT NOT NULL,
            "Notes" TEXT NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS "IX_BookCharacterRelationships_BookId_SourceCharacterId_TargetCharacterId"
        ON "BookCharacterRelationships" ("BookId", "SourceCharacterId", "TargetCharacterId");

        CREATE TABLE IF NOT EXISTS "BookPlotThreads" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_BookPlotThreads" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "BookId" INTEGER NOT NULL,
            "Title" TEXT NOT NULL,
            "Setup" TEXT NOT NULL,
            "Promise" TEXT NOT NULL,
            "Conflict" TEXT NOT NULL,
            "Status" TEXT NOT NULL,
            "Payoff" TEXT NOT NULL,
            "SortOrder" INTEGER NOT NULL DEFAULT 0,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS "IX_BookPlotThreads_BookId_Status" ON "BookPlotThreads" ("BookId", "Status");

        CREATE TABLE IF NOT EXISTS "BookTimelineEvents" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_BookTimelineEvents" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "BookId" INTEGER NOT NULL,
            "ChapterId" INTEGER NULL,
            "Title" TEXT NOT NULL,
            "OrderIndex" INTEGER NOT NULL DEFAULT 0,
            "DateLabel" TEXT NOT NULL,
            "Description" TEXT NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS "IX_BookTimelineEvents_BookId_OrderIndex" ON "BookTimelineEvents" ("BookId", "OrderIndex");

        CREATE TABLE IF NOT EXISTS "BookBibleSuggestions" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_BookBibleSuggestions" PRIMARY KEY AUTOINCREMENT,
            "AuthorId" TEXT NOT NULL,
            "BookId" INTEGER NOT NULL,
            "SuggestionType" TEXT NOT NULL,
            "Title" TEXT NOT NULL,
            "Summary" TEXT NOT NULL,
            "PayloadJson" TEXT NOT NULL,
            "Status" TEXT NOT NULL,
            "SourceChapterIds" TEXT NOT NULL,
            "WordCount" INTEGER NOT NULL DEFAULT 0,
            "PriceCredits" INTEGER NOT NULL DEFAULT 0,
            "DecidedAt" TEXT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS "IX_BookBibleSuggestions_BookId_Status" ON "BookBibleSuggestions" ("BookId", "Status");
        """
    );
}

static async Task EnsureReportsSqliteAsync(InkVerseDB db)
{
    await EnsureSqliteCommandAsync(db,
        """
        CREATE TABLE IF NOT EXISTS "ContentReports" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_ContentReports" PRIMARY KEY AUTOINCREMENT,
            "TargetType" TEXT NOT NULL,
            "TargetId" TEXT NOT NULL,
            "ReporterId" TEXT NOT NULL,
            "TargetOwnerId" TEXT NULL,
            "Reason" TEXT NOT NULL,
            "Details" TEXT NULL,
            "Status" TEXT NOT NULL,
            "TargetTitle" TEXT NOT NULL DEFAULT '',
            "TargetPreview" TEXT NOT NULL DEFAULT '',
            "TargetContext" TEXT NOT NULL DEFAULT '',
            "TargetUrl" TEXT NULL,
            "AdminTargetUrl" TEXT NULL,
            "ResolvedAt" TEXT NULL,
            "ResolvedById" TEXT NULL,
            "AdminNote" TEXT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS "IX_ContentReports_Status_TargetType_CreatedAt"
        ON "ContentReports" ("Status", "TargetType", "CreatedAt");

        CREATE INDEX IF NOT EXISTS "IX_ContentReports_Reporter_Target_Status"
        ON "ContentReports" ("ReporterId", "TargetType", "TargetId", "Status");
        """
    );
}

static async Task EnsureNotificationsSqliteAsync(InkVerseDB db)
{
    await EnsureSqliteCommandAsync(db,
        """
        CREATE TABLE IF NOT EXISTS "UserNotifications" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_UserNotifications" PRIMARY KEY AUTOINCREMENT,
            "RecipientId" TEXT NOT NULL,
            "ActorId" TEXT NULL,
            "Category" TEXT NOT NULL,
            "Type" TEXT NOT NULL,
            "Title" TEXT NOT NULL,
            "Body" TEXT NOT NULL,
            "LinkUrl" TEXT NULL,
            "TargetType" TEXT NULL,
            "TargetId" TEXT NULL,
            "MetadataJson" TEXT NULL,
            "DedupeKey" TEXT NOT NULL,
            "IsRead" INTEGER NOT NULL DEFAULT 0,
            "ReadAt" TEXT NULL,
            "CreatedAt" TEXT NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserNotifications_RecipientId_DedupeKey"
        ON "UserNotifications" ("RecipientId", "DedupeKey");

        CREATE INDEX IF NOT EXISTS "IX_UserNotifications_RecipientId_IsRead_CreatedAt"
        ON "UserNotifications" ("RecipientId", "IsRead", "CreatedAt");

        CREATE TABLE IF NOT EXISTS "UserNotificationPreferences" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_UserNotificationPreferences" PRIMARY KEY AUTOINCREMENT,
            "UserId" TEXT NOT NULL,
            "Category" TEXT NOT NULL,
            "InAppEnabled" INTEGER NOT NULL DEFAULT 1,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedAt" TEXT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserNotificationPreferences_UserId_Category"
        ON "UserNotificationPreferences" ("UserId", "Category");

        CREATE TABLE IF NOT EXISTS "UserAuthorFollows" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_UserAuthorFollows" PRIMARY KEY AUTOINCREMENT,
            "FollowerId" TEXT NOT NULL,
            "AuthorId" TEXT NOT NULL,
            "IsActive" INTEGER NOT NULL DEFAULT 1,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedAt" TEXT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserAuthorFollows_FollowerId_AuthorId"
        ON "UserAuthorFollows" ("FollowerId", "AuthorId");

        CREATE INDEX IF NOT EXISTS "IX_UserAuthorFollows_AuthorId_IsActive"
        ON "UserAuthorFollows" ("AuthorId", "IsActive");
        """
    );
}

static async Task EnsureModerationSqliteAsync(InkVerseDB db)
{
    await EnsureSqliteCommandAsync(db,
        """
        CREATE TABLE IF NOT EXISTS "ModerationCases" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_ModerationCases" PRIMARY KEY AUTOINCREMENT,
            "TargetType" TEXT NOT NULL,
            "TargetId" TEXT NOT NULL,
            "TargetOwnerId" TEXT NULL,
            "Source" TEXT NOT NULL,
            "SourceReportId" INTEGER NULL,
            "Status" TEXT NOT NULL,
            "Severity" TEXT NOT NULL,
            "Category" TEXT NOT NULL,
            "ConfidenceScore" INTEGER NOT NULL DEFAULT 0,
            "RequiresAdmin" INTEGER NOT NULL DEFAULT 1,
            "IsAutoHandled" INTEGER NOT NULL DEFAULT 0,
            "Title" TEXT NOT NULL DEFAULT '',
            "TargetPreview" TEXT NOT NULL DEFAULT '',
            "TargetContext" TEXT NOT NULL DEFAULT '',
            "TargetUrl" TEXT NULL,
            "AdminTargetUrl" TEXT NULL,
            "ClawbotSummary" TEXT NOT NULL DEFAULT '',
            "SuggestedAction" TEXT NOT NULL DEFAULT 'none',
            "AutoAction" TEXT NOT NULL DEFAULT 'none',
            "AutoActionTakenAt" TEXT NULL,
            "ResolvedAt" TEXT NULL,
            "ResolvedById" TEXT NULL,
            "AdminNote" TEXT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS "IX_ModerationCases_Status_RequiresAdmin_CreatedAt"
        ON "ModerationCases" ("Status", "RequiresAdmin", "CreatedAt");

        CREATE INDEX IF NOT EXISTS "IX_ModerationCases_Target"
        ON "ModerationCases" ("TargetType", "TargetId", "Category", "Source");

        CREATE INDEX IF NOT EXISTS "IX_ModerationCases_SourceReportId"
        ON "ModerationCases" ("SourceReportId");

        CREATE TABLE IF NOT EXISTS "ModerationCaseMessages" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_ModerationCaseMessages" PRIMARY KEY AUTOINCREMENT,
            "CaseId" INTEGER NOT NULL,
            "SenderId" TEXT NULL,
            "Audience" TEXT NOT NULL,
            "MessageType" TEXT NOT NULL,
            "Body" TEXT NOT NULL,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS "IX_ModerationCaseMessages_CaseId_CreatedAt"
        ON "ModerationCaseMessages" ("CaseId", "CreatedAt");
        """
    );
}

static async Task EnsureReaderProgressionSqliteAsync(InkVerseDB db)
{
    await EnsureSqliteCommandAsync(db,
        """
        CREATE TABLE IF NOT EXISTS "ReaderProgresses" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_ReaderProgresses" PRIMARY KEY AUTOINCREMENT,
            "UserId" TEXT NOT NULL,
            "Level" INTEGER NOT NULL DEFAULT 1,
            "TotalUniqueChaptersRead" INTEGER NOT NULL DEFAULT 0,
            "CurrentLevelProgress" INTEGER NOT NULL DEFAULT 0,
            "NextLevelRequirement" INTEGER NOT NULL DEFAULT 100,
            "DailyReadStreak" INTEGER NOT NULL DEFAULT 0,
            "LongestStreak" INTEGER NOT NULL DEFAULT 0,
            "LastStreakLocalDate" TEXT NULL,
            "Timezone" TEXT NOT NULL DEFAULT 'UTC',
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_ReaderProgresses_UserId" ON "ReaderProgresses" ("UserId");

        CREATE TABLE IF NOT EXISTS "ReaderChapterReads" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_ReaderChapterReads" PRIMARY KEY AUTOINCREMENT,
            "UserId" TEXT NOT NULL,
            "ChapterId" INTEGER NOT NULL,
            "BookId" INTEGER NOT NULL,
            "CountedAt" TEXT NOT NULL,
            "ScrollPercent" INTEGER NOT NULL DEFAULT 0,
            "ActiveSeconds" INTEGER NOT NULL DEFAULT 0,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_ReaderChapterReads_UserId_ChapterId"
        ON "ReaderChapterReads" ("UserId", "ChapterId");
        CREATE INDEX IF NOT EXISTS "IX_ReaderChapterReads_UserId_BookId"
        ON "ReaderChapterReads" ("UserId", "BookId");

        CREATE TABLE IF NOT EXISTS "ReaderReadSessions" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_ReaderReadSessions" PRIMARY KEY AUTOINCREMENT,
            "SessionId" TEXT NOT NULL,
            "UserId" TEXT NOT NULL,
            "ChapterId" INTEGER NOT NULL,
            "StartedAt" TEXT NOT NULL,
            "CompletedAt" TEXT NULL,
            "IsCompleted" INTEGER NOT NULL DEFAULT 0,
            "Timezone" TEXT NOT NULL DEFAULT 'UTC',
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_ReaderReadSessions_SessionId"
        ON "ReaderReadSessions" ("SessionId");

        CREATE TABLE IF NOT EXISTS "AchievementDefinitions" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_AchievementDefinitions" PRIMARY KEY AUTOINCREMENT,
            "Key" TEXT NOT NULL,
            "Title" TEXT NOT NULL,
            "Description" TEXT NOT NULL DEFAULT '',
            "Category" TEXT NOT NULL,
            "Tier" TEXT NOT NULL,
            "Threshold" INTEGER NOT NULL DEFAULT 0,
            "MetricType" TEXT NOT NULL,
            "IsActive" INTEGER NOT NULL DEFAULT 1,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_AchievementDefinitions_Key"
        ON "AchievementDefinitions" ("Key");
        CREATE INDEX IF NOT EXISTS "IX_AchievementDefinitions_MetricType_Tier"
        ON "AchievementDefinitions" ("MetricType", "Tier");

        CREATE TABLE IF NOT EXISTS "UserAchievements" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_UserAchievements" PRIMARY KEY AUTOINCREMENT,
            "UserId" TEXT NOT NULL,
            "AchievementKey" TEXT NOT NULL,
            "Tier" TEXT NOT NULL,
            "UnlockedAt" TEXT NOT NULL,
            "ProgressSnapshot" INTEGER NOT NULL DEFAULT 0,
            "CreatedBy" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedBy" TEXT NULL,
            "UpdatedAt" TEXT NULL,
            "IsDeleted" INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_UserAchievements_UserId_AchievementKey"
        ON "UserAchievements" ("UserId", "AchievementKey");
        CREATE INDEX IF NOT EXISTS "IX_UserAchievements_UserId_UnlockedAt"
        ON "UserAchievements" ("UserId", "UnlockedAt");
        """
    );
}

static async Task EnsureSiteVisualAssetsSqliteAsync(InkVerseDB db)
{
    await EnsureSqliteCommandAsync(db,
        """
        CREATE TABLE IF NOT EXISTS "SiteVisualAssets" (
            "ID" INTEGER NOT NULL CONSTRAINT "PK_SiteVisualAssets" PRIMARY KEY AUTOINCREMENT,
            "SlotKey" TEXT NOT NULL,
            "Name" TEXT NOT NULL DEFAULT '',
            "Description" TEXT NOT NULL DEFAULT '',
            "ImageUrl" TEXT NOT NULL DEFAULT '',
            "AltText" TEXT NOT NULL DEFAULT '',
            "ImagePositionX" REAL NOT NULL DEFAULT 50,
            "ImagePositionY" REAL NOT NULL DEFAULT 50,
            "ImageScale" REAL NOT NULL DEFAULT 1,
            "IsActive" INTEGER NOT NULL DEFAULT 1,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedAt" TEXT NULL,
            "UpdatedById" TEXT NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "IX_SiteVisualAssets_SlotKey"
        ON "SiteVisualAssets" ("SlotKey");
        """
    );

    await EnsureSqliteColumnAsync(db, "SiteVisualAssets", "ImagePositionX", "REAL NOT NULL DEFAULT 50");
    await EnsureSqliteColumnAsync(db, "SiteVisualAssets", "ImagePositionY", "REAL NOT NULL DEFAULT 50");
    await EnsureSqliteColumnAsync(db, "SiteVisualAssets", "ImageScale", "REAL NOT NULL DEFAULT 1");
}

static async Task BootstrapCharacterWorldsAsync(InkVerseDB db)
{
    var characters = await db.CharacterTemplates
        .Where(character => character.CharacterWorldId == null)
        .OrderBy(character => character.ID)
        .ToListAsync();

    if (!characters.Any())
    {
        return;
    }

    var worlds = await db.CharacterWorlds.ToListAsync();

    foreach (var character in characters)
    {
        var worldName = string.IsNullOrWhiteSpace(character.Fandom)
            ? "Legacy World"
            : character.Fandom.Trim();

        var slug = BuildSqliteSeedSlug(worldName);
        var world = worlds.FirstOrDefault(item =>
            string.Equals(item.Name, worldName, StringComparison.OrdinalIgnoreCase));

        if (world == null)
        {
            world = new InkVerse.Api.Entities.CharacterBank.CharacterWorld
            {
                Name = worldName,
                Slug = slug,
                Summary = $"Imported world for {worldName}.",
                IsActive = true,
                SortOrder = worlds.Count,
                CreatedAt = DateTime.UtcNow,
            };

            db.CharacterWorlds.Add(world);
            worlds.Add(world);
            await db.SaveChangesAsync();
        }

        character.CharacterWorldId = world.ID;
        character.Fandom = world.Name;
    }

    await db.SaveChangesAsync();
}

static string BuildSqliteSeedSlug(string value)
{
    var cleaned = new string(
        value
            .Trim()
            .ToLowerInvariant()
            .Select(character => char.IsLetterOrDigit(character) ? character : '-')
            .ToArray());

    while (cleaned.Contains("--"))
    {
        cleaned = cleaned.Replace("--", "-");
    }

    return cleaned.Trim('-');
}
