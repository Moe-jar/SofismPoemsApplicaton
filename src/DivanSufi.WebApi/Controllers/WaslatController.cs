using DivanSufi.Application.DTOs.Poems;
using DivanSufi.Application.DTOs.Waslat;
using DivanSufi.Application.Interfaces;
using DivanSufi.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DivanSufi.WebApi.Controllers;

[ApiController]
[Route("api/waslat")]
[Authorize]
public class WaslatController : ControllerBase
{
    private readonly IAppDbContext _db;

    public WaslatController(IAppDbContext db)
    {
        _db = db;
    }

    private static WaslaDetailDto MapToDetail(Wasla w) => new(
        w.Id, w.Name, w.Description,
        w.CreatedByUserId, w.CreatedByUser.FullName,
        w.CreatedAtUtc, w.UpdatedAtUtc,
        w.Items.OrderBy(i => i.SortOrder).Select(i => new WaslaItemDto(
            i.Id, i.SortOrder, i.Notes,
            new PoemListDto(i.Poem.Id, i.Poem.Title, i.Poem.Poet.NameAr, i.Poem.Poet.NameEn, i.Poem.Maqam.NameAr, i.Poem.Maqam.NameEn, i.Poem.Category.ToString(), i.Poem.HadraSection.HasValue ? i.Poem.HadraSection.ToString() : null, i.Poem.CreatedAtUtc)
        ))
    );

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
    {
        var query = _db.Waslat
            .Include(w => w.CreatedByUser)
            .Include(w => w.Items)
            .Where(w => !w.IsArchived)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(w => w.Name.Contains(search));

        var waslat = await query
            .OrderByDescending(w => w.UpdatedAtUtc)
            .Select(w => new WaslaListDto(w.Id, w.Name, w.Description, w.Items.Count, w.UpdatedAtUtc, w.CreatedByUser.FullName))
            .ToListAsync();

        return Ok(waslat);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var wasla = await _db.Waslat
            .Include(w => w.CreatedByUser)
            .Include(w => w.Items).ThenInclude(i => i.Poem).ThenInclude(p => p.Poet)
            .Include(w => w.Items).ThenInclude(i => i.Poem).ThenInclude(p => p.Maqam)
            .FirstOrDefaultAsync(w => w.Id == id);

        if (wasla == null) return NotFound(new { error = "الوصلة غير موجودة" });
        return Ok(MapToDetail(wasla));
    }

    [HttpPost]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Create([FromBody] CreateWaslaRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var wasla = new Wasla { Name = request.Name, Description = request.Description, CreatedByUserId = userId, CreatedAtUtc = DateTime.UtcNow, UpdatedAtUtc = DateTime.UtcNow };
        _db.Waslat.Add(wasla);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = wasla.Id }, new { id = wasla.Id, name = wasla.Name });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateWaslaRequest request)
    {
        var wasla = await _db.Waslat.FindAsync(id);
        if (wasla == null) return NotFound();
        wasla.Name = request.Name;
        wasla.Description = request.Description;
        wasla.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { id = wasla.Id });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Delete(int id)
    {
        var wasla = await _db.Waslat.FindAsync(id);
        if (wasla == null) return NotFound();
        wasla.IsArchived = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/items")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> AddItem(int id, [FromBody] AddWaslaItemRequest request)
    {
        var wasla = await _db.Waslat.Include(w => w.Items).FirstOrDefaultAsync(w => w.Id == id);
        if (wasla == null) return NotFound();

        var poem = await _db.Poems.FindAsync(request.PoemId);
        if (poem == null) return BadRequest(new { error = "القصيدة غير موجودة" });

        var maxOrder = wasla.Items.Any() ? wasla.Items.Max(i => i.SortOrder) : 0;
        var item = new WaslaItem { WaslaId = id, PoemId = request.PoemId, SortOrder = maxOrder + 1, Notes = request.Notes };
        _db.WaslaItems.Add(item);
        wasla.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { id = item.Id });
    }

    [HttpDelete("{id}/items/{itemId}")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> RemoveItem(int id, int itemId)
    {
        var item = await _db.WaslaItems.FirstOrDefaultAsync(i => i.Id == itemId && i.WaslaId == id);
        if (item == null) return NotFound();
        _db.WaslaItems.Remove(item);
        var wasla = await _db.Waslat.FindAsync(id);
        if (wasla != null) wasla.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/items/reorder")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Reorder(int id, [FromBody] ReorderWaslaItemsRequest request)
    {
        var items = await _db.WaslaItems.Where(i => i.WaslaId == id).ToListAsync();
        foreach (var order in request.Items)
        {
            var item = items.FirstOrDefault(i => i.Id == order.ItemId);
            if (item != null) item.SortOrder = order.SortOrder;
        }
        var wasla = await _db.Waslat.FindAsync(id);
        if (wasla != null) wasla.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok();
    }
}
