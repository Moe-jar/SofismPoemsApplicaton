namespace DivanSufi.Domain.Entities;

public class WaslaItem
{
    public int Id { get; set; }
    public int WaslaId { get; set; }
    public Wasla Wasla { get; set; } = null!;
    public int PoemId { get; set; }
    public Poem Poem { get; set; } = null!;
    public int SortOrder { get; set; }
    public string? Notes { get; set; }
}
