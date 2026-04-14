using DivanSufi.Application.DTOs.Poems;

namespace DivanSufi.Application.DTOs.Current;

public record CurrentPoemDto(
    int StateId,
    PoemDetailDto Poem,
    string SharedByFullName,
    DateTime SharedAtUtc,
    string? Message)
{
    // Frontend-compatible aliases
    public string SharedByName => SharedByFullName;
    public DateTime SharedAt => SharedAtUtc;
}
