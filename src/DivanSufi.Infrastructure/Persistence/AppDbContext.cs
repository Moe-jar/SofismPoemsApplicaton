using DivanSufi.Application.Interfaces;
using DivanSufi.Domain.Entities;
using DivanSufi.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace DivanSufi.Infrastructure.Persistence;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Poet> Poets => Set<Poet>();
    public DbSet<Maqam> Maqamat => Set<Maqam>();
    public DbSet<Poem> Poems => Set<Poem>();
    public DbSet<Wasla> Waslat => Set<Wasla>();
    public DbSet<WaslaItem> WaslaItems => Set<WaslaItem>();
    public DbSet<CurrentPoemState> CurrentPoemStates => Set<CurrentPoemState>();
    public DbSet<CurrentWaslaState> CurrentWaslaStates => Set<CurrentWaslaState>();
    public DbSet<ShareHistory> ShareHistories => Set<ShareHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure auto-incrementing primary keys for PostgreSQL
        modelBuilder.Entity<User>()
            .Property(u => u.Id)
            .ValueGeneratedOnAdd()
            .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

        modelBuilder.Entity<Poet>()
            .Property(p => p.Id)
            .ValueGeneratedOnAdd()
            .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

        modelBuilder.Entity<Maqam>()
            .Property(m => m.Id)
            .ValueGeneratedOnAdd()
            .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

        modelBuilder.Entity<Poem>()
            .Property(p => p.Id)
            .ValueGeneratedOnAdd()
            .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

        modelBuilder.Entity<Wasla>()
            .Property(w => w.Id)
            .ValueGeneratedOnAdd()
            .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

        modelBuilder.Entity<WaslaItem>()
            .Property(wi => wi.Id)
            .ValueGeneratedOnAdd()
            .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

        modelBuilder.Entity<CurrentPoemState>()
            .Property(cps => cps.Id)
            .ValueGeneratedOnAdd()
            .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

        modelBuilder.Entity<CurrentWaslaState>()
            .Property(cws => cws.Id)
            .ValueGeneratedOnAdd()
            .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

        modelBuilder.Entity<ShareHistory>()
            .Property(sh => sh.Id)
            .ValueGeneratedOnAdd()
            .HasAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

        modelBuilder.Entity<WaslaItem>()
            .HasOne(wi => wi.Wasla)
            .WithMany(w => w.Items)
            .HasForeignKey(wi => wi.WaslaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WaslaItem>()
            .HasOne(wi => wi.Poem)
            .WithMany(p => p.WaslaItems)
            .HasForeignKey(wi => wi.PoemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Poem>()
            .HasOne(p => p.Poet)
            .WithMany(po => po.Poems)
            .HasForeignKey(p => p.PoetId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Poem>()
            .HasOne(p => p.Maqam)
            .WithMany(m => m.Poems)
            .HasForeignKey(p => p.MaqamId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CurrentPoemState>()
            .HasOne(c => c.Poem)
            .WithMany()
            .HasForeignKey(c => c.PoemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CurrentWaslaState>()
            .HasOne(c => c.Wasla)
            .WithMany()
            .HasForeignKey(c => c.WaslaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ShareHistory>()
            .HasOne(sh => sh.SharedByUser)
            .WithMany()
            .HasForeignKey(sh => sh.SharedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
