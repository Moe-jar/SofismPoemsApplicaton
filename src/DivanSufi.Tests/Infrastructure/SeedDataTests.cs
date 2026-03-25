using DivanSufi.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace DivanSufi.Tests.Infrastructure;

public class SeedDataTests
{
    private AppDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public void Seed_CreatesUsers()
    {
        using var context = CreateInMemoryContext();
        SeedData.Seed(context);
        Assert.Equal(3, context.Users.Count());
    }

    [Fact]
    public void Seed_CreatesMaqamat()
    {
        using var context = CreateInMemoryContext();
        SeedData.Seed(context);
        Assert.Equal(12, context.Maqamat.Count());
    }

    [Fact]
    public void Seed_CreatesPoets()
    {
        using var context = CreateInMemoryContext();
        SeedData.Seed(context);
        Assert.Equal(6, context.Poets.Count());
    }

    [Fact]
    public void Seed_CreatesPoems()
    {
        using var context = CreateInMemoryContext();
        SeedData.Seed(context);
        Assert.Equal(6, context.Poems.Count());
    }

    [Fact]
    public void Seed_CreatesWasla()
    {
        using var context = CreateInMemoryContext();
        SeedData.Seed(context);
        Assert.Equal(1, context.Waslat.Count());
    }

    [Fact]
    public void Seed_IdempotentWhenCalledTwice()
    {
        using var context = CreateInMemoryContext();
        SeedData.Seed(context);
        SeedData.Seed(context);
        Assert.Equal(3, context.Users.Count());
    }

    [Fact]
    public void Seed_LeadUserHasLeadRole()
    {
        using var context = CreateInMemoryContext();
        SeedData.Seed(context);
        var lead = context.Users.First(u => u.Username == "lead");
        Assert.Equal(DivanSufi.Domain.Enums.UserRole.LeadMunshid, lead.Role);
    }

    [Fact]
    public void Seed_HadraPoemsHaveHadraSection()
    {
        using var context = CreateInMemoryContext();
        SeedData.Seed(context);
        var hadraPoems = context.Poems.Where(p => p.Category == DivanSufi.Domain.Enums.PoemCategory.Hadra).ToList();
        Assert.All(hadraPoems, p => Assert.NotNull(p.HadraSection));
    }

    [Fact]
    public void Seed_NonHadraPoemsHaveNoHadraSection()
    {
        using var context = CreateInMemoryContext();
        SeedData.Seed(context);
        var nonHadraPoems = context.Poems.Where(p => p.Category != DivanSufi.Domain.Enums.PoemCategory.Hadra).ToList();
        Assert.All(nonHadraPoems, p => Assert.Null(p.HadraSection));
    }
}