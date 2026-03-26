using System.Text;
using DivanSufi.Application.Interfaces;
using DivanSufi.Infrastructure;
using DivanSufi.Infrastructure.Persistence;
using DivanSufi.WebApi.Hubs;
using DivanSufi.WebApi.Middleware;
using DivanSufi.WebApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Allow environment variables like JWT_KEY / JWT_ISSUER / JWT_AUDIENCE to override
// the appsettings values (used on Render where double-underscore naming is inconvenient).
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")
             ?? builder.Configuration["Jwt:Key"]
             ?? throw new InvalidOperationException("JWT signing key is not configured. Set JWT_KEY environment variable or Jwt:Key in appsettings.");
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
                ?? builder.Configuration["Jwt:Issuer"]
                ?? "DivanSufi";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                  ?? builder.Configuration["Jwt:Audience"]
                  ?? "DivanSufiUsers";

builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<ICurrentStateHub, CurrentStateHubService>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        // Allow common frontend dev servers and production hosts
        var origins = new List<string>
        {
            "http://localhost:5500", "http://127.0.0.1:5500",
            "http://localhost:3000", "http://127.0.0.1:3000",
            "http://localhost:8080", "http://127.0.0.1:8080",
            "http://localhost:4200", "http://127.0.0.1:4200",
        };
        if (builder.Environment.IsDevelopment())
            origins.Add("null"); // allow file:// origins in development only

        // Allow additional origins from configuration (for production deployment)
        var configOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
        if (configOrigins?.Length > 0) origins.AddRange(configOrigins);

        // Also support ALLOWED_ORIGINS env var (comma-separated) used on Render
        var envOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS");
        if (!string.IsNullOrWhiteSpace(envOrigins))
            origins.AddRange(envOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));

        policy.WithOrigins(origins.ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        // Only seed in development or explicitly allow via env var
        var shouldSeed = app.Environment.IsDevelopment() 
                         || bool.TryParse(Environment.GetEnvironmentVariable("ALLOW_SEED"), out var allow) && allow;
        
        if (shouldSeed)
            SeedData.Seed(db);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Database seeding failed");
        throw;
    }
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<DivanHub>("/hubs/divan");

app.Run();
