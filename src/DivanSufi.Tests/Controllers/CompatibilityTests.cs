using DivanSufi.Application.DTOs.Maqamat;
using DivanSufi.Application.DTOs.Poems;
using DivanSufi.Application.DTOs.Poets;
using DivanSufi.Application.DTOs.Waslat;
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

/// <summary>
/// Tests that verify frontend-compatible field aliases on response DTOs
/// and frontend-compatible request field names.
/// </summary>
public class CompatibilityTests
{
    // ─── DTO alias tests ──────────────────────────────────────────────────────

    [Fact]
    public void PoemListDto_AliasesMatchPrimaryFields()
    {
        var dto = new PoemListDto(1, "عنوان", "شاعر عربي", "Poet EN", "مقام عربي", "Maqam EN",
            "Hadra", "Opening", DateTime.UtcNow);

        Assert.Equal(dto.PoetNameAr, dto.PoetName);
        Assert.Equal(dto.MaqamNameAr, dto.MaqamName);
    }

    [Fact]
    public void PoemDetailDto_AliasesMatchPrimaryFields()
    {
        var dto = new PoemDetailDto(1, "عنوان", "النص", 1, "شاعر", null, 1, "بياتي", null,
            "Ilahiyat", null, null, DateTime.UtcNow, DateTime.UtcNow, "المنشد");

        Assert.Equal(dto.PoetNameAr, dto.PoetName);
        Assert.Equal(dto.MaqamNameAr, dto.MaqamName);
        Assert.Equal(dto.Body, dto.Content);
    }

    [Fact]
    public void PoetDto_NameAliasMatchesNameAr()
    {
        var dto = new PoetDto(1, "جلال الدين الرومي", "Rumi", null, DateTime.UtcNow);
        Assert.Equal(dto.NameAr, dto.Name);
    }

    [Fact]
    public void MaqamDto_NameAliasMatchesNameAr()
    {
        var dto = new MaqamDto(1, "بياتي", "Bayati", null, true, 1);
        Assert.Equal(dto.NameAr, dto.Name);
    }

    [Fact]
    public void PagedResult_TotalPagesComputedCorrectly()
    {
        var result = new PagedResult<int>(new[] { 1, 2, 3 }, TotalCount: 25, Page: 1, PageSize: 10);
        Assert.Equal(3, result.TotalPages);
    }

    [Fact]
    public void PagedResult_TotalPagesRoundsUp()
    {
        var result = new PagedResult<int>(Array.Empty<int>(), TotalCount: 21, Page: 1, PageSize: 10);
        Assert.Equal(3, result.TotalPages);
    }

    [Fact]
    public void WaslaItemDto_FlatFieldsMatchNestedPoem()
    {
        var poem = new PoemListDto(42, "قصيدة", "شاعر", null, "مقام", null, "Hadra", null, DateTime.UtcNow);
        var item = new WaslaItemDto(1, 1, null, poem);

        Assert.Equal(42, item.PoemId);
        Assert.Equal("قصيدة", item.PoemTitle);
        Assert.Equal("شاعر", item.PoemPoetName);
    }

    // ─── Request DTO compatibility tests ─────────────────────────────────────

    [Fact]
    public void CreatePoetRequest_ResolvesNameOverNameAr()
    {
        var req = new CreatePoetRequest { Name = "Rumi" };
        Assert.Equal("Rumi", req.ResolvedNameAr);
    }

    [Fact]
    public void CreatePoetRequest_PrefersNameArOverName()
    {
        var req = new CreatePoetRequest { NameAr = "الرومي", Name = "Rumi" };
        Assert.Equal("الرومي", req.ResolvedNameAr);
    }

    [Fact]
    public void CreatePoemRequest_ResolvesContentOverBody()
    {
        var req = new CreatePoemRequest("عنوان", null, 1, 1, "Ilahiyat", null, null)
        {
            Content = "نص القصيدة"
        };
        Assert.Equal("نص القصيدة", req.ResolvedBody);
    }

    [Fact]
    public void CreatePoemRequest_PrefersBodyOverContent()
    {
        var req = new CreatePoemRequest("عنوان", "body text", 1, 1, "Ilahiyat", null, null)
        {
            Content = "content text"
        };
        Assert.Equal("body text", req.ResolvedBody);
    }

    // ─── Enum rename tests ────────────────────────────────────────────────────

    [Fact]
    public void PoemCategory_IlahiyatValue_MatchesFrontend()
    {
        Assert.Equal("Ilahiyat", PoemCategory.Ilahiyat.ToString());
    }

    [Fact]
    public void PoemCategory_NabawiyatValue_MatchesFrontend()
    {
        Assert.Equal("Nabawiyat", PoemCategory.Nabawiyat.ToString());
    }

    [Fact]
    public void HadraSection_OpeningValue_MatchesFrontend()
    {
        Assert.Equal("Opening", HadraSection.Opening.ToString());
    }

    [Fact]
    public void HadraSection_MainValue_MatchesFrontend()
    {
        Assert.Equal("Main", HadraSection.Main.ToString());
    }

    [Fact]
    public void HadraSection_ClosingValue_MatchesFrontend()
    {
        Assert.Equal("Closing", HadraSection.Closing.ToString());
    }

    // ─── Controller integration tests ────────────────────────────────────────

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        var ctx = new AppDbContext(options);
        ctx.Database.EnsureCreated();
        return ctx;
    }

    private static PoetsController CreatePoetsController(AppDbContext db)
    {
        var ctrl = new PoetsController(db);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, "1"),
            new(ClaimTypes.Role, "LeadMunshid"),
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

    [Fact]
    public async Task PoetsController_Create_AcceptsFrontendNameField()
    {
        using var db = CreateContext();
        var ctrl = CreatePoetsController(db);

        // Frontend sends { "name": "..." } not { "nameAr": "..." }
        var req = new CreatePoetRequest { Name = "جلال الدين الرومي" };
        var result = await ctrl.Create(req);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var dto = Assert.IsType<PoetDto>(created.Value);
        Assert.Equal("جلال الدين الرومي", dto.NameAr);
    }

    [Fact]
    public async Task PoetsController_GetById_NotFound_ReturnsErrorBody()
    {
        using var db = CreateContext();
        var ctrl = CreatePoetsController(db);
        var result = await ctrl.GetById(999);
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.NotNull(notFound.Value);
    }
}
