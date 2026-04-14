namespace DivanSufi.Application.DTOs.Poems;

public record CreatePoemRequest(
    string Title,
    string? Body,
    int? PoetId,
    int? MaqamId,
    string Category,
    string? HadraSection,
    string? Notes)
{
    /// <summary>Alternative body field accepted from the frontend for backward compatibility.</summary>
    public string? Content { get; init; }

    /// <summary>Returns the resolved body text, preferring Body over the Content alias.</summary>
    public string ResolvedBody => Body ?? Content ?? string.Empty;

    /// <summary>Returns the resolved poet ID or 0 if not provided.</summary>
    public int ResolvedPoetId => PoetId ?? 0;

    /// <summary>Returns the resolved maqam ID or 0 if not provided.</summary>
    public int ResolvedMaqamId => MaqamId ?? 0;
}
