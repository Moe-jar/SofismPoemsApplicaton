namespace DivanSufi.Domain.Entities;

public class CurrentWaslaState
{
    public int Id { get; set; }
    public int WaslaId { get; set; }
    public Wasla Wasla { get; set; } = null!;
    public int SharedByUserId { get; set; }
    public User SharedByUser { get; set; } = null!;
    public DateTime SharedAtUtc { get; set; } = DateTime.UtcNow;
    public string? Message { get; set; }
}
