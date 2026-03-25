using DivanSufi.Domain.Enums;

namespace DivanSufi.Domain.Entities;

public class Poem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public int PoetId { get; set; }
    public Poet Poet { get; set; } = null!;
    public int MaqamId { get; set; }
    public Maqam Maqam { get; set; } = null!;
    public PoemCategory Category { get; set; }
    public HadraSection? HadraSection { get; set; }
    public string? Notes { get; set; }
    public string SearchNormalizedTitle { get; set; } = string.Empty;
    public string SearchNormalizedBody { get; set; } = string.Empty;
    public string SearchNormalizedPoet { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public bool IsArchived { get; set; } = false;
    public ICollection<WaslaItem> WaslaItems { get; set; } = new List<WaslaItem>();
}
