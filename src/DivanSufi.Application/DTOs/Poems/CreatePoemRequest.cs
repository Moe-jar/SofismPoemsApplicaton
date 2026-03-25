namespace DivanSufi.Application.DTOs.Poems;

public record CreatePoemRequest(
    string Title,
    string Body,
    int PoetId,
    int MaqamId,
    string Category,
    string? HadraSection,
    string? Notes
);
