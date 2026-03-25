using DivanSufi.Application.Interfaces;
using DivanSufi.Infrastructure.Migrations;
using DivanSufi.Infrastructure.Persistence;
using DivanSufi.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DivanSufi.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = NeonPostgresSetup.ResolveConnectionString(configuration);
        var usePostgres = NeonPostgresSetup.IsPostgresConnection(connectionString);

        services.AddDbContext<AppDbContext>(options =>
        {
            if (usePostgres)
                options.UseNpgsql(connectionString, npgsql =>
                    npgsql.EnableRetryOnFailure(3));
            else
                options.UseSqlite(connectionString);
        });

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<ITokenService, TokenService>();

        return services;
    }
}
