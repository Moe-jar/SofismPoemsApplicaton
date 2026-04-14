using DivanSufi.Application.DTOs.Auth;
using DivanSufi.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DivanSufi.WebApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly ITokenService _tokenService;

    public AuthController(IAppDbContext db, ITokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == request.Username && u.IsActive);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { error = "بيانات الدخول غير صحيحة" });

        var token = _tokenService.GenerateToken(user);
        return Ok(new LoginResponse(token, user.FullName, user.Role.ToString(), user.Id, user.Username));
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var fullName = User.FindFirstValue(ClaimTypes.GivenName)!;
        var username = User.FindFirstValue(ClaimTypes.Name)!;
        var role = User.FindFirstValue(ClaimTypes.Role)!;
        return Ok(new UserDto(userId, fullName, username, role));
    }
}
