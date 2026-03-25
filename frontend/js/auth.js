// Authentication utilities for ديوان الصوفية

const TOKEN_KEY = 'divan_token';
const USER_KEY = 'divan_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const u = localStorage.getItem(USER_KEY);
  try { return u ? JSON.parse(u) : null; } catch { return null; }
}

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export function isLead() {
  const u = getUser();
  return u && u.role === 'LeadMunshid';
}

export function requireAuth(redirectTo = '../login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

export function requireLead(redirectTo = '../index.html') {
  if (!isLead()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

export function logout() {
  clearAuth();
  window.location.href = '../login.html';
}
