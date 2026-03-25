namespace DivanSufi.Application.DTOs.Poems;

public class PoemSearchParams
{
    public string? Query { get; set; }
    public int? PoetId { get; set; }
    public int? MaqamId { get; set; }
    public string? Category { get; set; }
    public string? HadraSection { get; set; }
    public string SortBy { get; set; } = "newest";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
