# ديوان الصوفية — Sufi Chanting App

A mobile-first Arabic RTL web application for Munshideen (Sufi chanters) to manage and share Sufi poetry.

## Tech Stack

- **Backend**: ASP.NET Core 8 Web API · Clean Architecture · EF Core + SQLite · SignalR · JWT Auth
- **Frontend**: Pure HTML + CSS + Vanilla JS (ES Modules) · Mobile-first · Arabic RTL · Dark spiritual theme

## Project Structure

```
src/
  DivanSufi.Domain/         → Entities, enums, business rules
  DivanSufi.Application/    → DTOs, interfaces, ArabicNormalizer
  DivanSufi.Infrastructure/ → EF Core, SQLite, JWT service, seed data
  DivanSufi.WebApi/         → API controllers, SignalR hub, static frontend
    wwwroot/                → Frontend (HTML/CSS/JS)
  DivanSufi.Tests/          → xUnit unit tests
```

## How to Run

### Backend (serves frontend too)

```bash
cd src/DivanSufi.WebApi
dotnet run
```

The app starts at `http://localhost:5000` (or check `Properties/launchSettings.json`).

Open `http://localhost:5000` in your browser to use the app.

### Run Tests

```bash
cd src/DivanSufi.Tests
dotnet test
```

## Default Seeded Users

| Username     | Password       | Role          |
|--------------|----------------|---------------|
| `lead`       | `lead123`      | LeadMunshid   |
| `ahmad`      | `ahmad123`     | Munshid       |
| `mohammed`   | `mohammed123`  | Munshid       |

## Roles

- **LeadMunshid (المنشد الرئيسي)**: Full management — create/edit/delete poems, manage waslat, share current poem/wasla
- **Munshid (منشد)**: Read-only — browse, search, view current poem/wasla

## Features

- **Search with Arabic Normalization**: Powerful search that handles diacritics (تشكيل), alef variants (أ، إ، آ), ya variations (ى، ي), and ta marbuta (ة، ه)
- **Real-time Updates**: SignalR for instant sharing with polling fallback (20s intervals)
- **Wasla Management**: Create ordered playlists of poems with drag-and-drop reordering
- **Mobile-first RTL Design**: Beautiful dark emerald glass theme optimized for Arabic
- **Bilingual Interface**: Arabic/English language toggle (UI only, poem text preserved)
- **Smart Categorization**: إلهيات (Divine), نبويات (Prophetic), مفرد (Individual), حضرة (Hadra) with sub-sections
- **Offline-capable**: Works without SignalR, graceful degradation

## Frontend Architecture

Built with vanilla ES6 modules for maximum compatibility and performance:

```
wwwroot/
  css/design.css          → Complete design system
  js/
    api.js                → All API calls
    auth.js               → JWT handling, role checks
    i18n.js               → Arabic/English translations
    signalr.js            → Real-time + polling fallback
    ui.js                 → Components, toasts, modals
    pages/                → Page-specific logic
```

## API Features

- **JWT Authentication** with role-based access
- **Arabic Search Normalization** for fuzzy matching
- **Pagination** with filtering and sorting
- **SignalR Hub** for real-time poem/wasla sharing
- **Clean Architecture** with proper separation of concerns

## Switch to SQL Server

1. Edit `src/DivanSufi.Infrastructure/DependencyInjection.cs`:
   - Replace `options.UseSqlite(...)` with `options.UseSqlServer(...)`
2. Update `ConnectionStrings:DefaultConnection` in `appsettings.json`
3. Add `Microsoft.EntityFrameworkCore.SqlServer` package
4. Run `dotnet ef migrations add SqlServerMigration`

## Development Notes

- All Arabic text processing uses `ArabicNormalizer` for consistent search behavior
- SignalR gracefully falls back to 20-second polling if connection fails
- Frontend uses relative API URLs (same-origin policy)
- CSS design system with RTL-first approach and Arabic typography
- Comprehensive unit tests covering normalization, seeding, and API endpoints

## Screenshots

The app features a beautiful dark theme with emerald accents, glass-morphism effects, and proper Arabic typography using Amiri and Cairo fonts. The mobile-first design ensures perfect usability on all devices.