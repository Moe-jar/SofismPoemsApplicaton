// Login page logic for ديوان الصوفية
import { authApi } from '../api.js';
import { setAuth, isLoggedIn } from '../auth.js';
import { showToast } from '../ui.js';

// Redirect if already logged in
if (isLoggedIn()) {
  window.location.href = '../index.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const submitBtn = document.getElementById('submitBtn');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorMsg = document.getElementById('errorMsg');

  const showError = (msg) => {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.classList.remove('hidden');
    } else {
      showToast(msg, 'error');
    }
  };

  const hideError = () => {
    if (errorMsg) errorMsg.classList.add('hidden');
  };

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const username = usernameInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!username || !password) {
      showError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    submitBtn.disabled = true;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span class="material-symbols-outlined animate-spin"
      style="animation:spin 0.8s linear infinite">progress_activity</span> جاري الدخول...`;

    try {
      const response = await authApi.login(username, password);
      setAuth(response.token, {
        id: response.userId,
        fullName: response.fullName,
        username: response.username,
        role: response.role,
      });
      showToast(`أهلاً ${response.fullName} 👋`, 'success');
      setTimeout(() => { window.location.href = '../index.html'; }, 800);
    } catch (error) {
      showError(error.message === 'Unauthorized' || error.message?.includes('401')
        ? 'اسم المستخدم أو كلمة المرور غير صحيحة'
        : (error.message || 'حدث خطأ. حاول مجدداً.'));
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  // Focus first field
  usernameInput?.focus();
});
