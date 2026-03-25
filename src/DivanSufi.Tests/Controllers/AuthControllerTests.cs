using DivanSufi.Application.DTOs.Auth;
using DivanSufi.Domain.Entities;
using DivanSufi.Domain.Enums;
using DivanSufi.Infrastructure.Persistence;
using DivanSufi.Infrastructure.Services;
using DivanSufi.WebApi.Controllers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace DivanSufi.Tests.Controllers;

public class AuthControllerTests
{
    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static TokenService CreateTokenService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "DivanSufiSecretKeyForJwtTokenGeneration2024!",
                ["Jwt:Issuer"] = "DivanSufi",
                ["Jwt:Audience"] = "DivanSufiUsers"
            })
            .Build();
        return new TokenService(config);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsToken()
    {
        using var db = CreateContext();
        db.Users.Add(new User
        {
            Id = 1, FullName = "Test Lead", Username = "testuser",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass123"),
            Role = UserRole.LeadMunshid, IsActive = true
        });
        db.SaveChanges();

        var ctrl = new AuthController(db, CreateTokenService());
        var result = await ctrl.Login(new LoginRequest("testuser", "pass123"));

        var ok = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var response = Assert.IsType<LoginResponse>(ok.Value);
        Assert.NotEmpty(response.Token);
        Assert.Equal("LeadMunshid", response.Role);
    }

    [Fact]
    public async Task Login_WrongPassword_ReturnsUnauthorized()
    {
        using var db = CreateContext();
        db.Users.Add(new User
        {
            Id = 1, FullName = "Test", Username = "testuser",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("correct"),
            Role = UserRole.Munshid, IsActive = true
        });
        db.SaveChanges();

        var ctrl = new AuthController(db, CreateTokenService());
        var result = await ctrl.Login(new LoginRequest("testuser", "wrong"));

        Assert.IsType<Microsoft.AspNetCore.Mvc.UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task Login_InactiveUser_ReturnsUnauthorized()
    {
        using var db = CreateContext();
        db.Users.Add(new User
        {
            Id = 1, FullName = "Test", Username = "inactive",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass"),
            Role = UserRole.Munshid, IsActive = false
        });
        db.SaveChanges();

        var ctrl = new AuthController(db, CreateTokenService());
        var result = await ctrl.Login(new LoginRequest("inactive", "pass"));
        Assert.IsType<Microsoft.AspNetCore.Mvc.UnauthorizedObjectResult>(result);
    }

    [Fact]
    public async Task Login_UnknownUser_ReturnsUnauthorized()
    {
        using var db = CreateContext();
        var ctrl = new AuthController(db, CreateTokenService());
        var result = await ctrl.Login(new LoginRequest("nobody", "x"));
        Assert.IsType<Microsoft.AspNetCore.Mvc.UnauthorizedObjectResult>(result);
    }
}