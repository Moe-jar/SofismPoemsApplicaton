# Deployment Guide — ديوان الصوفية (Sofism Poems Application)

This guide explains how to deploy the application with:
- **Database**: [Neon](https://neon.tech) (serverless PostgreSQL)
- **Backend**: [Render](https://render.com) (ASP.NET Core Web API)
- **Frontend**: [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (static hosting)

---

## 1. Neon PostgreSQL Setup

1. Sign up at <https://neon.tech> and create a new project.
2. Choose a region close to your Render deployment region.
3. Copy the **Connection String** from the Neon dashboard (format: `postgres://user:pass@host/db?sslmode=require`).
4. Keep it handy — you will paste it into Render as `DATABASE_URL`.

> **Note**: The application automatically converts the `postgres://` URL format to the Npgsql key=value format used by EF Core. No manual conversion is needed.

---

## 2. Render Backend Deployment

### Option A – Auto-deploy via `render.yaml` (recommended)

1. Fork / push this repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com) → **New → Blueprint**.
3. Connect your GitHub repo. Render will detect `render.yaml` automatically.
4. Set the following **secret** environment variables in the Render service settings:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon connection string (`postgres://...`) |
| `JWT_KEY` | Strong random secret (≥ 32 characters) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend URLs |

5. Click **Apply** and wait for the first build to complete.

### Option B – Manual Docker deploy

1. Create a new **Web Service** on Render.
2. Connect your GitHub repo.
3. Set **Environment** to `Docker`.
4. Set **Dockerfile path** to `src/DivanSufi.WebApi/Dockerfile`.
5. Set **Docker Build Context** to the root of the repo (`.`).
6. Add the environment variables listed in the table above.

### Database Migrations

EF Core migrations run automatically on startup via `SeedData.Seed()` which calls `database.Migrate()`. The first deploy will create all tables and seed initial data.

---

## 3. Frontend Deployment

### Option A – Vercel

1. Import the repository on [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `frontend`.
3. Add an environment variable `API_BASE` with your Render backend URL (e.g. `https://divan-sufi-api.onrender.com`).
4. The CI workflow (`.github/workflows/deploy-frontend.yml`) will substitute the URL automatically on push to `main`.

### Option B – Netlify

1. Create a new site from Git on [Netlify](https://app.netlify.com).
2. Set **Publish directory** to `frontend`.
3. Add environment variable `API_BASE` in **Site settings → Environment variables**.
4. Add a build command: `sed -i "s|http://localhost:5000|$API_BASE|g" js/config.js`

### Configuring the API URL manually

Open `frontend/js/config.js` and replace the localhost fallback with your Render URL:

```js
export const API_BASE = window.__API_BASE__ || 'https://your-service.onrender.com';
```

Or, to set it at runtime without modifying the file, add an inline script to `frontend/index.html` **before** the other scripts:

```html
<script>window.__API_BASE__ = 'https://your-service.onrender.com';</script>
```

---

## 4. GitHub Actions Secrets

Add these secrets in **Settings → Secrets and variables → Actions**:

| Secret | Used by | Description |
|---|---|---|
| `RENDER_SERVICE_ID` | deploy-backend | Render service ID (from service URL) |
| `RENDER_DEPLOY_KEY` | deploy-backend | Render deploy hook key |
| `VERCEL_TOKEN` | deploy-frontend | Vercel API token |
| `API_BASE` | deploy-frontend | Backend URL for URL substitution |

---

## 5. Local Development with PostgreSQL (Docker Compose)

A `docker-compose.yml` is provided to run the full stack locally using PostgreSQL (mirrors production).

```bash
docker compose up --build
```

The API will be available at `http://localhost:5000` and PostgreSQL on port `5432`.

For local development with SQLite (simpler), just run the project normally:

```bash
cd src
dotnet run --project DivanSufi.WebApi
```

SQLite (`divan_sufi.db`) is used automatically when `DATABASE_URL` is not set and the connection string points to a `.db` file.

---

## 6. Environment Variables Reference

See `src/DivanSufi.WebApi/.env.example` for the full backend variable list.
See `frontend/.env.example` for the frontend variable list.

### Backend (`src/DivanSufi.WebApi/.env.example`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ Production | Neon postgres:// connection string |
| `JWT_KEY` | ✅ Production | JWT signing secret (≥ 32 chars) |
| `JWT_ISSUER` | ⬜ Optional | Defaults to `DivanSufi` |
| `JWT_AUDIENCE` | ⬜ Optional | Defaults to `DivanSufiUsers` |
| `ALLOWED_ORIGINS` | ✅ Production | Comma-separated CORS origins |
| `ASPNETCORE_ENVIRONMENT` | ✅ Production | Set to `Production` |

---

## 7. Architecture Diagram

```
Browser ──► Vercel/Netlify (frontend/*)
              │  HTTP/WebSocket
              ▼
         Render Web Service
         (ASP.NET Core 8, Docker)
              │  EF Core / Npgsql
              ▼
         Neon PostgreSQL
         (serverless, auto-scale)
```
