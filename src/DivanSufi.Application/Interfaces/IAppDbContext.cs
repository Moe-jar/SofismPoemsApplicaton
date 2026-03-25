using DivanSufi.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DivanSufi.Application.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Poet> Poets { get; }
    DbSet<Maqam> Maqamat { get; }
    DbSet<Poem> Poems { get; }
    DbSet<Wasla> Waslat { get; }
    DbSet<WaslaItem> WaslaItems { get; }
    DbSet<CurrentPoemState> CurrentPoemStates { get; }
    DbSet<CurrentWaslaState> CurrentWaslaStates { get; }
    DbSet<ShareHistory> ShareHistories { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
