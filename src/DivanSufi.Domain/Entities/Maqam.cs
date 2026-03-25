namespace DivanSufi.Domain.Entities;

public class Maqam
{
    public int Id { get; set; }
    public string NameAr { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public ICollection<Poem> Poems { get; set; } = new List<Poem>();
}
