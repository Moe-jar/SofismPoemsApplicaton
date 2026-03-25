// Configuration for ديوان الصوفية Frontend
// In production, API_BASE is substituted by the build step with the actual Render URL.
// Locally it defaults to localhost:5000.
export const API_BASE = window.__API_BASE__ || 'http://localhost:5000';
export const SIGNALR_HUB = `${API_BASE}/hubs/divan`;
export const POLL_INTERVAL = 20000; // 20 seconds polling fallback
