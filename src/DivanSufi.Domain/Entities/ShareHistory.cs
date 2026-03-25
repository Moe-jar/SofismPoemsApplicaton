using DivanSufi.Domain.Enums;

namespace DivanSufi.Domain.Entities;

public class ShareHistory
{
    public int Id { get; set; }
    public ShareType ShareType { get; set; }
    public int EntityId { get; set; }
    public int SharedByUserId { get; set; }
    public User SharedByUser { get; set; } = null!;
    public DateTime SharedAtUtc { get; set; } = DateTime.UtcNow;
}
