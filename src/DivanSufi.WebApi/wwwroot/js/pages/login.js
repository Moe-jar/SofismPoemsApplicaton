// Login page logic for ديوان الصوفية
import { authApi } from '../api.js';
import { setAuth, isLoggedIn } from '../auth.js';
import { t, applyLang } from '../i18n.js';
import { showToast } from '../ui.js';

// Redirect if already logged in
if (isLoggedIn()) {
  window.location.href = '/home.html';
}

document.addEventListener('DOMContentLoaded', () => {
  applyLang();
  
  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitBtn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
      showToast(t('required'), 'error');
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = t('loading');

    try {
      const response = await authApi.login(username, password);
      
      // Store auth data
      setAuth(response.token, {
        id: response.userId,
        fullName: response.fullName,
        username: response.username,
        role: response.role
      });

      // Show success and redirect
      showToast(`${t('welcome')} ${response.fullName}`, 'success');
      
      setTimeout(() => {
        window.location.href = '/home.html';
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      showToast(error.message || t('error'), 'error');
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = t('login');
    }
  });

  // Focus username field
  usernameInput.focus();
});