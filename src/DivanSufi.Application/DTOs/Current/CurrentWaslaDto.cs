using DivanSufi.Application.DTOs.Waslat;

namespace DivanSufi.Application.DTOs.Current;

public record CurrentWaslaDto(
    int StateId,
    WaslaDetailDto Wasla,
    string SharedByFullName,
    DateTime SharedAtUtc,
    string? Message
);
