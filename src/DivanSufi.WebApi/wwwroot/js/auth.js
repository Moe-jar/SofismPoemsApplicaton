// Authentication utilities for ديوان الصوفية

export function getToken() { 
  return localStorage.getItem('divan_token'); 
}

export function getUser() {
  const u = localStorage.getItem('divan_user');
  return u ? JSON.parse(u) : null;
}

export function setAuth(token, user) {
  localStorage.setItem('divan_token', token);
  localStorage.setItem('divan_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('divan_token');
  localStorage.removeItem('divan_user');
}

export function isLoggedIn() { 
  return !!getToken(); 
}

export function isLead() {
  const u = getUser();
  return u && u.role === 'LeadMunshid';
}

export function requireAuth() {
  if (!isLoggedIn()) { 
    window.location.href = '/index.html'; 
    return false; 
  }
  return true;
}

export function requireLead() {
  if (!isLead()) { 
    window.location.href = '/home.html'; 
    return false; 
  }
  return true;
}

export function logout() {
  clearAuth();
  window.location.href = '/index.html';
}