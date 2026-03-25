using DivanSufi.Application.Common;
using DivanSufi.Application.DTOs.Poems;
using DivanSufi.Application.Interfaces;
using DivanSufi.Domain.Entities;
using DivanSufi.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DivanSufi.WebApi.Controllers;

[ApiController]
[Route("api/poems")]
[Authorize]
public class PoemsController : ControllerBase
{
    private readonly IAppDbContext _db;

    public PoemsController(IAppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PoemSearchParams p)
    {
        var query = _db.Poems
            .Include(x => x.Poet)
            .Include(x => x.Maqam)
            .Where(x => !x.IsArchived)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(p.Query))
        {
            var normalized = ArabicNormalizer.Normalize(p.Query);
            query = query.Where(x =>
                x.SearchNormalizedTitle.Contains(normalized) ||
                x.SearchNormalizedBody.Contains(normalized) ||
                x.SearchNormalizedPoet.Contains(normalized) ||
                x.Title.Contains(p.Query) ||
                x.Body.Contains(p.Query));
        }

        if (p.PoetId.HasValue)
            query = query.Where(x => x.PoetId == p.PoetId.Value);

        if (p.MaqamId.HasValue)
            query = query.Where(x => x.MaqamId == p.MaqamId.Value);

        if (!string.IsNullOrWhiteSpace(p.Category) && Enum.TryParse<PoemCategory>(p.Category, out var cat))
            query = query.Where(x => x.Category == cat);

        if (!string.IsNullOrWhiteSpace(p.HadraSection) && Enum.TryParse<HadraSection>(p.HadraSection, out var hs))
            query = query.Where(x => x.HadraSection == hs);

        query = p.SortBy switch
        {
            "title" => query.OrderBy(x => x.Title),
            "poet" => query.OrderBy(x => x.Poet.NameAr),
            _ => query.OrderByDescending(x => x.CreatedAtUtc)
        };

        var total = await query.CountAsync();
        var items = await query
            .Skip((p.Page - 1) * p.PageSize)
            .Take(p.PageSize)
            .Select(x => new PoemListDto(
                x.Id, x.Title,
                x.Poet.NameAr, x.Poet.NameEn,
                x.Maqam.NameAr, x.Maqam.NameEn,
                x.Category.ToString(),
                x.HadraSection.HasValue ? x.HadraSection.ToString() : null,
                x.CreatedAtUtc))
            .ToListAsync();

        return Ok(new PagedResult<PoemListDto>(items, total, p.Page, p.PageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var poem = await _db.Poems
            .Include(x => x.Poet)
            .Include(x => x.Maqam)
            .Include(x => x.CreatedByUser)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (poem == null) return NotFound();

        return Ok(new PoemDetailDto(
            poem.Id, poem.Title, poem.Body,
            poem.PoetId, poem.Poet.NameAr, poem.Poet.NameEn,
            poem.MaqamId, poem.Maqam.NameAr, poem.Maqam.NameEn,
            poem.Category.ToString(),
            poem.HadraSection.HasValue ? poem.HadraSection.ToString() : null,
            poem.Notes,
            poem.CreatedAtUtc, poem.UpdatedAtUtc,
            poem.CreatedByUser.FullName));
    }

    [HttpPost]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Create([FromBody] CreatePoemRequest request)
    {
        if (!Enum.TryParse<PoemCategory>(request.Category, out var cat))
            return BadRequest(new { error = "تصنيف القصيدة غير صحيح" });

        HadraSection? hadraSection = null;
        if (cat == PoemCategory.Hadra)
        {
            if (string.IsNullOrWhiteSpace(request.HadraSection))
                return BadRequest(new { error = "قسم الحضرة مطلوب لقصائد الحضرة" });
            if (!Enum.TryParse<HadraSection>(request.HadraSection, out var hs))
                return BadRequest(new { error = "قسم الحضرة غير صحيح" });
            hadraSection = hs;
        }

        var poet = await _db.Poets.FindAsync(request.PoetId);
        if (poet == null) return BadRequest(new { error = "الشاعر غير موجود" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var poem = new Poem
        {
            Title = request.Title,
            Body = request.Body,
            PoetId = request.PoetId,
            MaqamId = request.MaqamId,
            Category = cat,
            HadraSection = hadraSection,
            Notes = request.Notes,
            SearchNormalizedTitle = ArabicNormalizer.Normalize(request.Title),
            SearchNormalizedBody = ArabicNormalizer.Normalize(request.Body),
            SearchNormalizedPoet = ArabicNormalizer.Normalize(poet.NameAr),
            CreatedByUserId = userId,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _db.Poems.Add(poem);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = poem.Id }, new { id = poem.Id });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Update(int id, [FromBody] CreatePoemRequest request)
    {
        var poem = await _db.Poems.Include(x => x.Poet).FirstOrDefaultAsync(x => x.Id == id);
        if (poem == null) return NotFound();

        if (!Enum.TryParse<PoemCategory>(request.Category, out var cat))
            return BadRequest(new { error = "تصنيف القصيدة غير صحيح" });

        HadraSection? hadraSection = null;
        if (cat == PoemCategory.Hadra)
        {
            if (string.IsNullOrWhiteSpace(request.HadraSection))
                return BadRequest(new { error = "قسم الحضرة مطلوب لقصائد الحضرة" });
            if (!Enum.TryParse<HadraSection>(request.HadraSection, out var hs))
                return BadRequest(new { error = "قسم الحضرة غير صحيح" });
            hadraSection = hs;
        }

        var poet = await _db.Poets.FindAsync(request.PoetId);
        if (poet == null) return BadRequest(new { error = "الشاعر غير موجود" });

        poem.Title = request.Title;
        poem.Body = request.Body;
        poem.PoetId = request.PoetId;
        poem.MaqamId = request.MaqamId;
        poem.Category = cat;
        poem.HadraSection = hadraSection;
        poem.Notes = request.Notes;
        poem.SearchNormalizedTitle = ArabicNormalizer.Normalize(request.Title);
        poem.SearchNormalizedBody = ArabicNormalizer.Normalize(request.Body);
        poem.SearchNormalizedPoet = ArabicNormalizer.Normalize(poet.NameAr);
        poem.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { id = poem.Id });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Delete(int id)
    {
        var poem = await _db.Poems.FindAsync(id);
        if (poem == null) return NotFound();
        poem.IsArchived = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
