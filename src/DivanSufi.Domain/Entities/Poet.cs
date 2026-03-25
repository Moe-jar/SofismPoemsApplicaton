namespace DivanSufi.Domain.Entities;

public class Poet
{
    public int Id { get; set; }
    public string NameAr { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public ICollection<Poem> Poems { get; set; } = new List<Poem>();
}
