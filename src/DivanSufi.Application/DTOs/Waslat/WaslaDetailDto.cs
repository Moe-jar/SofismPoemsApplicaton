using DivanSufi.Application.DTOs.Poems;

namespace DivanSufi.Application.DTOs.Waslat;

public record WaslaDetailDto(
    int Id,
    string Name,
    string? Description,
    int CreatedByUserId,
    string CreatedByFullName,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    IEnumerable<WaslaItemDto> Items
);

public record WaslaItemDto(int Id, int SortOrder, string? Notes, PoemListDto Poem)
{
    // Frontend-compatible flat fields
    public int PoemId => Poem.Id;
    public string PoemTitle => Poem.Title;
    public string PoemPoetName => Poem.PoetNameAr;
}
