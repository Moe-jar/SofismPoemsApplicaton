using System.Text;
using DivanSufi.Application.Interfaces;
using DivanSufi.Infrastructure;
using DivanSufi.Infrastructure.Persistence;
using DivanSufi.WebApi.Hubs;
using DivanSufi.WebApi.Middleware;
using DivanSufi.WebApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore; 

var builder = WebApplication.CreateBuilder(args);

// JWT settings
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY")
             ?? builder.Configuration["Jwt:Key"]
             ?? throw new InvalidOperationException(
                 "JWT signing key is not configured. Set JWT_KEY environment variable or Jwt:Key in appsettings.");

var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
                ?? builder.Configuration["Jwt:Issuer"]
                ?? "DivanSufi";

var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
                  ?? builder.Configuration["Jwt:Audience"]
                  ?? "DivanSufiUsers";

// Services
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DivanSufi API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddScoped<ICurrentStateHub, CurrentStateHubService>();

// OPEN CORS: accept any origin
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
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

// Database seed
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var shouldSeed = app.Environment.IsDevelopment()
                         || (bool.TryParse(Environment.GetEnvironmentVariable("ALLOW_SEED"), out var allow) && allow);

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

// Middleware
app.UseCors();

app.UseMiddleware<ExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

// Simple routes so / and /health do not return 404
app.MapGet("/", () => Results.Ok(new
{
    message = "DivanSufi API is running",
    swagger = "/swagger"
}));

app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy"
}));

app.MapControllers();
app.MapHub<DivanHub>("/hubs/divan");

app.Run();