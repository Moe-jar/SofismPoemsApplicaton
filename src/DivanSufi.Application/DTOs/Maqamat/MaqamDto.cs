namespace DivanSufi.Application.DTOs.Maqamat;

public record MaqamDto(int Id, string NameAr, string? NameEn, string? Description, bool IsActive, int SortOrder)
{
    // Frontend-compatible alias
    public string Name => NameAr;
}
