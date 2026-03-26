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

        services.AddDbContext<AppDbContext>(options =>
        {
            
                options.UseNpgsql(connectionString, npgsql =>
                    npgsql.EnableRetryOnFailure(3));
            

        });

        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());
        services.AddScoped<ITokenService, TokenService>();

        return services;
    }
}
