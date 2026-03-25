// API module for ديوان الصوفية
const API_BASE = '';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('divan_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('divan_token');
    localStorage.removeItem('divan_user');
    window.location.href = '/index.html';
    return;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

// Auth API
export const authApi = {
  login: (username, password) => apiFetch('/api/auth/login', { 
    method: 'POST', 
    body: JSON.stringify({ username, password }) 
  }),
  me: () => apiFetch('/api/auth/me'),
};

// Poets API
export const poetsApi = {
  getAll: () => apiFetch('/api/poets'),
  create: (data) => apiFetch('/api/poets', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  update: (id, data) => apiFetch(`/api/poets/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (id) => apiFetch(`/api/poets/${id}`, { method: 'DELETE' }),
};

// Maqamat API
export const maqamatApi = {
  getAll: () => apiFetch('/api/maqamat'),
  create: (data) => apiFetch('/api/maqamat', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  update: (id, data) => apiFetch(`/api/maqamat/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (id) => apiFetch(`/api/maqamat/${id}`, { method: 'DELETE' }),
};

// Poems API
export const poemsApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== '')
    );
    return apiFetch(`/api/poems?${qs}`);
  },
  getById: (id) => apiFetch(`/api/poems/${id}`),
  create: (data) => apiFetch('/api/poems', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  update: (id, data) => apiFetch(`/api/poems/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (id) => apiFetch(`/api/poems/${id}`, { method: 'DELETE' }),
};

// Waslat API
export const waslatApi = {
  getAll: (search) => apiFetch(`/api/waslat${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getById: (id) => apiFetch(`/api/waslat/${id}`),
  create: (data) => apiFetch('/api/waslat', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  update: (id, data) => apiFetch(`/api/waslat/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (id) => apiFetch(`/api/waslat/${id}`, { method: 'DELETE' }),
  addItem: (id, data) => apiFetch(`/api/waslat/${id}/items`, { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  removeItem: (id, itemId) => apiFetch(`/api/waslat/${id}/items/${itemId}`, { 
    method: 'DELETE' 
  }),
  reorder: (id, items) => apiFetch(`/api/waslat/${id}/items/reorder`, { 
    method: 'PUT', 
    body: JSON.stringify({ items }) 
  }),
};

// Current state API
export const currentApi = {
  getPoem: () => apiFetch('/api/current/poem'),
  sharePoem: (poemId, message) => apiFetch(`/api/current/poem/share/${poemId}`, { 
    method: 'POST', 
    body: JSON.stringify({ message }) 
  }),
  getWasla: () => apiFetch('/api/current/wasla'),
  shareWasla: (waslaId, message) => apiFetch(`/api/current/wasla/share/${waslaId}`, { 
    method: 'POST', 
    body: JSON.stringify({ message }) 
  }),
};