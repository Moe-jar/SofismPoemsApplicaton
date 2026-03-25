namespace DivanSufi.Domain.Entities;

public class CurrentPoemState
{
    public int Id { get; set; }
    public int PoemId { get; set; }
    public Poem Poem { get; set; } = null!;
    public int SharedByUserId { get; set; }
    public User SharedByUser { get; set; } = null!;
    public DateTime SharedAtUtc { get; set; } = DateTime.UtcNow;
    public string? Message { get; set; }
}
