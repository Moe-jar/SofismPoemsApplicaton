using DivanSufi.Application.DTOs.Waslat;

namespace DivanSufi.Application.DTOs.Current;

public record CurrentWaslaDto(
    int StateId,
    WaslaDetailDto Wasla,
    string SharedByFullName,
    DateTime SharedAtUtc,
    string? Message)
{
    // Frontend-compatible aliases
    public string SharedByName => SharedByFullName;
    public DateTime SharedAt => SharedAtUtc;
}
