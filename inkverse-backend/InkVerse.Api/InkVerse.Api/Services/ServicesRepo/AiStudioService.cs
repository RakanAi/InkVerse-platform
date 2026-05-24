using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Monetization;
using InkVerse.Api.Entities.Monetization;
using InkVerse.Api.Services.InterFace;
using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Services.ServicesRepo;

public class AiStudioService : IAiStudioService
{
    private readonly InkVerseDB _db;

    public AiStudioService(InkVerseDB db)
    {
        _db = db;
    }

    public async Task<BookAiApprovalDto> GetBookAiApprovalAsync(int bookId)
    {
        var approval = await EnsureBookAiApprovalAsync(bookId);
        return ToApprovalDto(approval);
    }

    public async Task<BookAiApprovalDto> UpdateBookAiApprovalAsync(int bookId, string adminId, UpdateBookAiApprovalDto dto)
    {
        var approval = await EnsureBookAiApprovalAsync(bookId);
        approval.TranslationEnabled = dto.TranslationEnabled;
        approval.TtsEnabled = dto.TtsEnabled;
        approval.ApprovedById = adminId;
        approval.ApprovedAt = DateTime.UtcNow;
        approval.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ToApprovalDto(approval);
    }

    public async Task<AiQuoteDto> QuoteAsync(string userId, AiQuoteRequestDto dto)
    {
        await EnsureCatalogAsync();
        var catalog = await GetCatalogAsync(dto.ServiceKey);
        var wordCount = await ResolveWordCountAsync(userId, catalog, dto);
        var cached = await FindCachedArtifactAsync(catalog.ServiceKey, dto.ChapterId, dto.Language) != null;
        var price = CalculatePrice(catalog, wordCount);

        return new AiQuoteDto
        {
            ServiceKey = catalog.ServiceKey,
            Name = catalog.Name,
            PriceCredits = price,
            WordCount = wordCount,
            MaxWords = catalog.MaxWords,
            IsCached = cached,
            CurrencyLabel = catalog.Audience == "reader" ? "coins" : "credits",
        };
    }

    public async Task<AiOrderDto> CreateOrderAsync(string userId, AiOrderRequestDto dto)
    {
        await EnsureCatalogAsync();
        var catalog = await GetCatalogAsync(dto.ServiceKey);
        var quote = await QuoteAsync(userId, dto);

        if (catalog.Audience == "reader")
        {
            await SpendReaderCoinsAsync(userId, quote.PriceCredits, catalog.ServiceKey, dto.ChapterId?.ToString() ?? dto.BookId.ToString());
            var artifact = await FindCachedArtifactAsync(catalog.ServiceKey, dto.ChapterId, dto.Language);
            if (artifact == null)
            {
                artifact = await CreateReaderArtifactAsync(userId, catalog, dto, quote.WordCount);
            }

            var order = new AiServiceOrder
            {
                UserId = userId,
                ServiceKey = catalog.ServiceKey,
                BookId = dto.BookId,
                ChapterId = dto.ChapterId,
                AiArtifactId = artifact.ID,
                PriceCredits = quote.PriceCredits,
                WordCount = quote.WordCount,
                Prompt = dto.Prompt ?? "",
                OutputPreview = artifact.Content.Length > 220 ? artifact.Content[..220] : artifact.Content,
                CreatedAt = DateTime.UtcNow,
            };
            _db.AiServiceOrders.Add(order);
            await _db.SaveChangesAsync();
            return ToOrderDto(order, artifact, null);
        }

        await SpendAuthorCreditsAsync(userId, quote.PriceCredits, catalog.ServiceKey);
        var note = await CreateStoryStudioNotebookEntryAsync(userId, catalog, dto, quote.WordCount);
        var authorOrder = new AiServiceOrder
        {
            UserId = userId,
            ServiceKey = catalog.ServiceKey,
            BookId = dto.BookId,
            NotebookEntryId = note.ID,
            PriceCredits = quote.PriceCredits,
            WordCount = quote.WordCount,
            Prompt = dto.Prompt ?? "",
            OutputPreview = note.Content.Length > 220 ? note.Content[..220] : note.Content,
            CreatedAt = DateTime.UtcNow,
        };
        _db.AiServiceOrders.Add(authorOrder);
        await _db.SaveChangesAsync();

        return ToOrderDto(authorOrder, null, note);
    }

    public async Task<IReadOnlyList<BookNotebookEntryDto>> GetNotebookAsync(int bookId, string authorId, bool isAdmin)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        return await _db.BookNotebookEntries
            .Where(item => item.BookId == bookId && (isAdmin || item.AuthorId == authorId))
            .OrderByDescending(item => item.CreatedAt)
            .Take(120)
            .Select(item => new BookNotebookEntryDto
            {
                Id = item.ID,
                BookId = item.BookId,
                EntryType = item.EntryType,
                Title = item.Title,
                Content = item.Content,
                RelatedChapterId = item.RelatedChapterId,
                CreatedAt = item.CreatedAt,
            })
            .ToListAsync();
    }

    public async Task<BookNotebookEntryDto> CreateNotebookEntryAsync(int bookId, string authorId, bool isAdmin, CreateNotebookEntryDto dto)
    {
        await EnsureBookOwnerAsync(bookId, authorId, isAdmin);
        var entry = new BookNotebookEntry
        {
            AuthorId = authorId,
            BookId = bookId,
            EntryType = string.IsNullOrWhiteSpace(dto.EntryType) ? "note" : dto.EntryType.Trim(),
            Title = string.IsNullOrWhiteSpace(dto.Title) ? "Untitled note" : dto.Title.Trim(),
            Content = dto.Content?.Trim() ?? "",
            RelatedChapterId = dto.RelatedChapterId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.BookNotebookEntries.Add(entry);
        await _db.SaveChangesAsync();
        return ToNotebookDto(entry);
    }

    public async Task<ProofreadingDraftDto> CreateProofreadingDraftAsync(string authorId, ProofreadingOrderRequestDto dto)
    {
        await EnsureCatalogAsync();
        var chapter = await _db.Chapters
            .Include(item => item.Book)
            .FirstOrDefaultAsync(item => item.ID == dto.ChapterId);

        if (chapter == null)
        {
            throw new InvalidOperationException("Chapter not found.");
        }

        if (chapter.Book?.AuthorId != authorId)
        {
            throw new UnauthorizedAccessException("You are not allowed to proofread this chapter.");
        }

        var catalog = await GetCatalogAsync("proofreading");
        var wordCount = CountWords(chapter.Content);
        var price = CalculatePrice(catalog, wordCount);
        await SpendAuthorCreditsAsync(authorId, price, "proofreading");

        var revised = BuildProofreadText(chapter.Content);
        var draft = new ProofreadingDraft
        {
            AuthorId = authorId,
            BookId = chapter.BookId,
            ChapterId = chapter.ID,
            OriginalContent = chapter.Content,
            RevisedContent = revised,
            PriceCredits = price,
            CreatedAt = DateTime.UtcNow,
        };
        _db.ProofreadingDrafts.Add(draft);
        await _db.SaveChangesAsync();

        return new ProofreadingDraftDto
        {
            Id = draft.ID,
            BookId = draft.BookId,
            ChapterId = draft.ChapterId,
            RevisedContent = draft.RevisedContent,
            PriceCredits = draft.PriceCredits,
            CreatedAt = draft.CreatedAt,
        };
    }

    private async Task<int> ResolveWordCountAsync(string userId, AiServiceCatalog catalog, AiQuoteRequestDto dto)
    {
        if (catalog.Audience == "reader")
        {
            if (dto.ChapterId == null)
            {
                throw new InvalidOperationException("Reader AI services require a chapter.");
            }

            var chapter = await _db.Chapters
                .Include(item => item.Book)
                .FirstOrDefaultAsync(item => item.ID == dto.ChapterId.Value && item.BookId == dto.BookId);

            if (chapter == null)
            {
                throw new InvalidOperationException("Chapter not found.");
            }

            var approval = await EnsureBookAiApprovalAsync(dto.BookId);
            if (catalog.ServiceKey == "translation" && !approval.TranslationEnabled)
            {
                throw new InvalidOperationException("Translation is not approved for this book.");
            }
            if (catalog.ServiceKey == "tts" && !approval.TtsEnabled)
            {
                throw new InvalidOperationException("TTS is not approved for this book.");
            }

            var isPaid = await _db.ChapterMonetizations.AnyAsync(item => item.ChapterId == chapter.ID && item.IsPaid);
            if (isPaid)
            {
                var hasUnlock = await _db.ChapterUnlocks.AnyAsync(item => item.ChapterId == chapter.ID && item.UserId == userId);
                if (!hasUnlock)
                {
                    throw new InvalidOperationException("Unlock the chapter before buying AI services for it.");
                }
            }

            return Math.Max(chapter.WordCount, CountWords(chapter.Content));
        }

        await EnsureBookOwnerAsync(dto.BookId, userId, false);
        var selected = dto.SelectedChapterIds?.Distinct().ToList() ?? [];
        if (!selected.Any() && dto.ChapterId != null)
        {
            selected.Add(dto.ChapterId.Value);
        }

        var chapters = await _db.Chapters
            .Where(item => item.BookId == dto.BookId && (selected.Count == 0 || selected.Contains(item.ID)))
            .OrderBy(item => item.ChapterNumber)
            .Take(80)
            .ToListAsync();

        var words = chapters.Sum(item => Math.Max(item.WordCount, CountWords(item.Content)));
        words += CountWords(dto.DraftContent);
        words += CountWords(dto.Prompt);
        if (words <= 0) words = 500;

        if (catalog.MaxWords > 0 && words > catalog.MaxWords)
        {
            throw new InvalidOperationException($"{catalog.Name} supports up to {catalog.MaxWords:N0} selected words in v1.");
        }

        return words;
    }

    private async Task<AiArtifact?> FindCachedArtifactAsync(string serviceKey, int? chapterId, string? language)
    {
        if (chapterId == null) return null;
        var normalizedLanguage = NormalizeLanguage(language);
        return await _db.AiArtifacts
            .Where(item =>
                item.ServiceKey == serviceKey &&
                item.ChapterId == chapterId.Value &&
                item.Language == normalizedLanguage)
            .OrderByDescending(item => item.CreatedAt)
            .FirstOrDefaultAsync();
    }

    private async Task<AiArtifact> CreateReaderArtifactAsync(string userId, AiServiceCatalog catalog, AiOrderRequestDto dto, int wordCount)
    {
        var chapter = await _db.Chapters.FirstAsync(item => item.ID == dto.ChapterId!.Value);
        var language = NormalizeLanguage(dto.Language);
        var content = catalog.ServiceKey == "tts"
            ? $"Mock TTS audio artifact for chapter {chapter.ChapterNumber}. A production provider will replace this text with an audio URL or stored audio object."
            : $"Mock {language.ToUpperInvariant()} translation for chapter {chapter.ChapterNumber}.\n\n{StripHtml(chapter.Content)}";

        var artifact = new AiArtifact
        {
            ServiceKey = catalog.ServiceKey,
            BookId = dto.BookId,
            ChapterId = chapter.ID,
            Language = language,
            MimeType = catalog.ServiceKey == "tts" ? "text/plain+mock-audio" : "text/plain",
            Content = content,
            WordCount = wordCount,
            CreatedByUserId = userId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.AiArtifacts.Add(artifact);
        await _db.SaveChangesAsync();
        return artifact;
    }

    private async Task<BookNotebookEntry> CreateStoryStudioNotebookEntryAsync(string authorId, AiServiceCatalog catalog, AiOrderRequestDto dto, int wordCount)
    {
        var book = await _db.Books.FirstAsync(item => item.ID == dto.BookId);
        var title = $"{catalog.Name} - {DateTime.UtcNow:yyyy-MM-dd HH:mm}";
        var draftTitle = string.IsNullOrWhiteSpace(dto.DraftTitle) ? "Untitled draft" : dto.DraftTitle.Trim();
        var draftWordCount = CountWords(dto.DraftContent);
        var prompt = string.IsNullOrWhiteSpace(dto.Prompt) ? "No extra author question." : dto.Prompt.Trim();
        var contextLine = draftWordCount > 0
            ? $"Draft context: {draftTitle} ({draftWordCount:N0} words from the chapter editor)."
            : $"Selected saved context: {wordCount:N0} words.";
        var draftExcerpt = BuildContextExcerpt(dto.DraftContent);
        var contextBlock = string.IsNullOrWhiteSpace(draftExcerpt)
            ? contextLine
            : $"{contextLine}\n\nDraft excerpt:\n{draftExcerpt}";
        var output = catalog.ServiceKey switch
        {
            "plot-planner" => $"Plot plan for {book.Title}: define the current promise, escalation, midpoint reversal, crisis, and payoff.\n\n{contextBlock}\n\nAuthor question: {prompt}",
            "next-plot" => $"Next plot suggestions for {book.Title}: add one short-term complication, one character choice with consequences, and one reveal that recontextualizes the current draft.\n\n{contextBlock}\n\nAuthor question: {prompt}",
            "character-analysis" => $"Character analysis for {book.Title}: map motivation, fear, contradiction, relationship pressure, and likely breaking point.\n\n{contextBlock}\n\nAuthor question: {prompt}",
            "continuity-check" => $"Continuity check for {book.Title}: review timeline, names, power rules, emotional state, promises, and unresolved setup.\n\n{contextBlock}\n\nAuthor question: {prompt}",
            "worldbuilding-notes" => $"Worldbuilding notes for {book.Title}: summarize rules, factions, costs, locations, cultural texture, and contradictions to resolve.\n\n{contextBlock}\n\nAuthor question: {prompt}",
            _ => $"{catalog.Name} result for {book.Title}.\n\n{contextBlock}\n\nAuthor question: {prompt}",
        };

        var note = new BookNotebookEntry
        {
            AuthorId = authorId,
            BookId = dto.BookId,
            EntryType = catalog.ServiceKey,
            Title = title,
            Content = output,
            RelatedChapterId = dto.ChapterId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.BookNotebookEntries.Add(note);
        await _db.SaveChangesAsync();
        return note;
    }

    private async Task SpendReaderCoinsAsync(string userId, int price, string serviceKey, string sourceId)
    {
        var wallet = await EnsureWalletAsync(userId);
        if (wallet.CoinBalance < price)
        {
            throw new InvalidOperationException("Not enough coins.");
        }

        wallet.CoinBalance -= price;
        wallet.UpdatedAt = DateTime.UtcNow;
        _db.CoinLedgerEntries.Add(new CoinLedgerEntry
        {
            UserId = userId,
            AmountCoins = -price,
            BalanceAfterCoins = wallet.CoinBalance,
            EntryType = "ai_service",
            SourceType = serviceKey,
            SourceId = sourceId,
            Description = $"AI service: {serviceKey}.",
            CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
    }

    private async Task SpendAuthorCreditsAsync(string authorId, int price, string serviceKey)
    {
        var balance = await EnsureAuthorBalanceAsync(authorId);
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

        var wallet = await EnsureWalletAsync(authorId);
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
                SourceType = serviceKey,
                SourceId = serviceKey,
                Description = $"Author AI service: {serviceKey}.",
                CreatedAt = DateTime.UtcNow,
            });
        }

        wallet.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private async Task EnsureBookOwnerAsync(int bookId, string userId, bool isAdmin)
    {
        if (isAdmin) return;
        var ownsBook = await _db.Books.AnyAsync(item => item.ID == bookId && item.AuthorId == userId);
        if (!ownsBook)
        {
            throw new UnauthorizedAccessException("You are not allowed to use this book.");
        }
    }

    private async Task<WalletAccount> EnsureWalletAsync(string userId)
    {
        var wallet = await _db.WalletAccounts.FirstOrDefaultAsync(item => item.UserId == userId);
        if (wallet != null) return wallet;

        wallet = new WalletAccount
        {
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.WalletAccounts.Add(wallet);
        await _db.SaveChangesAsync();
        return wallet;
    }

    private async Task<AuthorBalance> EnsureAuthorBalanceAsync(string authorId)
    {
        var balance = await _db.AuthorBalances.FirstOrDefaultAsync(item => item.AuthorId == authorId);
        if (balance != null) return balance;

        balance = new AuthorBalance
        {
            AuthorId = authorId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.AuthorBalances.Add(balance);
        await _db.SaveChangesAsync();
        return balance;
    }

    private async Task<BookAiApproval> EnsureBookAiApprovalAsync(int bookId)
    {
        var approval = await _db.BookAiApprovals.FirstOrDefaultAsync(item => item.BookId == bookId);
        if (approval != null) return approval;

        approval = new BookAiApproval
        {
            BookId = bookId,
            CreatedAt = DateTime.UtcNow,
        };
        _db.BookAiApprovals.Add(approval);
        await _db.SaveChangesAsync();
        return approval;
    }

    private async Task<AiServiceCatalog> GetCatalogAsync(string serviceKey)
    {
        var normalized = NormalizeServiceKey(serviceKey);
        var catalog = await _db.AiServiceCatalog.FirstOrDefaultAsync(item => item.ServiceKey == normalized && item.IsActive);
        return catalog ?? throw new InvalidOperationException("Unknown AI service.");
    }

    private async Task EnsureCatalogAsync()
    {
        var defaults = new[]
        {
            new AiServiceCatalog { ServiceKey = "translation", Audience = "reader", Name = "AI Translation", PerHundredWordsCredits = 1, MinimumCredits = 5 },
            new AiServiceCatalog { ServiceKey = "tts", Audience = "reader", Name = "AI TTS", PerHundredWordsCredits = 2, MinimumCredits = 10 },
            new AiServiceCatalog { ServiceKey = "plot-planner", Audience = "author", Name = "Plot Planner", BaseCredits = 25, PerThousandWordsCredits = 2, MaxWords = 20000 },
            new AiServiceCatalog { ServiceKey = "next-plot", Audience = "author", Name = "Next Plot Suggestions", BaseCredits = 15, PerThousandWordsCredits = 2, MaxWords = 12000 },
            new AiServiceCatalog { ServiceKey = "character-analysis", Audience = "author", Name = "Character Analysis", BaseCredits = 20, PerThousandWordsCredits = 2, MaxWords = 15000 },
            new AiServiceCatalog { ServiceKey = "continuity-check", Audience = "author", Name = "Continuity Checker", BaseCredits = 30, PerThousandWordsCredits = 3, MaxWords = 25000 },
            new AiServiceCatalog { ServiceKey = "worldbuilding-notes", Audience = "author", Name = "Worldbuilding Notes", BaseCredits = 20, PerThousandWordsCredits = 2, MaxWords = 15000 },
            new AiServiceCatalog { ServiceKey = "book-bible-sync", Audience = "author", Name = "Book Bible Sync", BaseCredits = 20, PerThousandWordsCredits = 2, MaxWords = 15000 },
            new AiServiceCatalog { ServiceKey = "proofreading", Audience = "author", Name = "Proofreading", PerHundredWordsCredits = 1, MinimumCredits = 5 },
        };

        foreach (var item in defaults)
        {
            var existing = await _db.AiServiceCatalog.FirstOrDefaultAsync(catalog => catalog.ServiceKey == item.ServiceKey);
            if (existing != null) continue;
            item.CreatedAt = DateTime.UtcNow;
            _db.AiServiceCatalog.Add(item);
        }

        await _db.SaveChangesAsync();
    }

    private static int CalculatePrice(AiServiceCatalog catalog, int wordCount)
    {
        var price = catalog.BaseCredits;
        if (catalog.PerHundredWordsCredits > 0)
        {
            price += Math.Max(1, (int)Math.Ceiling(wordCount / 100m)) * catalog.PerHundredWordsCredits;
        }
        if (catalog.PerThousandWordsCredits > 0)
        {
            price += Math.Max(1, (int)Math.Ceiling(wordCount / 1000m)) * catalog.PerThousandWordsCredits;
        }
        return Math.Max(catalog.MinimumCredits, price);
    }

    private static BookAiApprovalDto ToApprovalDto(BookAiApproval approval) => new()
    {
        BookId = approval.BookId,
        TranslationEnabled = approval.TranslationEnabled,
        TtsEnabled = approval.TtsEnabled,
    };

    private static AiOrderDto ToOrderDto(AiServiceOrder order, AiArtifact? artifact, BookNotebookEntry? note) => new()
    {
        Id = order.ID,
        ServiceKey = order.ServiceKey,
        PriceCredits = order.PriceCredits,
        WordCount = order.WordCount,
        Status = order.Status,
        Artifact = artifact == null ? null : ToArtifactDto(artifact),
        NotebookEntry = note == null ? null : ToNotebookDto(note),
        OutputPreview = order.OutputPreview,
    };

    private static AiArtifactDto ToArtifactDto(AiArtifact artifact) => new()
    {
        Id = artifact.ID,
        ServiceKey = artifact.ServiceKey,
        BookId = artifact.BookId,
        ChapterId = artifact.ChapterId,
        Language = artifact.Language,
        MimeType = artifact.MimeType,
        Content = artifact.Content,
        WordCount = artifact.WordCount,
        CreatedAt = artifact.CreatedAt,
    };

    private static BookNotebookEntryDto ToNotebookDto(BookNotebookEntry entry) => new()
    {
        Id = entry.ID,
        BookId = entry.BookId,
        EntryType = entry.EntryType,
        Title = entry.Title,
        Content = entry.Content,
        RelatedChapterId = entry.RelatedChapterId,
        CreatedAt = entry.CreatedAt,
    };

    private static string NormalizeServiceKey(string value) => (value ?? "").Trim().ToLowerInvariant();
    private static string NormalizeLanguage(string? value) => string.IsNullOrWhiteSpace(value) ? "en" : value.Trim().ToLowerInvariant();
    private static int CountWords(string? value) => string.IsNullOrWhiteSpace(value) ? 0 : StripHtml(value).Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;

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

    private static string BuildContextExcerpt(string? value)
    {
        var plain = StripHtml(value ?? "").Trim();
        if (string.IsNullOrWhiteSpace(plain)) return "";

        plain = string.Join(" ", plain.Split([' ', '\r', '\n', '\t'], StringSplitOptions.RemoveEmptyEntries));
        return plain.Length <= 600 ? plain : $"{plain[..600]}...";
    }

    private static string BuildProofreadText(string content)
    {
        var plain = StripHtml(content).Trim();
        if (string.IsNullOrWhiteSpace(plain)) return "";
        return plain
            .Replace("  ", " ")
            .Replace(" .", ".")
            .Replace(" ,", ",")
            .Trim();
    }
}
