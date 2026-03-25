using DivanSufi.Application.DTOs.Current;
using DivanSufi.Application.DTOs.Poems;
using DivanSufi.Application.DTOs.Waslat;
using DivanSufi.Application.Interfaces;
using DivanSufi.Domain.Entities;
using DivanSufi.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DivanSufi.WebApi.Controllers;

[ApiController]
[Route("api/current")]
[Authorize]
public class CurrentController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly ICurrentStateHub _hub;

    public CurrentController(IAppDbContext db, ICurrentStateHub hub)
    {
        _db = db;
        _hub = hub;
    }

    [HttpGet("poem")]
    public async Task<IActionResult> GetCurrentPoem()
    {
        var state = await _db.CurrentPoemStates
            .Include(s => s.Poem).ThenInclude(p => p.Poet)
            .Include(s => s.Poem).ThenInclude(p => p.Maqam)
            .Include(s => s.Poem).ThenInclude(p => p.CreatedByUser)
            .Include(s => s.SharedByUser)
            .OrderByDescending(s => s.SharedAtUtc)
            .FirstOrDefaultAsync();

        if (state == null) return NotFound(new { error = "لا توجد قصيدة حالية" });

        var dto = MapCurrentPoem(state);
        return Ok(dto);
    }

    [HttpPost("poem/share/{poemId}")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> SharePoem(int poemId, [FromBody] ShareRequest? request)
    {
        var poem = await _db.Poems.Include(p => p.Poet).Include(p => p.Maqam).Include(p => p.CreatedByUser)
            .FirstOrDefaultAsync(p => p.Id == poemId);
        if (poem == null) return NotFound(new { error = "القصيدة غير موجودة" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);

        var state = new CurrentPoemState
        {
            PoemId = poemId,
            SharedByUserId = userId,
            SharedAtUtc = DateTime.UtcNow,
            Message = request?.Message
        };
        _db.CurrentPoemStates.Add(state);

        var history = new ShareHistory { ShareType = ShareType.Poem, EntityId = poemId, SharedByUserId = userId, SharedAtUtc = DateTime.UtcNow };
        _db.ShareHistories.Add(history);

        await _db.SaveChangesAsync();

        state.Poem = poem;
        state.SharedByUser = user!;
        var dto = MapCurrentPoem(state);
        await _hub.BroadcastCurrentPoemAsync(dto);

        return Ok(dto);
    }

    [HttpGet("wasla")]
    public async Task<IActionResult> GetCurrentWasla()
    {
        var state = await _db.CurrentWaslaStates
            .Include(s => s.Wasla).ThenInclude(w => w.CreatedByUser)
            .Include(s => s.Wasla).ThenInclude(w => w.Items).ThenInclude(i => i.Poem).ThenInclude(p => p.Poet)
            .Include(s => s.Wasla).ThenInclude(w => w.Items).ThenInclude(i => i.Poem).ThenInclude(p => p.Maqam)
            .Include(s => s.SharedByUser)
            .OrderByDescending(s => s.SharedAtUtc)
            .FirstOrDefaultAsync();

        if (state == null) return NotFound(new { error = "لا توجد وصلة حالية" });
        return Ok(MapCurrentWasla(state));
    }

    [HttpPost("wasla/share/{waslaId}")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> ShareWasla(int waslaId, [FromBody] ShareRequest? request)
    {
        var wasla = await _db.Waslat
            .Include(w => w.CreatedByUser)
            .Include(w => w.Items).ThenInclude(i => i.Poem).ThenInclude(p => p.Poet)
            .Include(w => w.Items).ThenInclude(i => i.Poem).ThenInclude(p => p.Maqam)
            .FirstOrDefaultAsync(w => w.Id == waslaId);
        if (wasla == null) return NotFound(new { error = "الوصلة غير موجودة" });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var user = await _db.Users.FindAsync(userId);

        var state = new CurrentWaslaState
        {
            WaslaId = waslaId,
            SharedByUserId = userId,
            SharedAtUtc = DateTime.UtcNow,
            Message = request?.Message
        };
        _db.CurrentWaslaStates.Add(state);

        var history = new ShareHistory { ShareType = ShareType.Wasla, EntityId = waslaId, SharedByUserId = userId, SharedAtUtc = DateTime.UtcNow };
        _db.ShareHistories.Add(history);

        await _db.SaveChangesAsync();

        state.Wasla = wasla;
        state.SharedByUser = user!;
        var dto = MapCurrentWasla(state);
        await _hub.BroadcastCurrentWaslaAsync(dto);

        return Ok(dto);
    }

    private static CurrentPoemDto MapCurrentPoem(CurrentPoemState s) => new(
        s.Id,
        new PoemDetailDto(s.Poem.Id, s.Poem.Title, s.Poem.Body, s.Poem.PoetId, s.Poem.Poet.NameAr, s.Poem.Poet.NameEn, s.Poem.MaqamId, s.Poem.Maqam.NameAr, s.Poem.Maqam.NameEn, s.Poem.Category.ToString(), s.Poem.HadraSection.HasValue ? s.Poem.HadraSection.ToString() : null, s.Poem.Notes, s.Poem.CreatedAtUtc, s.Poem.UpdatedAtUtc, s.Poem.CreatedByUser.FullName),
        s.SharedByUser.FullName,
        s.SharedAtUtc,
        s.Message
    );

    private static CurrentWaslaDto MapCurrentWasla(CurrentWaslaState s) => new(
        s.Id,
        new WaslaDetailDto(s.Wasla.Id, s.Wasla.Name, s.Wasla.Description, s.Wasla.CreatedByUserId, s.Wasla.CreatedByUser.FullName, s.Wasla.CreatedAtUtc, s.Wasla.UpdatedAtUtc,
            s.Wasla.Items.OrderBy(i => i.SortOrder).Select(i => new WaslaItemDto(i.Id, i.SortOrder, i.Notes,
                new PoemListDto(i.Poem.Id, i.Poem.Title, i.Poem.Poet.NameAr, i.Poem.Poet.NameEn, i.Poem.Maqam.NameAr, i.Poem.Maqam.NameEn, i.Poem.Category.ToString(), i.Poem.HadraSection.HasValue ? i.Poem.HadraSection.ToString() : null, i.Poem.CreatedAtUtc)))),
        s.SharedByUser.FullName,
        s.SharedAtUtc,
        s.Message
    );
}
