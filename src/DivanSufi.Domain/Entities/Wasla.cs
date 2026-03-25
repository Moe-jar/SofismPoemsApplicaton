namespace DivanSufi.Domain.Entities;

public class Wasla
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public bool IsArchived { get; set; } = false;
    public ICollection<WaslaItem> Items { get; set; } = new List<WaslaItem>();
}
