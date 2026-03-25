using DivanSufi.Application.Interfaces;
using DivanSufi.Domain.Entities;
using DivanSufi.Domain.Enums;
using DivanSufi.Infrastructure.Persistence;
using DivanSufi.WebApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Xunit;

namespace DivanSufi.Tests.Controllers;

public class PoemsControllerTests
{
    private AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var ctx = new AppDbContext(options);
        ctx.Database.EnsureCreated();
        return ctx;
    }

    private static PoemsController CreateController(AppDbContext db, int userId = 1, string role = "LeadMunshid")
    {
        var ctrl = new PoemsController(db);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Role, role),
        };
        ctrl.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"))
            }
        };
        return ctrl;
    }

    private static void SeedPoem(AppDbContext db, int userId = 1)
    {
        db.Users.Add(new User { Id = userId, FullName = "Test Lead", Username = "lead", PasswordHash = "x", Role = UserRole.LeadMunshid });
        db.Poets.Add(new Poet { Id = 1, NameAr = "شاعر اختبار" });
        db.Maqamat.Add(new Maqam { Id = 1, NameAr = "بياتي", SortOrder = 1 });
        db.Poems.Add(new Poem
        {
            Id = 1, Title = "قصيدة اختبار", Body = "نص القصيدة",
            PoetId = 1, MaqamId = 1, Category = PoemCategory.Ilahiyyat,
            CreatedByUserId = userId,
            SearchNormalizedTitle = "قصيدة اختبار",
            SearchNormalizedBody = "نص القصيدة",
            SearchNormalizedPoet = "شاعر اختبار"
        });
        db.SaveChanges();
    }

    [Fact]
    public async Task GetAll_ReturnsPagedResult()
    {
        using var db = CreateContext();
        SeedPoem(db);
        var ctrl = CreateController(db);
        var result = await ctrl.GetAll(new DivanSufi.Application.DTOs.Poems.PoemSearchParams());
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task GetById_ReturnsPoem()
    {
        using var db = CreateContext();
        SeedPoem(db);
        var ctrl = CreateController(db);
        var result = await ctrl.GetById(1);
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task GetById_NotFound_Returns404()
    {
        using var db = CreateContext();
        var ctrl = CreateController(db);
        var result = await ctrl.GetById(999);
        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_HadraCategoryWithoutSection_ReturnsBadRequest()
    {
        using var db = CreateContext();
        SeedPoem(db);
        var ctrl = CreateController(db);
        var req = new DivanSufi.Application.DTOs.Poems.CreatePoemRequest(
            "عنوان", "نص", 1, 1, "Hadra", null, null);
        var result = await ctrl.Create(req);
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task Delete_SetsIsArchived()
    {
        using var db = CreateContext();
        SeedPoem(db);
        var ctrl = CreateController(db);
        var result = await ctrl.Delete(1);
        Assert.IsType<NoContentResult>(result);
        var poem = db.Poems.Find(1);
        Assert.True(poem!.IsArchived);
    }

    [Fact]
    public async Task GetAll_SearchByTitle_ReturnsMatchingPoems()
    {
        using var db = CreateContext();
        SeedPoem(db);
        var ctrl = CreateController(db);
        var result = await ctrl.GetAll(new DivanSufi.Application.DTOs.Poems.PoemSearchParams { Query = "اختبار" });
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }
}