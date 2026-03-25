using DivanSufi.Application.DTOs.Poems;

namespace DivanSufi.Application.DTOs.Current;

public record CurrentPoemDto(
    int StateId,
    PoemDetailDto Poem,
    string SharedByFullName,
    DateTime SharedAtUtc,
    string? Message
);
