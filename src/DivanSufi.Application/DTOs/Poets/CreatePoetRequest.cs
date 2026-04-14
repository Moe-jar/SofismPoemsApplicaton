namespace DivanSufi.Application.DTOs.Poets;

public class CreatePoetRequest
{
    /// <summary>Arabic name — the canonical field name used by the API.</summary>
    public string? NameAr { get; set; }

    /// <summary>Alternative name field accepted from the frontend for backward compatibility.</summary>
    public string? Name { get; set; }

    public string? NameEn { get; set; }
    public string? Notes { get; set; }

    /// <summary>Returns the resolved Arabic name, preferring NameAr over the Name alias.</summary>
    public string ResolvedNameAr => NameAr ?? Name ?? string.Empty;
}
