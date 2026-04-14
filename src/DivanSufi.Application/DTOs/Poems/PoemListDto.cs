namespace DivanSufi.Application.DTOs.Poems;

public record PoemListDto(
    int Id,
    string Title,
    string PoetNameAr,
    string? PoetNameEn,
    string MaqamNameAr,
    string? MaqamNameEn,
    string Category,
    string? HadraSection,
    DateTime CreatedAtUtc)
{
    // Frontend-compatible aliases
    public string PoetName => PoetNameAr;
    public string MaqamName => MaqamNameAr;
}
