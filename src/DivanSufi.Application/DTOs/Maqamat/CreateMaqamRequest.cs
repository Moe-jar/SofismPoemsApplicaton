namespace DivanSufi.Application.DTOs.Maqamat;

public record CreateMaqamRequest(string NameAr, string? NameEn, string? Description, int SortOrder);
