using System.Text.Json;
using InkVerse.Api.Data;
using InkVerse.Api.DTOs.BookBible;
using InkVerse.Api.Entities.BookBible;
using InkVerse.Api.Entities.Monetization;
using InkVerse.Api.Services.InterFace;
using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Services.ServicesRepo;

public class BookBibleService : IBookBibleService
{
    private const string ServiceKey = "book-bible-sync";
    private const int BaseCredits = 20;
    private const int PerThousandWordsCredits = 2;
    private const int MaxWords = 15000;

    private readonly InkVerseDB _db;

    public BookBibleService(InkVerseDB db)
    {
        _db = db;
    }

    public async Task<BookBibleSnapshotDto> GetSnapshotAsync(int bookId, string authorId, bool isAdmin)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var profile = await EnsureProfileAsync(bookId, authorId, isAdmin);
        var world = await _db.BookWorldEntries
            .Where(item => item.BookId == bookId)
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Name)
            .ToListAsync();
        var characters = await _db.BookCharacterProfiles
            .Where(item => item.BookId == bookId)
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Name)
            .ToListAsync();
        var relationships = await _db.BookCharacterRelationships
            .Where(item => item.BookId == bookId)
            .Include(item => item.SourceCharacter)
            .Include(item => item.TargetCharacter)
            .OrderBy(item => item.ID)
            .ToListAsync();
        var plotThreads = await _db.BookPlotThreads
            .Where(item => item.BookId == bookId)
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Title)
            .ToListAsync();
        var timeline = await _db.BookTimelineEvents
            .Where(item => item.BookId == bookId)
            .Include(item => item.Chapter)
            .OrderBy(item => item.OrderIndex)
            .ThenBy(item => item.ID)
            .ToListAsync();
        var suggestions = await _db.BookBibleSuggestions
            .Where(item => item.BookId == bookId)
            .OrderByDescending(item => item.Status == "pending")
            .ThenByDescending(item => item.CreatedAt)
            .Take(80)
            .ToListAsync();

        return new BookBibleSnapshotDto
        {
            Profile = ToProfileDto(profile),
            Completion = BuildCompletion(profile, world.Count, characters.Count, plotThreads.Count, timeline.Count),
            WorldEntries = world.Select(ToWorldDto).ToList(),
            Characters = characters.Select(ToCharacterDto).ToList(),
            Relationships = relationships.Select(ToRelationshipDto).ToList(),
            PlotThreads = plotThreads.Select(ToPlotThreadDto).ToList(),
            TimelineEvents = timeline.Select(ToTimelineDto).ToList(),
            Suggestions = suggestions.Select(ToSuggestionDto).ToList(),
        };
    }

    public async Task<BookBibleProfileDto> UpdateProfileAsync(int bookId, string authorId, bool isAdmin, BookBibleProfileUpdateDto dto)
    {
        var profile = await EnsureProfileAsync(bookId, authorId, isAdmin);
        profile.Premise = Clean(dto.Premise);
        profile.Themes = Clean(dto.Themes);
        profile.Tone = Clean(dto.Tone);
        profile.ReaderPromise = Clean(dto.ReaderPromise);
        profile.AuthorNotes = Clean(dto.AuthorNotes);
        profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToProfileDto(profile);
    }

    public async Task<BookWorldEntryDto> CreateWorldEntryAsync(int bookId, string authorId, bool isAdmin, BookWorldEntryWriteDto dto)
    {
        var ownerId = await ResolveOwnerIdAsync(bookId, authorId, isAdmin);
        var entity = new BookWorldEntry
        {
            AuthorId = ownerId,
            BookId = bookId,
            CreatedAt = DateTime.UtcNow,
        };
        ApplyWorld(entity, dto);
        _db.BookWorldEntries.Add(entity);
        await _db.SaveChangesAsync();
        return ToWorldDto(entity);
    }

    public async Task<BookWorldEntryDto> UpdateWorldEntryAsync(int bookId, int entryId, string authorId, bool isAdmin, BookWorldEntryWriteDto dto)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var entity = await _db.BookWorldEntries.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == entryId)
            ?? throw new KeyNotFoundException("World entry not found.");
        ApplyWorld(entity, dto);
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToWorldDto(entity);
    }

    public async Task DeleteWorldEntryAsync(int bookId, int entryId, string authorId, bool isAdmin)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var entity = await _db.BookWorldEntries.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == entryId)
            ?? throw new KeyNotFoundException("World entry not found.");
        _db.BookWorldEntries.Remove(entity);
        await _db.SaveChangesAsync();
    }

    public async Task<BookCharacterProfileDto> CreateCharacterAsync(int bookId, string authorId, bool isAdmin, BookCharacterProfileWriteDto dto)
    {
        var ownerId = await ResolveOwnerIdAsync(bookId, authorId, isAdmin);
        var entity = new BookCharacterProfile
        {
            AuthorId = ownerId,
            BookId = bookId,
            CreatedAt = DateTime.UtcNow,
        };
        ApplyCharacter(entity, dto);
        _db.BookCharacterProfiles.Add(entity);
        await _db.SaveChangesAsync();
        return ToCharacterDto(entity);
    }

    public async Task<BookCharacterProfileDto> UpdateCharacterAsync(int bookId, int characterId, string authorId, bool isAdmin, BookCharacterProfileWriteDto dto)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var entity = await _db.BookCharacterProfiles.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == characterId)
            ?? throw new KeyNotFoundException("Character not found.");
        ApplyCharacter(entity, dto);
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToCharacterDto(entity);
    }

    public async Task DeleteCharacterAsync(int bookId, int characterId, string authorId, bool isAdmin)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var entity = await _db.BookCharacterProfiles.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == characterId)
            ?? throw new KeyNotFoundException("Character not found.");
        var relationships = await _db.BookCharacterRelationships
            .Where(item => item.BookId == bookId && (item.SourceCharacterId == characterId || item.TargetCharacterId == characterId))
            .ToListAsync();
        _db.BookCharacterRelationships.RemoveRange(relationships);
        _db.BookCharacterProfiles.Remove(entity);
        await _db.SaveChangesAsync();
    }

    public async Task<BookCharacterRelationshipDto> CreateRelationshipAsync(int bookId, string authorId, bool isAdmin, BookCharacterRelationshipWriteDto dto)
    {
        var ownerId = await ResolveOwnerIdAsync(bookId, authorId, isAdmin);
        await EnsureCharactersBelongToBookAsync(bookId, dto.SourceCharacterId, dto.TargetCharacterId);
        var entity = new BookCharacterRelationship
        {
            AuthorId = ownerId,
            BookId = bookId,
            CreatedAt = DateTime.UtcNow,
        };
        ApplyRelationship(entity, dto);
        _db.BookCharacterRelationships.Add(entity);
        await _db.SaveChangesAsync();
        return await LoadRelationshipDtoAsync(bookId, entity.ID);
    }

    public async Task<BookCharacterRelationshipDto> UpdateRelationshipAsync(int bookId, int relationshipId, string authorId, bool isAdmin, BookCharacterRelationshipWriteDto dto)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        await EnsureCharactersBelongToBookAsync(bookId, dto.SourceCharacterId, dto.TargetCharacterId);
        var entity = await _db.BookCharacterRelationships.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == relationshipId)
            ?? throw new KeyNotFoundException("Relationship not found.");
        ApplyRelationship(entity, dto);
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await LoadRelationshipDtoAsync(bookId, entity.ID);
    }

    public async Task DeleteRelationshipAsync(int bookId, int relationshipId, string authorId, bool isAdmin)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var entity = await _db.BookCharacterRelationships.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == relationshipId)
            ?? throw new KeyNotFoundException("Relationship not found.");
        _db.BookCharacterRelationships.Remove(entity);
        await _db.SaveChangesAsync();
    }

    public async Task<BookPlotThreadDto> CreatePlotThreadAsync(int bookId, string authorId, bool isAdmin, BookPlotThreadWriteDto dto)
    {
        var ownerId = await ResolveOwnerIdAsync(bookId, authorId, isAdmin);
        var entity = new BookPlotThread
        {
            AuthorId = ownerId,
            BookId = bookId,
            CreatedAt = DateTime.UtcNow,
        };
        ApplyPlotThread(entity, dto);
        _db.BookPlotThreads.Add(entity);
        await _db.SaveChangesAsync();
        return ToPlotThreadDto(entity);
    }

    public async Task<BookPlotThreadDto> UpdatePlotThreadAsync(int bookId, int threadId, string authorId, bool isAdmin, BookPlotThreadWriteDto dto)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var entity = await _db.BookPlotThreads.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == threadId)
            ?? throw new KeyNotFoundException("Plot thread not found.");
        ApplyPlotThread(entity, dto);
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToPlotThreadDto(entity);
    }

    public async Task DeletePlotThreadAsync(int bookId, int threadId, string authorId, bool isAdmin)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var entity = await _db.BookPlotThreads.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == threadId)
            ?? throw new KeyNotFoundException("Plot thread not found.");
        _db.BookPlotThreads.Remove(entity);
        await _db.SaveChangesAsync();
    }

    public async Task<BookTimelineEventDto> CreateTimelineEventAsync(int bookId, string authorId, bool isAdmin, BookTimelineEventWriteDto dto)
    {
        var ownerId = await ResolveOwnerIdAsync(bookId, authorId, isAdmin);
        await EnsureChapterBelongsToBookAsync(bookId, dto.ChapterId);
        var entity = new BookTimelineEvent
        {
            AuthorId = ownerId,
            BookId = bookId,
            CreatedAt = DateTime.UtcNow,
        };
        ApplyTimelineEvent(entity, dto);
        _db.BookTimelineEvents.Add(entity);
        await _db.SaveChangesAsync();
        return await LoadTimelineDtoAsync(bookId, entity.ID);
    }

    public async Task<BookTimelineEventDto> UpdateTimelineEventAsync(int bookId, int eventId, string authorId, bool isAdmin, BookTimelineEventWriteDto dto)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        await EnsureChapterBelongsToBookAsync(bookId, dto.ChapterId);
        var entity = await _db.BookTimelineEvents.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == eventId)
            ?? throw new KeyNotFoundException("Timeline event not found.");
        ApplyTimelineEvent(entity, dto);
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return await LoadTimelineDtoAsync(bookId, entity.ID);
    }

    public async Task DeleteTimelineEventAsync(int bookId, int eventId, string authorId, bool isAdmin)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var entity = await _db.BookTimelineEvents.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == eventId)
            ?? throw new KeyNotFoundException("Timeline event not found.");
        _db.BookTimelineEvents.Remove(entity);
        await _db.SaveChangesAsync();
    }

    public async Task<BookBibleAiQuoteDto> QuoteSuggestionsAsync(int bookId, string authorId, bool isAdmin, BookBibleAiQuoteRequestDto dto)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        await EnsureBookBibleCatalogAsync();
        var profile = await EnsureProfileAsync(bookId, authorId, isAdmin);
        var wordCount = await ResolveWordCountAsync(bookId, dto);
        if (wordCount > MaxWords)
        {
            throw new InvalidOperationException($"Book Bible Sync supports up to {MaxWords:N0} selected words in v1.");
        }

        return new BookBibleAiQuoteDto
        {
            PriceCredits = CalculatePrice(wordCount),
            WordCount = wordCount,
            MaxWords = MaxWords,
            NeedsScan = profile.NeedsScan,
        };
    }

    public async Task<BookBibleSuggestionRunDto> CreateSuggestionsAsync(int bookId, string authorId, bool isAdmin, BookBibleAiQuoteRequestDto dto)
    {
        var quote = await QuoteSuggestionsAsync(bookId, authorId, isAdmin, dto);
        var ownerId = await ResolveOwnerIdAsync(bookId, authorId, isAdmin);
        await SpendAuthorCreditsAsync(authorId, quote.PriceCredits);

        var snapshot = await GetSnapshotAsync(bookId, authorId, isAdmin);
        var chapters = await LoadSelectedChaptersAsync(bookId, dto.SelectedChapterIds);
        var sourceIds = string.Join(",", chapters.Select(item => item.ID));
        var suggestions = BuildMockSuggestions(bookId, ownerId, snapshot, chapters, dto, quote)
            .ToList();

        _db.BookBibleSuggestions.AddRange(suggestions);
        _db.AiServiceOrders.Add(new AiServiceOrder
        {
            UserId = authorId,
            ServiceKey = ServiceKey,
            BookId = bookId,
            PriceCredits = quote.PriceCredits,
            WordCount = quote.WordCount,
            Prompt = Clean(dto.Prompt),
            OutputPreview = suggestions.Count == 0 ? "No Book Bible suggestions created." : suggestions[0].Summary,
            Status = "completed",
            CreatedAt = DateTime.UtcNow,
        });

        var profile = await EnsureProfileAsync(bookId, authorId, isAdmin);
        profile.NeedsScan = false;
        profile.LastScannedAt = DateTime.UtcNow;
        profile.UpdatedAt = DateTime.UtcNow;

        foreach (var suggestion in suggestions)
        {
            suggestion.SourceChapterIds = sourceIds;
        }

        await _db.SaveChangesAsync();

        return new BookBibleSuggestionRunDto
        {
            Quote = quote,
            Suggestions = suggestions.Select(ToSuggestionDto).ToList(),
        };
    }

    public async Task<BookBibleSuggestionDto> AcceptSuggestionAsync(int bookId, int suggestionId, string authorId, bool isAdmin)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var suggestion = await _db.BookBibleSuggestions
            .FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == suggestionId)
            ?? throw new KeyNotFoundException("Suggestion not found.");

        if (suggestion.Status != "pending")
        {
            return ToSuggestionDto(suggestion);
        }

        await ApplySuggestionAsync(suggestion);
        suggestion.Status = "accepted";
        suggestion.DecidedAt = DateTime.UtcNow;
        suggestion.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToSuggestionDto(suggestion);
    }

    public async Task<BookBibleSuggestionDto> RejectSuggestionAsync(int bookId, int suggestionId, string authorId, bool isAdmin)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var suggestion = await _db.BookBibleSuggestions
            .FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == suggestionId)
            ?? throw new KeyNotFoundException("Suggestion not found.");

        if (suggestion.Status == "pending")
        {
            suggestion.Status = "rejected";
            suggestion.DecidedAt = DateTime.UtcNow;
            suggestion.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return ToSuggestionDto(suggestion);
    }

    public async Task MarkNeedsScanAsync(int bookId)
    {
        var book = await _db.Books.AsNoTracking().FirstOrDefaultAsync(item => item.ID == bookId);
        if (book == null) return;

        var authorId = book.AuthorId ?? "";
        var profile = await _db.BookBibleProfiles.FirstOrDefaultAsync(item => item.BookId == bookId);
        if (profile == null)
        {
            profile = new BookBibleProfile
            {
                AuthorId = authorId,
                BookId = bookId,
                CreatedAt = DateTime.UtcNow,
            };
            _db.BookBibleProfiles.Add(profile);
        }

        profile.NeedsScan = true;
        profile.LastChapterChangeAt = DateTime.UtcNow;
        profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private async Task ApplySuggestionAsync(BookBibleSuggestion suggestion)
    {
        using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(suggestion.PayloadJson) ? "{}" : suggestion.PayloadJson);
        var root = doc.RootElement;

        switch (suggestion.SuggestionType)
        {
            case "new_character":
                _db.BookCharacterProfiles.Add(new BookCharacterProfile
                {
                    AuthorId = suggestion.AuthorId,
                    BookId = suggestion.BookId,
                    Name = GetString(root, "name", "Unnamed character"),
                    Aliases = GetString(root, "aliases"),
                    Role = GetString(root, "role"),
                    Status = GetString(root, "status", "active"),
                    Appearance = GetString(root, "appearance"),
                    Motivation = GetString(root, "motivation"),
                    Fear = GetString(root, "fear"),
                    Goal = GetString(root, "goal"),
                    Secrets = GetString(root, "secrets"),
                    ArcNotes = GetString(root, "arcNotes"),
                    CreatedAt = DateTime.UtcNow,
                });
                break;
            case "update_character":
                await ApplyCharacterUpdateAsync(suggestion.BookId, root);
                break;
            case "new_world_entry":
                _db.BookWorldEntries.Add(new BookWorldEntry
                {
                    AuthorId = suggestion.AuthorId,
                    BookId = suggestion.BookId,
                    EntryType = GetString(root, "entryType", "rule"),
                    Name = GetString(root, "name", "World note"),
                    Summary = GetString(root, "summary"),
                    Details = GetString(root, "details"),
                    Tags = GetString(root, "tags"),
                    CreatedAt = DateTime.UtcNow,
                });
                break;
            case "update_world_entry":
                await ApplyWorldUpdateAsync(suggestion.BookId, root);
                break;
            case "new_plot_thread":
                _db.BookPlotThreads.Add(new BookPlotThread
                {
                    AuthorId = suggestion.AuthorId,
                    BookId = suggestion.BookId,
                    Title = GetString(root, "title", "Plot thread"),
                    Setup = GetString(root, "setup"),
                    Promise = GetString(root, "promise"),
                    Conflict = GetString(root, "conflict"),
                    Status = GetString(root, "status", "open"),
                    Payoff = GetString(root, "payoff"),
                    CreatedAt = DateTime.UtcNow,
                });
                break;
            case "new_timeline_event":
                var chapterId = GetInt(root, "chapterId");
                await EnsureChapterBelongsToBookAsync(suggestion.BookId, chapterId);
                _db.BookTimelineEvents.Add(new BookTimelineEvent
                {
                    AuthorId = suggestion.AuthorId,
                    BookId = suggestion.BookId,
                    ChapterId = chapterId,
                    Title = GetString(root, "title", "Timeline event"),
                    DateLabel = GetString(root, "dateLabel"),
                    Description = GetString(root, "description"),
                    OrderIndex = GetInt(root, "orderIndex") ?? await NextTimelineOrderAsync(suggestion.BookId),
                    CreatedAt = DateTime.UtcNow,
                });
                break;
            case "continuity_warning":
                break;
        }
    }

    private async Task ApplyCharacterUpdateAsync(int bookId, JsonElement root)
    {
        var id = GetInt(root, "id");
        if (id == null) return;
        var entity = await _db.BookCharacterProfiles.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == id.Value);
        if (entity == null) return;

        entity.ArcNotes = MergeText(entity.ArcNotes, GetString(root, "arcNotes"));
        entity.Motivation = PreferNew(entity.Motivation, GetString(root, "motivation"));
        entity.Goal = PreferNew(entity.Goal, GetString(root, "goal"));
        entity.UpdatedAt = DateTime.UtcNow;
    }

    private async Task ApplyWorldUpdateAsync(int bookId, JsonElement root)
    {
        var id = GetInt(root, "id");
        if (id == null) return;
        var entity = await _db.BookWorldEntries.FirstOrDefaultAsync(item => item.BookId == bookId && item.ID == id.Value);
        if (entity == null) return;

        entity.Summary = PreferNew(entity.Summary, GetString(root, "summary"));
        entity.Details = MergeText(entity.Details, GetString(root, "details"));
        entity.UpdatedAt = DateTime.UtcNow;
    }

    private IEnumerable<BookBibleSuggestion> BuildMockSuggestions(
        int bookId,
        string authorId,
        BookBibleSnapshotDto snapshot,
        List<Chapter> chapters,
        BookBibleAiQuoteRequestDto request,
        BookBibleAiQuoteDto quote)
    {
        var firstChapter = chapters.OrderBy(item => item.ChapterNumber).FirstOrDefault();
        var now = DateTime.UtcNow;

        if (!snapshot.Characters.Any())
        {
            yield return MakeSuggestion(bookId, authorId, "new_character", "Create a first main character", "Start the character bible with a protagonist slot the author can refine.", new
            {
                name = "Main character",
                role = "Protagonist",
                status = "active",
                motivation = "Define what they want most before the opening conflict hardens.",
                fear = "Add the fear that will pressure their choices.",
                goal = "Connect the first visible goal to the book promise.",
                arcNotes = firstChapter == null ? "Seed this from the opening chapter." : $"Seed this from chapter {firstChapter.ChapterNumber}: {firstChapter.Title}.",
            }, quote, now);
        }
        else
        {
            var character = snapshot.Characters.First();
            yield return MakeSuggestion(bookId, authorId, "update_character", $"Track {character.Name}'s current pressure", "Add a short progression note to the first character profile.", new
            {
                id = character.Id,
                arcNotes = firstChapter == null
                    ? "Add the latest emotional pressure after the next chapter."
                    : $"After chapter {firstChapter.ChapterNumber}, review how {character.Name}'s goal or pressure changed.",
            }, quote, now);
        }

        if (!snapshot.WorldEntries.Any())
        {
            yield return MakeSuggestion(bookId, authorId, "new_world_entry", "Add the first world rule", "Create a world entry for the main rule, location, or system readers must understand.", new
            {
                entryType = "rule",
                name = "Core world rule",
                summary = "Describe the rule that shapes the story's conflicts.",
                details = "Add limits, costs, exceptions, and who knows about it.",
                tags = "core,setup",
            }, quote, now);
        }
        else
        {
            var world = snapshot.WorldEntries.First();
            yield return MakeSuggestion(bookId, authorId, "update_world_entry", $"Refresh {world.Name}", "Add a continuity detail to an existing world entry.", new
            {
                id = world.Id,
                details = firstChapter == null
                    ? "Add the latest confirmed limitation or consequence."
                    : $"Check chapter {firstChapter.ChapterNumber} for a confirmed limitation, location detail, or cost.",
            }, quote, now);
        }

        if (!snapshot.PlotThreads.Any())
        {
            yield return MakeSuggestion(bookId, authorId, "new_plot_thread", "Create the opening plot thread", "Track the first promise/conflict so future chapters can pay it off cleanly.", new
            {
                title = firstChapter == null ? "Opening promise" : $"Opening promise from chapter {firstChapter.ChapterNumber}",
                setup = firstChapter == null ? "Define the first situation the story asks readers to care about." : firstChapter.Title,
                promise = "What question, desire, or danger should readers expect to follow?",
                conflict = "What blocks the character from resolving it immediately?",
                status = "open",
            }, quote, now);
        }

        if (firstChapter != null)
        {
            yield return MakeSuggestion(bookId, authorId, "new_timeline_event", $"Add chapter {firstChapter.ChapterNumber} to the timeline", "Save the selected chapter as a canon timeline event.", new
            {
                chapterId = firstChapter.ID,
                title = firstChapter.Title,
                orderIndex = firstChapter.ChapterNumber,
                dateLabel = $"Chapter {firstChapter.ChapterNumber}",
                description = $"Record the key canon event from chapter {firstChapter.ChapterNumber}.",
            }, quote, now);
        }

        yield return MakeSuggestion(bookId, authorId, "continuity_warning", "Continuity review note", "Review names, goals, rules, and timeline order before accepting new canon details.", new
        {
            prompt = request.Prompt ?? "",
            note = "This is advisory only; accepting it records the review decision without changing canon records.",
        }, quote, now);
    }

    private static BookBibleSuggestion MakeSuggestion(
        int bookId,
        string authorId,
        string type,
        string title,
        string summary,
        object payload,
        BookBibleAiQuoteDto quote,
        DateTime now)
    {
        return new BookBibleSuggestion
        {
            AuthorId = authorId,
            BookId = bookId,
            SuggestionType = type,
            Title = title,
            Summary = summary,
            PayloadJson = JsonSerializer.Serialize(payload),
            Status = "pending",
            PriceCredits = quote.PriceCredits,
            WordCount = quote.WordCount,
            CreatedAt = now,
        };
    }

    private async Task<string> ResolveOwnerIdAsync(int bookId, string authorId, bool isAdmin)
    {
        var book = await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        return string.IsNullOrWhiteSpace(book.AuthorId) ? authorId : book.AuthorId;
    }

    private async Task<Book> EnsureBookOwnerAsync(int bookId, string authorId, bool isAdmin)
    {
        var book = await _db.Books.FirstOrDefaultAsync(item => item.ID == bookId)
            ?? throw new KeyNotFoundException("Book not found.");

        if (!isAdmin && book.AuthorId != authorId)
        {
            throw new UnauthorizedAccessException("You are not allowed to use this book bible.");
        }

        return book;
    }

    private async Task<BookBibleProfile> EnsureProfileAsync(int bookId, string authorId, bool isAdmin)
    {
        var ownerId = await ResolveOwnerIdAsync(bookId, authorId, isAdmin);
        var profile = await _db.BookBibleProfiles.FirstOrDefaultAsync(item => item.BookId == bookId);
        if (profile != null) return profile;

        profile = new BookBibleProfile
        {
            AuthorId = ownerId,
            BookId = bookId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.BookBibleProfiles.Add(profile);
        await _db.SaveChangesAsync();
        return profile;
    }

    private async Task EnsureCharactersBelongToBookAsync(int bookId, int sourceId, int targetId)
    {
        if (sourceId <= 0 || targetId <= 0 || sourceId == targetId)
        {
            throw new InvalidOperationException("Choose two different characters.");
        }

        var count = await _db.BookCharacterProfiles
            .CountAsync(item => item.BookId == bookId && (item.ID == sourceId || item.ID == targetId));
        if (count != 2)
        {
            throw new InvalidOperationException("Both characters must belong to this book.");
        }
    }

    private async Task EnsureChapterBelongsToBookAsync(int bookId, int? chapterId)
    {
        if (chapterId == null) return;
        var exists = await _db.Chapters.AnyAsync(item => item.BookId == bookId && item.ID == chapterId.Value);
        if (!exists)
        {
            throw new InvalidOperationException("Selected chapter does not belong to this book.");
        }
    }

    private async Task<BookCharacterRelationshipDto> LoadRelationshipDtoAsync(int bookId, int relationshipId)
    {
        var relationship = await _db.BookCharacterRelationships
            .Include(item => item.SourceCharacter)
            .Include(item => item.TargetCharacter)
            .FirstAsync(item => item.BookId == bookId && item.ID == relationshipId);
        return ToRelationshipDto(relationship);
    }

    private async Task<BookTimelineEventDto> LoadTimelineDtoAsync(int bookId, int eventId)
    {
        var item = await _db.BookTimelineEvents
            .Include(entry => entry.Chapter)
            .FirstAsync(entry => entry.BookId == bookId && entry.ID == eventId);
        return ToTimelineDto(item);
    }

    private async Task<int> ResolveWordCountAsync(int bookId, BookBibleAiQuoteRequestDto dto)
    {
        var chapters = await LoadSelectedChaptersAsync(bookId, dto.SelectedChapterIds);
        var words = chapters.Sum(item => Math.Max(item.WordCount, CountWords(item.Content)));
        words += await CountBibleContextWordsAsync(bookId);
        words += CountWords(dto.Prompt);
        return words <= 0 ? 500 : words;
    }

    private async Task<List<Chapter>> LoadSelectedChaptersAsync(int bookId, List<int>? selectedChapterIds)
    {
        var selected = selectedChapterIds?.Distinct().ToList() ?? [];
        if (!selected.Any()) return [];

        return await _db.Chapters
            .Where(item => item.BookId == bookId && selected.Contains(item.ID))
            .OrderBy(item => item.ChapterNumber)
            .ToListAsync();
    }

    private async Task<int> CountBibleContextWordsAsync(int bookId)
    {
        var profile = await _db.BookBibleProfiles.AsNoTracking().FirstOrDefaultAsync(item => item.BookId == bookId);
        var world = await _db.BookWorldEntries.AsNoTracking().Where(item => item.BookId == bookId).ToListAsync();
        var characters = await _db.BookCharacterProfiles.AsNoTracking().Where(item => item.BookId == bookId).ToListAsync();
        var plot = await _db.BookPlotThreads.AsNoTracking().Where(item => item.BookId == bookId).ToListAsync();
        var timeline = await _db.BookTimelineEvents.AsNoTracking().Where(item => item.BookId == bookId).ToListAsync();

        var text = string.Join(" ", new[]
        {
            profile?.Premise,
            profile?.Themes,
            profile?.Tone,
            profile?.ReaderPromise,
            profile?.AuthorNotes,
            string.Join(" ", world.Select(item => $"{item.Name} {item.Summary} {item.Details}")),
            string.Join(" ", characters.Select(item => $"{item.Name} {item.Role} {item.Motivation} {item.Goal} {item.ArcNotes}")),
            string.Join(" ", plot.Select(item => $"{item.Title} {item.Setup} {item.Promise} {item.Conflict} {item.Payoff}")),
            string.Join(" ", timeline.Select(item => $"{item.Title} {item.Description}")),
        });

        return CountWords(text);
    }

    private async Task SpendAuthorCreditsAsync(string authorId, int price)
    {
        var balance = await _db.AuthorBalances.FirstOrDefaultAsync(item => item.AuthorId == authorId);
        if (balance == null)
        {
            balance = new AuthorBalance
            {
                AuthorId = authorId,
                CreatedAt = DateTime.UtcNow,
            };
            _db.AuthorBalances.Add(balance);
            await _db.SaveChangesAsync();
        }

        if (balance.AvailableCoins >= price)
        {
            balance.AvailableCoins -= price;
            balance.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return;
        }

        var remaining = price - balance.AvailableCoins;
        balance.AvailableCoins = 0;
        balance.UpdatedAt = DateTime.UtcNow;

        var wallet = await _db.WalletAccounts.FirstOrDefaultAsync(item => item.UserId == authorId);
        if (wallet == null)
        {
            wallet = new WalletAccount
            {
                UserId = authorId,
                CreatedAt = DateTime.UtcNow,
            };
            _db.WalletAccounts.Add(wallet);
            await _db.SaveChangesAsync();
        }

        if (wallet.CreditBalance + wallet.CoinBalance < remaining)
        {
            throw new InvalidOperationException("Not enough author credits or coins.");
        }

        var creditSpend = Math.Min(wallet.CreditBalance, remaining);
        wallet.CreditBalance -= creditSpend;
        remaining -= creditSpend;

        if (remaining > 0)
        {
            wallet.CoinBalance -= remaining;
            _db.CoinLedgerEntries.Add(new CoinLedgerEntry
            {
                UserId = authorId,
                AmountCoins = -remaining,
                BalanceAfterCoins = wallet.CoinBalance,
                EntryType = "author_ai_service",
                SourceType = ServiceKey,
                SourceId = ServiceKey,
                Description = "Author AI service: Book Bible Sync.",
                CreatedAt = DateTime.UtcNow,
            });
        }

        wallet.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private async Task EnsureBookBibleCatalogAsync()
    {
        var existing = await _db.AiServiceCatalog.FirstOrDefaultAsync(item => item.ServiceKey == ServiceKey);
        if (existing != null)
        {
            existing.Audience = "author";
            existing.Name = "Book Bible Sync";
            existing.BaseCredits = BaseCredits;
            existing.PerThousandWordsCredits = PerThousandWordsCredits;
            existing.PerHundredWordsCredits = 0;
            existing.MinimumCredits = 0;
            existing.MaxWords = MaxWords;
            existing.IsActive = true;
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return;
        }

        _db.AiServiceCatalog.Add(new AiServiceCatalog
        {
            ServiceKey = ServiceKey,
            Audience = "author",
            Name = "Book Bible Sync",
            BaseCredits = BaseCredits,
            PerThousandWordsCredits = PerThousandWordsCredits,
            MaxWords = MaxWords,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
    }

    private static int CalculatePrice(int wordCount)
    {
        return BaseCredits + Math.Max(1, (int)Math.Ceiling(wordCount / 1000m)) * PerThousandWordsCredits;
    }

    private async Task<int> NextTimelineOrderAsync(int bookId)
    {
        return (await _db.BookTimelineEvents
            .Where(item => item.BookId == bookId)
            .Select(item => (int?)item.OrderIndex)
            .MaxAsync() ?? 0) + 1;
    }

    private static void ApplyWorld(BookWorldEntry entity, BookWorldEntryWriteDto dto)
    {
        entity.EntryType = Clean(dto.EntryType, "location");
        entity.Name = Required(dto.Name, "World entry name is required.");
        entity.Summary = Clean(dto.Summary);
        entity.Details = Clean(dto.Details);
        entity.Tags = Clean(dto.Tags);
        entity.SortOrder = dto.SortOrder ?? entity.SortOrder;
    }

    private static void ApplyCharacter(BookCharacterProfile entity, BookCharacterProfileWriteDto dto)
    {
        entity.Name = Required(dto.Name, "Character name is required.");
        entity.Aliases = Clean(dto.Aliases);
        entity.Role = Clean(dto.Role);
        entity.Status = Clean(dto.Status, "active");
        entity.Appearance = Clean(dto.Appearance);
        entity.Motivation = Clean(dto.Motivation);
        entity.Fear = Clean(dto.Fear);
        entity.Goal = Clean(dto.Goal);
        entity.Secrets = Clean(dto.Secrets);
        entity.ArcNotes = Clean(dto.ArcNotes);
        entity.SortOrder = dto.SortOrder ?? entity.SortOrder;
    }

    private static void ApplyRelationship(BookCharacterRelationship entity, BookCharacterRelationshipWriteDto dto)
    {
        entity.SourceCharacterId = dto.SourceCharacterId;
        entity.TargetCharacterId = dto.TargetCharacterId;
        entity.RelationType = Clean(dto.RelationType);
        entity.Tension = Clean(dto.Tension);
        entity.Status = Clean(dto.Status, "active");
        entity.Notes = Clean(dto.Notes);
    }

    private static void ApplyPlotThread(BookPlotThread entity, BookPlotThreadWriteDto dto)
    {
        entity.Title = Required(dto.Title, "Plot thread title is required.");
        entity.Setup = Clean(dto.Setup);
        entity.Promise = Clean(dto.Promise);
        entity.Conflict = Clean(dto.Conflict);
        entity.Status = Clean(dto.Status, "open");
        entity.Payoff = Clean(dto.Payoff);
        entity.SortOrder = dto.SortOrder ?? entity.SortOrder;
    }

    private static void ApplyTimelineEvent(BookTimelineEvent entity, BookTimelineEventWriteDto dto)
    {
        entity.ChapterId = dto.ChapterId;
        entity.Title = Required(dto.Title, "Timeline event title is required.");
        entity.OrderIndex = dto.OrderIndex ?? entity.OrderIndex;
        entity.DateLabel = Clean(dto.DateLabel);
        entity.Description = Clean(dto.Description);
    }

    private static BookBibleCompletionDto BuildCompletion(BookBibleProfile profile, int worldCount, int characterCount, int plotCount, int timelineCount)
    {
        var hasPremise = !string.IsNullOrWhiteSpace(profile.Premise);
        var checks = new[] { hasPremise, worldCount > 0, characterCount > 0, plotCount > 0, timelineCount > 0 };
        return new BookBibleCompletionDto
        {
            HasPremise = hasPremise,
            HasWorld = worldCount > 0,
            HasCharacters = characterCount > 0,
            HasPlotThreads = plotCount > 0,
            HasTimeline = timelineCount > 0,
            NeedsScan = profile.NeedsScan,
            LastScannedAt = profile.LastScannedAt,
            LastChapterChangeAt = profile.LastChapterChangeAt,
            Percent = (int)Math.Round(checks.Count(item => item) / (double)checks.Length * 100),
        };
    }

    private static BookBibleProfileDto ToProfileDto(BookBibleProfile item) => new()
    {
        Id = item.ID,
        BookId = item.BookId,
        Premise = item.Premise,
        Themes = item.Themes,
        Tone = item.Tone,
        ReaderPromise = item.ReaderPromise,
        AuthorNotes = item.AuthorNotes,
        NeedsScan = item.NeedsScan,
        LastScannedAt = item.LastScannedAt,
        LastChapterChangeAt = item.LastChapterChangeAt,
        CreatedAt = item.CreatedAt,
        UpdatedAt = item.UpdatedAt,
    };

    private static BookWorldEntryDto ToWorldDto(BookWorldEntry item) => new()
    {
        Id = item.ID,
        BookId = item.BookId,
        EntryType = item.EntryType,
        Name = item.Name,
        Summary = item.Summary,
        Details = item.Details,
        Tags = item.Tags,
        SortOrder = item.SortOrder,
        CreatedAt = item.CreatedAt,
        UpdatedAt = item.UpdatedAt,
    };

    private static BookCharacterProfileDto ToCharacterDto(BookCharacterProfile item) => new()
    {
        Id = item.ID,
        BookId = item.BookId,
        Name = item.Name,
        Aliases = item.Aliases,
        Role = item.Role,
        Status = item.Status,
        Appearance = item.Appearance,
        Motivation = item.Motivation,
        Fear = item.Fear,
        Goal = item.Goal,
        Secrets = item.Secrets,
        ArcNotes = item.ArcNotes,
        SortOrder = item.SortOrder,
        CreatedAt = item.CreatedAt,
        UpdatedAt = item.UpdatedAt,
    };

    private static BookCharacterRelationshipDto ToRelationshipDto(BookCharacterRelationship item) => new()
    {
        Id = item.ID,
        BookId = item.BookId,
        SourceCharacterId = item.SourceCharacterId,
        SourceCharacterName = item.SourceCharacter?.Name ?? "",
        TargetCharacterId = item.TargetCharacterId,
        TargetCharacterName = item.TargetCharacter?.Name ?? "",
        RelationType = item.RelationType,
        Tension = item.Tension,
        Status = item.Status,
        Notes = item.Notes,
        CreatedAt = item.CreatedAt,
        UpdatedAt = item.UpdatedAt,
    };

    private static BookPlotThreadDto ToPlotThreadDto(BookPlotThread item) => new()
    {
        Id = item.ID,
        BookId = item.BookId,
        Title = item.Title,
        Setup = item.Setup,
        Promise = item.Promise,
        Conflict = item.Conflict,
        Status = item.Status,
        Payoff = item.Payoff,
        SortOrder = item.SortOrder,
        CreatedAt = item.CreatedAt,
        UpdatedAt = item.UpdatedAt,
    };

    private static BookTimelineEventDto ToTimelineDto(BookTimelineEvent item) => new()
    {
        Id = item.ID,
        BookId = item.BookId,
        ChapterId = item.ChapterId,
        ChapterTitle = item.Chapter?.Title,
        Title = item.Title,
        OrderIndex = item.OrderIndex,
        DateLabel = item.DateLabel,
        Description = item.Description,
        CreatedAt = item.CreatedAt,
        UpdatedAt = item.UpdatedAt,
    };

    private static BookBibleSuggestionDto ToSuggestionDto(BookBibleSuggestion item) => new()
    {
        Id = item.ID,
        BookId = item.BookId,
        SuggestionType = item.SuggestionType,
        Title = item.Title,
        Summary = item.Summary,
        PayloadJson = item.PayloadJson,
        Status = item.Status,
        SourceChapterIds = item.SourceChapterIds,
        WordCount = item.WordCount,
        PriceCredits = item.PriceCredits,
        DecidedAt = item.DecidedAt,
        CreatedAt = item.CreatedAt,
    };

    private static string Required(string? value, string message)
    {
        var clean = Clean(value);
        if (string.IsNullOrWhiteSpace(clean))
        {
            throw new InvalidOperationException(message);
        }
        return clean;
    }

    private static string Clean(string? value, string fallback = "") => string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    private static int CountWords(string? value) => string.IsNullOrWhiteSpace(value) ? 0 : StripHtml(value).Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
    private static string PreferNew(string current, string next) => string.IsNullOrWhiteSpace(next) ? current : next;
    private static string MergeText(string current, string next) => string.IsNullOrWhiteSpace(next) ? current : string.IsNullOrWhiteSpace(current) ? next : $"{current}\n\n{next}";

    private static string GetString(JsonElement root, string property, string fallback = "")
    {
        return root.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
            ? Clean(value.GetString(), fallback)
            : fallback;
    }

    private static int? GetInt(JsonElement root, string property)
    {
        if (!root.TryGetProperty(property, out var value)) return null;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt32(out var number)) return number;
        if (value.ValueKind == JsonValueKind.String && int.TryParse(value.GetString(), out var parsed)) return parsed;
        return null;
    }

    private static string StripHtml(string value)
    {
        var chars = new List<char>(value.Length);
        var insideTag = false;
        foreach (var character in value)
        {
            if (character == '<')
            {
                insideTag = true;
                continue;
            }
            if (character == '>')
            {
                insideTag = false;
                chars.Add(' ');
                continue;
            }
            if (!insideTag) chars.Add(character);
        }

        return new string(chars.ToArray()).Replace("&nbsp;", " ");
    }
}
