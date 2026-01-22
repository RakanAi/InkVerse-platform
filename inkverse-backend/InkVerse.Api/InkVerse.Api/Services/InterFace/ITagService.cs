using static InkVerse.Api.DTOs.TagTrenGen.TagDtos;

namespace InkVerse.Api.Services.InterFace
{
    public interface ITagService
    {
        Task<List<TagDto>> GetAllAsync(bool includeInactive = true);
        Task<TagDto?> GetByIdAsync(int id);

        Task<TagDto> CreateAsync(TagCreateDto dto);
        Task<TagDto?> UpdateAsync(int id, TagUpdateDto dto);
        Task<bool> DeleteAsync(int id);

        Task<bool> AddToBookAsync(int tagId, int bookId);
        Task<bool> RemoveFromBookAsync(int tagId, int bookId);
        Task<List<int>> GetBookIdsAsync(int tagId);
        Task<List<TagDto>> GetPopularAsync(int take = 80);

    }
}
