# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Restore dependencies (layer-cached)
COPY src/DivanSufi.Domain/DivanSufi.Domain.csproj             DivanSufi.Domain/
COPY src/DivanSufi.Application/DivanSufi.Application.csproj   DivanSufi.Application/
COPY src/DivanSufi.Infrastructure/DivanSufi.Infrastructure.csproj DivanSufi.Infrastructure/
COPY src/DivanSufi.WebApi/DivanSufi.WebApi.csproj              DivanSufi.WebApi/
RUN dotnet restore DivanSufi.WebApi/DivanSufi.WebApi.csproj

# Copy source and publish
COPY src/DivanSufi.Domain/             DivanSufi.Domain/
COPY src/DivanSufi.Application/        DivanSufi.Application/
COPY src/DivanSufi.Infrastructure/     DivanSufi.Infrastructure/
COPY src/DivanSufi.WebApi/             DivanSufi.WebApi/
RUN dotnet publish DivanSufi.WebApi/DivanSufi.WebApi.csproj \
    -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

# Render uses port 10000 by default
ENV ASPNETCORE_URLS=http://+:10000

EXPOSE 10000

ENTRYPOINT ["dotnet", "DivanSufi.WebApi.dll"]
