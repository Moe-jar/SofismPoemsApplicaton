// Configuration for ديوان الصوفية Frontend
// Update API_BASE to point to your backend server in production
export const API_BASE = 'http://localhost:5000';
export const SIGNALR_HUB = `${API_BASE}/hubs/divan`;
export const POLL_INTERVAL = 20000; // 20 seconds polling fallback
