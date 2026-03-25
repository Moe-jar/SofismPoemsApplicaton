using DivanSufi.Application.DTOs.Poets;
using DivanSufi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DivanSufi.Domain.Entities;

namespace DivanSufi.WebApi.Controllers;

[ApiController]
[Route("api/poets")]
[Authorize]
public class PoetsController : ControllerBase
{
    private readonly IAppDbContext _db;

    public PoetsController(IAppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var poets = await _db.Poets
            .OrderBy(p => p.NameAr)
            .Select(p => new PoetDto(p.Id, p.NameAr, p.NameEn, p.Notes, p.CreatedAtUtc))
            .ToListAsync();
        return Ok(poets);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var poet = await _db.Poets.FindAsync(id);
        if (poet == null) return NotFound();
        return Ok(new PoetDto(poet.Id, poet.NameAr, poet.NameEn, poet.Notes, poet.CreatedAtUtc));
    }

    [HttpPost]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Create([FromBody] CreatePoetRequest request)
    {
        var poet = new Poet { NameAr = request.NameAr, NameEn = request.NameEn, Notes = request.Notes, CreatedAtUtc = DateTime.UtcNow };
        _db.Poets.Add(poet);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = poet.Id }, new PoetDto(poet.Id, poet.NameAr, poet.NameEn, poet.Notes, poet.CreatedAtUtc));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Update(int id, [FromBody] CreatePoetRequest request)
    {
        var poet = await _db.Poets.FindAsync(id);
        if (poet == null) return NotFound();
        poet.NameAr = request.NameAr;
        poet.NameEn = request.NameEn;
        poet.Notes = request.Notes;
        await _db.SaveChangesAsync();
        return Ok(new PoetDto(poet.Id, poet.NameAr, poet.NameEn, poet.Notes, poet.CreatedAtUtc));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Delete(int id)
    {
        var poet = await _db.Poets.FindAsync(id);
        if (poet == null) return NotFound();
        _db.Poets.Remove(poet);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
