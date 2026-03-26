using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DivanSufi.Application.Interfaces;
using DivanSufi.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DivanSufi.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(User user)
    {
        // Read JWT key from environment variable first, then fallback to configuration
        var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")
                     ?? _config["Jwt:Key"]
                     ?? throw new InvalidOperationException("JWT signing key is not configured. Set JWT_KEY environment variable or Jwt:Key in appsettings.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.GivenName, user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
        };

        // Read Issuer and Audience from environment variables first, then fallback to configuration
        var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? _config["Jwt:Issuer"] ?? "DivanSufi";
        var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? _config["Jwt:Audience"] ?? "DivanSufiUsers";

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
