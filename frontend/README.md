# ديوان الصوفية - Frontend

A mobile-first, production-ready frontend for the **ديوان الصوفية** (Sufi Poems) application.

## Features

- 🌙 **Dark glassmorphism design** inspired by Sketch designs
- 📱 **Mobile-first** responsive layout (RTL Arabic support)
- 🔐 **JWT Authentication** with role-based access (Munshid / LeadMunshid)
- 📖 **Browse poems** with search, filters by maqam/poet/category, and pagination
- ✍️ **Poem management** (create, edit, delete) — LeadMunshid only
- 🎵 **Wasla playlists** — create, manage, add/remove poems
- 📡 **Live sharing** — real-time current poem & wasla with polling fallback (20s)
- 🔖 **Bookmarks** saved locally
- ⚡ **No build tools** — pure vanilla JavaScript with ES6 modules

## Project Structure

```
frontend/
├── index.html              # Home / landing page
├── login.html              # Authentication page
├── css/
│   └── design.css          # Shared design system (glass, animations, etc.)
├── js/
│   ├── config.js           # API base URL configuration
│   ├── api.js              # All backend API calls
│   ├── auth.js             # JWT token handling
│   ├── ui.js               # Toast notifications, modals, loading states
│   ├── utils.js            # Helper functions, Arabic normalization
│   ├── signalr.js          # Real-time polling integration
│   └── pages/
│       ├── login.js
│       ├── home.js
│       ├── poems-list.js
│       ├── add-poem.js
│       ├── view-poem.js
│       ├── waslat.js
│       ├── current-poem.js
│       └── current-wasla.js
└── pages/
    ├── poems.html          # Poems catalog
    ├── add-poem.html       # Add/edit poem form
    ├── view-poem.html      # Poem reading view
    ├── waslat.html         # Playlists management
    ├── current-poem.html   # Live current poem
    └── current-wasla.html  # Live current wasla
```

## Setup

### 1. Start the Backend API

```bash
cd src/DivanSufi.WebApi
dotnet run
# Backend runs at http://localhost:5000
```

### 2. Configure API URL (if needed)

Edit `frontend/js/config.js` and update `API_BASE` if your backend runs on a different port:

```js
export const API_BASE = 'http://localhost:5000';
```

### 3. Serve the Frontend

The frontend requires a local HTTP server (ES6 modules don't work from `file://`):

```bash
# Option A: Python (built-in)
cd frontend
python3 -m http.server 5500

# Option B: Node.js http-server
npx http-server frontend -p 5500

# Option C: VS Code Live Server extension (opens at port 5500)
# Just right-click index.html → "Open with Live Server"
```

Open: **http://localhost:5500**

### 4. Login

| Username   | Password      | Role          |
|------------|---------------|---------------|
| `lead`     | lead123       | منشد رئيسي   |
| `ahmad`    | ahmad123      | منشد          |
| `mohammed` | mohammed123   | منشد          |

## Pages

| URL | Description |
|-----|-------------|
| `/index.html` | Home / landing page |
| `/login.html` | Login form |
| `/pages/poems.html` | Browse poems catalog |
| `/pages/view-poem.html?id=X` | Read a poem |
| `/pages/add-poem.html` | Add poem (LeadMunshid) |
| `/pages/add-poem.html?id=X` | Edit poem (LeadMunshid) |
| `/pages/waslat.html` | Manage playlists |
| `/pages/current-poem.html` | Live current poem |
| `/pages/current-wasla.html` | Live current wasla |

## Production Deployment

For production, deploy the `frontend/` folder to any static hosting provider:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag & drop the `frontend/` folder
- **GitHub Pages**: Push to `gh-pages` branch
- **Nginx/Apache**: Serve the `frontend/` directory

Update `frontend/js/config.js` with your production API URL:

```js
export const API_BASE = 'https://your-api.example.com';
```

Update `src/DivanSufi.WebApi/appsettings.json` to add your frontend domain to CORS:

```json
{
  "AllowedOrigins": ["https://your-frontend.example.com"]
}
```
