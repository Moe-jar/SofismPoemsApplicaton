using DivanSufi.Application.DTOs.Maqamat;
using DivanSufi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DivanSufi.Domain.Entities;

namespace DivanSufi.WebApi.Controllers;

[ApiController]
[Route("api/maqamat")]
[Authorize]
public class MaqamatController : ControllerBase
{
    private readonly IAppDbContext _db;

    public MaqamatController(IAppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var maqamat = await _db.Maqamat
            .Where(m => m.IsActive)
            .OrderBy(m => m.SortOrder)
            .Select(m => new MaqamDto(m.Id, m.NameAr, m.NameEn, m.Description, m.IsActive, m.SortOrder))
            .ToListAsync();
        return Ok(maqamat);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var maqam = await _db.Maqamat.FindAsync(id);
        if (maqam == null) return NotFound(new { error = "المقام غير موجود" });
        return Ok(new MaqamDto(maqam.Id, maqam.NameAr, maqam.NameEn, maqam.Description, maqam.IsActive, maqam.SortOrder));
    }

    [HttpPost]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Create([FromBody] CreateMaqamRequest request)
    {
        var maqam = new Maqam { NameAr = request.NameAr, NameEn = request.NameEn, Description = request.Description, SortOrder = request.SortOrder, IsActive = true };
        _db.Maqamat.Add(maqam);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = maqam.Id }, new MaqamDto(maqam.Id, maqam.NameAr, maqam.NameEn, maqam.Description, maqam.IsActive, maqam.SortOrder));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateMaqamRequest request)
    {
        var maqam = await _db.Maqamat.FindAsync(id);
        if (maqam == null) return NotFound(new { error = "المقام غير موجود" });
        maqam.NameAr = request.NameAr;
        maqam.NameEn = request.NameEn;
        maqam.Description = request.Description;
        maqam.SortOrder = request.SortOrder;
        await _db.SaveChangesAsync();
        return Ok(new MaqamDto(maqam.Id, maqam.NameAr, maqam.NameEn, maqam.Description, maqam.IsActive, maqam.SortOrder));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "LeadMunshid")]
    public async Task<IActionResult> Delete(int id)
    {
        var maqam = await _db.Maqamat.FindAsync(id);
        if (maqam == null) return NotFound(new { error = "المقام غير موجود" });
        maqam.IsActive = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
