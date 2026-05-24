using InkVerse.Api.Data;
using InkVerse.Api.DTOs.Book;
using InkVerse.Api.DTOs.Characters;
using InkVerse.Api.DTOs.Common;
using InkVerse.Api.Entities.CharacterBank;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InkVerse.Api.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/characters")]
    [Authorize(Roles = "Admin")]
    public class AdminCharactersController : ControllerBase
    {
        private readonly InkVerseDB _db;

        public AdminCharactersController(InkVerseDB db)
        {
            _db = db;
        }

        [HttpGet("worlds")]
        public async Task<ActionResult<List<CharacterWorldDto>>> GetWorlds(
            [FromQuery] bool includeInactive = true)
        {
            var query = _db.CharacterWorlds.AsNoTracking().AsQueryable();

            if (!includeInactive)
            {
                query = query.Where(world => world.IsActive);
            }

            var items = await query
                .OrderBy(world => world.SortOrder)
                .ThenBy(world => world.Name)
                .Select(world => MapWorld(world))
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost("worlds")]
        public async Task<ActionResult<CharacterWorldDto>> CreateWorld([FromBody] CharacterWorldCreateDto dto)
        {
            try
            {
                var entity = await BuildWorldEntityAsync(dto);
                _db.CharacterWorlds.Add(entity);
                await _db.SaveChangesAsync();

                return Ok(MapWorld(entity));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPut("worlds/{id:int}")]
        public async Task<ActionResult<CharacterWorldDto>> UpdateWorld(int id, [FromBody] CharacterWorldUpdateDto dto)
        {
            var entity = await _db.CharacterWorlds.FirstOrDefaultAsync(world => world.ID == id);
            if (entity == null) return NotFound();

            try
            {
                await ApplyWorldFieldsAsync(entity, dto);
                entity.UpdatedAt = DateTime.UtcNow;
                await SyncWorldNameToCharactersAsync(entity);
                await _db.SaveChangesAsync();

                return Ok(MapWorld(entity));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpDelete("worlds/{id:int}")]
        public async Task<IActionResult> DeleteWorld(int id)
        {
            var world = await _db.CharacterWorlds
                .Include(item => item.Characters)
                .ThenInclude(character => character.BookCharacters)
                .FirstOrDefaultAsync(item => item.ID == id);

            if (world == null) return NotFound();

            var links = world.Characters
                .SelectMany(character => character.BookCharacters)
                .ToList();

            _db.BookCharacters.RemoveRange(links);
            _db.CharacterTemplates.RemoveRange(world.Characters);
            _db.CharacterWorlds.Remove(world);
            await _db.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet]
        public async Task<ActionResult<List<CharacterDto>>> GetAll(
            [FromQuery] bool includeInactive = true,
            [FromQuery] int? worldId = null)
        {
            var query = _db.CharacterTemplates
                .AsNoTracking()
                .Include(character => character.CharacterWorld)
                .AsQueryable();

            if (!includeInactive)
            {
                query = query.Where(character => character.IsActive);
            }

            if (worldId.HasValue)
            {
                query = query.Where(character => character.CharacterWorldId == worldId.Value);
            }

            var items = await query
                .OrderBy(character => character.SortOrder)
                .ThenBy(character => character.Name)
                .Select(character => MapCharacter(character))
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CharacterDto>> GetById(int id)
        {
            var item = await _db.CharacterTemplates
                .AsNoTracking()
                .Include(character => character.CharacterWorld)
                .Where(character => character.ID == id)
                .Select(character => MapCharacter(character))
                .FirstOrDefaultAsync();

            if (item == null) return NotFound();
            return Ok(item);
        }

        [HttpPost]
        public async Task<ActionResult<CharacterDto>> Create([FromBody] CharacterCreateDto dto)
        {
            try
            {
                var entity = await BuildCharacterEntityAsync(dto);
                _db.CharacterTemplates.Add(entity);
                await _db.SaveChangesAsync();

                entity.CharacterWorld = await _db.CharacterWorlds
                    .AsNoTracking()
                    .FirstOrDefaultAsync(world => world.ID == entity.CharacterWorldId);

                return Ok(MapCharacter(entity));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<CharacterDto>> Update(int id, [FromBody] CharacterUpdateDto dto)
        {
            var entity = await _db.CharacterTemplates
                .Include(character => character.CharacterWorld)
                .FirstOrDefaultAsync(character => character.ID == id);
            if (entity == null) return NotFound();

            try
            {
                await ApplyCharacterFieldsAsync(entity, dto);
                entity.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();

                return Ok(MapCharacter(entity));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _db.CharacterTemplates
                .Include(character => character.BookCharacters)
                .FirstOrDefaultAsync(character => character.ID == id);

            if (entity == null) return NotFound();

            _db.BookCharacters.RemoveRange(entity.BookCharacters);
            _db.CharacterTemplates.Remove(entity);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{characterId:int}/books")]
        public async Task<IActionResult> AddBook(int characterId, [FromBody] BookLinkDto dto)
        {
            if (dto.BookId <= 0) return BadRequest("BookId is required.");

            var characterExists = await _db.CharacterTemplates.AnyAsync(character => character.ID == characterId);
            var bookExists = await _db.Books.AnyAsync(book => book.ID == dto.BookId);

            if (!characterExists || !bookExists)
            {
                return NotFound("Character or Book not found.");
            }

            var alreadyLinked = await _db.BookCharacters.AnyAsync(link =>
                link.CharacterTemplateId == characterId && link.BookId == dto.BookId);

            if (!alreadyLinked)
            {
                _db.BookCharacters.Add(new BookCharacter
                {
                    CharacterTemplateId = characterId,
                    BookId = dto.BookId,
                    AddedAt = DateTime.UtcNow,
                });
                await _db.SaveChangesAsync();
            }

            return Ok();
        }

        [HttpDelete("{characterId:int}/books/{bookId:int}")]
        public async Task<IActionResult> RemoveBook(int characterId, int bookId)
        {
            var link = await _db.BookCharacters.FirstOrDefaultAsync(item =>
                item.CharacterTemplateId == characterId && item.BookId == bookId);

            if (link == null) return NotFound();

            _db.BookCharacters.Remove(link);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("{characterId:int}/book-ids")]
        public async Task<ActionResult<List<int>>> GetBookIds(int characterId)
        {
            var ids = await _db.BookCharacters
                .AsNoTracking()
                .Where(link => link.CharacterTemplateId == characterId)
                .Select(link => link.BookId)
                .ToListAsync();

            return Ok(ids);
        }

        [HttpGet("{characterId:int}/books")]
        public async Task<ActionResult<List<BookReadDto>>> GetBooks(int characterId, [FromQuery] int take = 50)
        {
            var pageSize = take <= 0 ? 50 : Math.Min(take, 100);

            var books = await _db.BookCharacters
                .AsNoTracking()
                .Where(link => link.CharacterTemplateId == characterId)
                .OrderByDescending(link => link.AddedAt)
                .Select(link => link.Book)
                .Include(book => book.Author)
                .Include(book => book.Genres)
                .Include(book => book.Tags)
                .Take(pageSize)
                .Select(book => new BookReadDto
                {
                    Id = book.ID,
                    Title = book.Title,
                    Description = book.Description,
                    CoverImageUrl = book.CoverImageUrl,
                    AuthorId = book.AuthorId,
                    AuthorName = book.AuthorName ?? (book.Author != null ? book.Author.UserName : null),
                    Status = book.Status.ToString(),
                    WordCount = book.WordCount,
                    TotalViews = book.TotalViews,
                    AverageRating = book.AverageRating,
                    IsFanfic = book.IsFanfic,
                    Genres = book.Genres.Select(genre => genre.Name).ToList(),
                    Tags = book.Tags.Select(tag => tag.Name).ToList(),
                    GenreIds = book.Genres.Select(genre => genre.ID).ToList(),
                    TagIds = book.Tags.Select(tag => tag.ID).ToList(),
                    VerseType = book.VerseType.ToString(),
                    OriginType = book.OriginType.ToString(),
                    SourceUrl = book.SourceUrl,
                    CreatedAt = book.CreatedAt,
                    UpdatedAt = book.UpdatedAt,
                })
                .ToListAsync();

            return Ok(books);
        }

        private async Task<CharacterWorld> BuildWorldEntityAsync(CharacterWorldCreateDto dto)
        {
            var entity = new CharacterWorld();
            await ApplyWorldFieldsAsync(entity, dto);
            entity.CreatedAt = DateTime.UtcNow;
            return entity;
        }

        private async Task ApplyWorldFieldsAsync(CharacterWorld entity, CharacterWorldCreateDto dto)
        {
            var name = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("World name is required.");

            var slug = string.IsNullOrWhiteSpace(dto.Slug)
                ? BuildSlug(name)
                : BuildSlug(dto.Slug);

            var duplicate = await _db.CharacterWorlds.AnyAsync(world =>
                world.ID != entity.ID &&
                ((world.Slug != null && slug != null && world.Slug == slug) ||
                 world.Name.ToLower() == name.ToLower()));

            if (duplicate)
                throw new InvalidOperationException("A world with the same name or slug already exists.");

            entity.Name = name;
            entity.Slug = slug;
            entity.Summary = dto.Summary.Trim();
            entity.ImageUrl = dto.ImageUrl.Trim();
            entity.IsActive = dto.IsActive;
            entity.SortOrder = dto.SortOrder;
        }

        private async Task<CharacterTemplate> BuildCharacterEntityAsync(CharacterCreateDto dto)
        {
            var entity = new CharacterTemplate();
            await ApplyCharacterFieldsAsync(entity, dto);
            entity.CreatedAt = DateTime.UtcNow;
            return entity;
        }

        private async Task ApplyCharacterFieldsAsync(CharacterTemplate entity, CharacterCreateDto dto)
        {
            var name = dto.Name.Trim();
            var role = dto.Role.Trim();

            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Character name is required.");
            if (string.IsNullOrWhiteSpace(role))
                throw new ArgumentException("Character role is required.");
            if (dto.WorldId <= 0)
                throw new ArgumentException("A world must be selected first.");

            var world = await _db.CharacterWorlds.FirstOrDefaultAsync(item => item.ID == dto.WorldId);
            if (world == null)
                throw new ArgumentException("Selected world was not found.");

            var slug = string.IsNullOrWhiteSpace(dto.Slug)
                ? BuildSlug(name)
                : BuildSlug(dto.Slug);

            var duplicate = await _db.CharacterTemplates.AnyAsync(character =>
                character.ID != entity.ID &&
                character.CharacterWorldId == world.ID &&
                ((character.Slug != null && slug != null && character.Slug == slug) ||
                 character.Name.ToLower() == name.ToLower()));

            if (duplicate)
                throw new InvalidOperationException("A character with the same name or slug already exists in this world.");

            entity.Name = name;
            entity.Slug = slug;
            entity.CharacterWorldId = world.ID;
            entity.CharacterWorld = world;
            entity.Fandom = world.Name;
            entity.Role = role;
            entity.Aliases = string.IsNullOrWhiteSpace(dto.Aliases) ? null : dto.Aliases.Trim();
            entity.ImageUrl = dto.ImageUrl.Trim();
            entity.Summary = dto.Summary.Trim();
            entity.Profile = string.IsNullOrWhiteSpace(dto.Profile) ? null : dto.Profile.Trim();
            entity.IsActive = dto.IsActive;
            entity.SortOrder = dto.SortOrder;
        }

        private async Task SyncWorldNameToCharactersAsync(CharacterWorld world)
        {
            var characters = await _db.CharacterTemplates
                .Where(character => character.CharacterWorldId == world.ID)
                .ToListAsync();

            foreach (var character in characters)
            {
                character.Fandom = world.Name;
            }
        }

        private static CharacterWorldDto MapWorld(CharacterWorld world)
        {
            return new CharacterWorldDto
            {
                Id = world.ID,
                Name = world.Name,
                Slug = world.Slug,
                Summary = world.Summary,
                ImageUrl = world.ImageUrl,
                IsActive = world.IsActive,
                SortOrder = world.SortOrder,
            };
        }

        private static CharacterDto MapCharacter(CharacterTemplate character)
        {
            return new CharacterDto
            {
                Id = character.ID,
                WorldId = character.CharacterWorldId,
                WorldName = character.CharacterWorld?.Name ?? character.Fandom,
                Name = character.Name,
                Slug = character.Slug,
                Fandom = character.Fandom,
                Role = character.Role,
                Aliases = character.Aliases,
                ImageUrl = character.ImageUrl,
                Summary = character.Summary,
                Profile = character.Profile,
                IsActive = character.IsActive,
                SortOrder = character.SortOrder,
            };
        }

        private static string? BuildSlug(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;

            var cleaned = new string(
                value
                    .Trim()
                    .ToLowerInvariant()
                    .Select(character => char.IsLetterOrDigit(character) ? character : '-')
                    .ToArray()
            );

            while (cleaned.Contains("--"))
            {
                cleaned = cleaned.Replace("--", "-");
            }

            return cleaned.Trim('-');
        }
    }
}
