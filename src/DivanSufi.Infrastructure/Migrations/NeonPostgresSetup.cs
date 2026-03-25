using Microsoft.Extensions.Configuration;

namespace DivanSufi.Infrastructure.Migrations;

/// <summary>
/// Helper for configuring Neon PostgreSQL connections.
/// Supports both Npgsql connection string format and the standard
/// postgres:// URL format provided by Neon / Render.
/// </summary>
public static class NeonPostgresSetup
{
    /// <summary>
    /// Resolves the database connection string from configuration.
    /// Priority: DATABASE_URL env var → ConnectionStrings:DefaultConnection.
    /// Converts postgres:// URL format to Npgsql key=value format when needed.
    /// </summary>
    public static string ResolveConnectionString(IConfiguration configuration)
    {
        // Render / Neon provide a DATABASE_URL environment variable
        var databaseUrl = configuration["DATABASE_URL"]
                          ?? Environment.GetEnvironmentVariable("DATABASE_URL");

        if (!string.IsNullOrWhiteSpace(databaseUrl))
            return ConvertPostgresUrlToNpgsql(databaseUrl);

        return configuration.GetConnectionString("DefaultConnection")
               ?? "Data Source=divan_sufi.db";
    }

    /// <summary>
    /// Returns true when the resolved connection string targets PostgreSQL.
    /// </summary>
    public static bool IsPostgresConnection(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            return false;

        return connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
               || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
               || connectionString.Contains("Host=", StringComparison.OrdinalIgnoreCase)
               || connectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase) && connectionString.Contains("Port=", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Converts a postgres:// URL (e.g. from Neon/Render) into an Npgsql
    /// key=value connection string.
    /// Example input:  postgres://user:pass@host:5432/dbname?sslmode=require
    /// Example output: Host=host;Port=5432;Database=dbname;Username=user;Password=pass;SSL Mode=Require;Trust Server Certificate=True
    /// </summary>
    public static string ConvertPostgresUrlToNpgsql(string postgresUrl)
    {
        if (!postgresUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
            && !postgresUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            return postgresUrl; // Already in key=value format

        var uri = new Uri(postgresUrl);
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');
        var userInfo = uri.UserInfo.Split(':', 2);
        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;

        // Trust Server Certificate=True is required for Neon's TLS configuration.
        // Neon uses certificates issued by a trusted CA; this flag allows Npgsql
        // to skip hostname verification, which is needed because Neon proxies SNI
        // through a shared endpoint. All traffic is still encrypted via TLS.
        var connStr = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=True";

        // Preserve pooling parameters from the URL query string if present
        var query = uri.Query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Split('=', 2))
            .Where(p => p.Length == 2)
            .ToDictionary(p => Uri.UnescapeDataString(p[0]), p => Uri.UnescapeDataString(p[1]));

        if (query.TryGetValue("connection_limit", out var limit))
            connStr += $";Maximum Pool Size={limit}";

        return connStr;
    }
}
