namespace DivanSufi.Application.DTOs.Poems;

public record PoemDetailDto(
    int Id,
    string Title,
    string Body,
    int PoetId,
    string PoetNameAr,
    string? PoetNameEn,
    int MaqamId,
    string MaqamNameAr,
    string? MaqamNameEn,
    string Category,
    string? HadraSection,
    string? Notes,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    string CreatedByFullName
);
