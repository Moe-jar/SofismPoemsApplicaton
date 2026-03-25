// UI utilities - Toast, Modal, Loading for ديوان الصوفية

// ─── Toast Notifications ──────────────────────────────────────────────────────
const toastContainer = document.createElement('div');
toastContainer.id = 'toast-container';
toastContainer.style.cssText = `
  position: fixed; top: 1.5rem; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem;
  pointer-events: none; min-width: 280px; max-width: 90vw;
`;
document.addEventListener('DOMContentLoaded', () => document.body.appendChild(toastContainer));

export function showToast(message, type = 'info', duration = 3500) {
  const colors = {
    success: 'rgba(16,185,129,0.95)',
    error:   'rgba(239,68,68,0.95)',
    warning: 'rgba(245,158,11,0.95)',
    info:    'rgba(21,140,130,0.95)',
  };
  const icons = { success: 'check_circle', error: 'error', warning: 'warning', info: 'info' };

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: ${colors[type] || colors.info};
    color: #fff; padding: 0.875rem 1.25rem; border-radius: 0.875rem;
    font-family: 'Cairo','Manrope',sans-serif; font-size: 0.9rem; font-weight: 600;
    display: flex; align-items: center; gap: 0.625rem;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    pointer-events: all; cursor: pointer;
    opacity: 0; transform: translateY(-10px);
    transition: opacity 0.25s ease, transform 0.25s ease;
    direction: rtl;
  `;
  toast.innerHTML = `<span class="material-symbols-outlined" style="font-size:1.1rem;">${icons[type]}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  const remove = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  };
  toast.onclick = remove;
  setTimeout(remove, duration);
}

// ─── Modal / Confirm Dialog ───────────────────────────────────────────────────
export function showConfirm(message, title = 'تأكيد') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.7);
      backdrop-filter: blur(4px); z-index: 8888;
      display: flex; align-items: center; justify-content: center; padding: 1rem;
    `;
    overlay.innerHTML = `
      <div style="
        background: rgba(28,38,38,0.95); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 1.25rem; padding: 2rem; max-width: 400px; width: 100%;
        font-family: 'Cairo','Manrope',sans-serif; direction: rtl;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      ">
        <h3 style="color:#fff;font-size:1.125rem;font-weight:700;margin-bottom:0.75rem;">${title}</h3>
        <p style="color:rgba(255,255,255,0.7);margin-bottom:1.5rem;line-height:1.6;">${message}</p>
        <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
          <button id="confirmNo" style="
            padding: 0.625rem 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.15);
            background: transparent; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 0.875rem;
            font-family: inherit; font-weight: 600;
          ">إلغاء</button>
          <button id="confirmYes" style="
            padding: 0.625rem 1.25rem; border-radius: 0.75rem; border: none;
            background: #ef4444; color: #fff; cursor: pointer; font-size: 0.875rem;
            font-family: inherit; font-weight: 600;
          ">تأكيد</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirmYes').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#confirmNo').onclick  = () => { overlay.remove(); resolve(false); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
  });
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function showLoading(containerId, message = 'جاري التحميل...') {
  const el = containerId ? document.getElementById(containerId) : document.body;
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:3rem;gap:1rem;color:rgba(255,255,255,0.6);font-family:'Cairo',sans-serif;">
      <div style="
        width:40px;height:40px;border:3px solid rgba(21,140,130,0.3);
        border-top-color:#158c82;border-radius:50%;animation:spin 0.8s linear infinite;
      "></div>
      <span>${message}</span>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function showEmpty(containerId, message = 'لا توجد بيانات', icon = 'inbox') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:4rem 2rem;gap:1rem;color:rgba(255,255,255,0.4);font-family:'Cairo',sans-serif;text-align:center;">
      <span class="material-symbols-outlined" style="font-size:3rem;opacity:0.5;">${icon}</span>
      <p style="font-size:0.95rem;">${message}</p>
    </div>`;
}

// ─── Render User Info ─────────────────────────────────────────────────────────
export function renderUserBadge(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const user = JSON.parse(localStorage.getItem('divan_user') || 'null');
  if (!user) return;
  const roleLabel = user.role === 'LeadMunshid' ? 'منشد رئيسي' : 'منشد';
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:0.5rem;">
      <div style="width:2rem;height:2rem;border-radius:50%;background:rgba(21,140,130,0.3);
        border:1px solid rgba(21,140,130,0.5);display:flex;align-items:center;justify-content:center;">
        <span class="material-symbols-outlined" style="font-size:1rem;color:#158c82;">person</span>
      </div>
      <div style="display:flex;flex-direction:column;line-height:1.2;">
        <span style="font-size:0.8rem;font-weight:700;color:#fff;">${user.fullName || user.username}</span>
        <span style="font-size:0.65rem;color:rgba(255,255,255,0.5);">${roleLabel}</span>
      </div>
    </div>`;
}
