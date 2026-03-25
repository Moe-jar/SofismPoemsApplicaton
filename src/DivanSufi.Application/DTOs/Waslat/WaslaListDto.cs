namespace DivanSufi.Application.DTOs.Waslat;

public record WaslaListDto(int Id, string Name, string? Description, int ItemCount, DateTime UpdatedAtUtc, string CreatedByFullName);
