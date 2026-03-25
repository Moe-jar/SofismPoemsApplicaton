namespace DivanSufi.Application.DTOs.Poets;

public record PoetDto(int Id, string NameAr, string? NameEn, string? Notes, DateTime CreatedAtUtc);
