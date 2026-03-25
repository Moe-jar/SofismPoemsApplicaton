// UI utilities for ديوان الصوفية
import { t, getLang } from './i18n.js';
import { getUser } from './auth.js';

// Toast notifications
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('toast-show'), 10);
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Confirmation dialog
export function confirm(message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box glass-panel">
        <p class="modal-msg">${message}</p>
        <div class="modal-actions">
          <button class="btn btn-danger" id="confirmYes">${t('yes')}</button>
          <button class="btn btn-secondary" id="confirmNo">${t('cancel')}</button>
        </div>
      </div>`;
    
    document.body.appendChild(overlay);
    
    overlay.querySelector('#confirmYes').onclick = () => { 
      overlay.remove(); 
      resolve(true); 
    };
    overlay.querySelector('#confirmNo').onclick = () => { 
      overlay.remove(); 
      resolve(false); 
    };
    
    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        resolve(false);
      }
    };
  });
}

// Input dialog
export function prompt(message, defaultValue = '', type = 'text') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box glass-panel">
        <p class="modal-msg">${message}</p>
        <div class="form-group">
          <input type="${type}" class="form-control" id="promptInput" value="${defaultValue}" placeholder="${message}">
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" id="promptOk">${t('save')}</button>
          <button class="btn btn-secondary" id="promptCancel">${t('cancel')}</button>
        </div>
      </div>`;
    
    document.body.appendChild(overlay);
    
    const input = overlay.querySelector('#promptInput');
    input.focus();
    input.select();
    
    const submit = () => {
      const value = input.value.trim();
      overlay.remove();
      resolve(value || null);
    };
    
    overlay.querySelector('#promptOk').onclick = submit;
    overlay.querySelector('#promptCancel').onclick = () => { 
      overlay.remove(); 
      resolve(null); 
    };
    
    input.onkeydown = (e) => {
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') {
        overlay.remove();
        resolve(null);
      }
    };
  });
}

// Loading skeleton
export function skeletonCards(count = 3) {
  return Array.from({length: count}, (_, i) => 
    `<div class="card skeleton-card">
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line"></div>
    </div>`
  ).join('');
}

// Format date for Arabic locale
export function formatDate(dateStr, includeTime = true) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const lang = getLang();
  
  if (lang === 'ar') {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    };
    return d.toLocaleDateString('ar-SA', options);
  } else {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    };
    return d.toLocaleDateString('en-US', options);
  }
}

// Category badge with correct styling
export function categoryBadge(cat) {
  const lang = getLang();
  const categoryMap = {
    ar: { 
      Ilahiyyat: 'إلهيات', 
      Nabawiyyat: 'نبويات', 
      Mufrad: 'مفرد', 
      Hadra: 'حضرة' 
    },
    en: { 
      Ilahiyyat: 'Ilahiyyat', 
      Nabawiyyat: 'Nabawiyyat', 
      Mufrad: 'Mufrad', 
      Hadra: 'Hadra' 
    }
  };
  
  const label = categoryMap[lang][cat] || cat;
  return `<span class="badge badge-${cat.toLowerCase()}">${label}</span>`;
}

// Hadra section badge
export function hadraSectionBadge(section) {
  if (!section) return '';
  const lang = getLang();
  const sectionMap = {
    ar: { 
      Matali: 'مطالع', 
      Ruku: 'ركوع', 
      Qiyam: 'قيام' 
    },
    en: { 
      Matali: 'Matali', 
      Ruku: 'Ruku', 
      Qiyam: 'Qiyam' 
    }
  };
  
  const label = sectionMap[lang][section] || section;
  return `<span class="badge badge-${section.toLowerCase()}">${label}</span>`;
}

// Build navigation HTML
export function buildNav(activePage) {
  const user = getUser();
  const isLead = user && user.role === 'LeadMunshid';
  
  return `
    <nav class="nav-bottom">
      <a href="/home.html" class="nav-item ${activePage === 'home' ? 'active' : ''}">
        <span class="material-symbols-outlined">home</span>
      </a>
      <a href="/poems.html" class="nav-item ${activePage === 'poems' ? 'active' : ''}">
        <span class="material-symbols-outlined">menu_book</span>
      </a>
      <a href="/current-poem.html" class="nav-item ${activePage === 'current-poem' ? 'active' : ''}">
        <span class="material-symbols-outlined">record_voice_over</span>
      </a>
      <a href="/waslat.html" class="nav-item ${activePage === 'waslat' ? 'active' : ''}">
        <span class="material-symbols-outlined">playlist_play</span>
      </a>
      ${isLead ? `<a href="/reference.html" class="nav-item ${activePage === 'reference' ? 'active' : ''}">
        <span class="material-symbols-outlined">manage_accounts</span>
      </a>` : ''}
    </nav>`;
}

// Loading state management
export function showLoading(element, text = null) {
  const loadingText = text || t('loading');
  element.innerHTML = `
    <div class="text-center p-4">
      <div class="status-indicator">
        <div class="status-dot connecting"></div>
        <span>${loadingText}</span>
      </div>
    </div>`;
}

export function showError(element, error) {
  element.innerHTML = `
    <div class="text-center p-4 text-error">
      <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 1rem;">error</span>
      <p>${error || t('error')}</p>
    </div>`;
}

export function showEmpty(element, message, icon = 'inbox') {
  element.innerHTML = `
    <div class="empty-state">
      <span class="material-symbols-outlined">${icon}</span>
      <p>${message}</p>
    </div>`;
}

// Debounce function for search
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Copy to clipboard
export function copyToClipboard(text) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return Promise.resolve();
    } catch (err) {
      document.body.removeChild(textArea);
      return Promise.reject(err);
    }
  }
}

// Connection status indicator
export function updateConnectionStatus(status) {
  const indicators = document.querySelectorAll('.connection-status');
  indicators.forEach(indicator => {
    const dot = indicator.querySelector('.status-dot');
    const text = indicator.querySelector('span');
    
    if (dot && text) {
      dot.className = `status-dot ${status}`;
      switch (status) {
        case 'connected':
          text.textContent = t('realtimeConnected');
          break;
        case 'connecting':
          text.textContent = t('connectingRealtime');
          break;
        case 'disconnected':
        default:
          text.textContent = t('realtimeDisconnected');
          break;
      }
    }
  });
}

// Simple drag and drop for reordering
export function initSortable(container, onReorder) {
  let draggedElement = null;
  let placeholder = null;

  container.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('sortable-item')) {
      draggedElement = e.target;
      e.target.classList.add('dragging');
      
      // Create placeholder
      placeholder = document.createElement('div');
      placeholder.className = 'sortable-placeholder';
      placeholder.style.height = e.target.offsetHeight + 'px';
      placeholder.style.background = 'rgba(10, 87, 80, 0.2)';
      placeholder.style.border = '2px dashed rgba(10, 87, 80, 0.5)';
      placeholder.style.borderRadius = '8px';
      placeholder.style.margin = '4px 0';
    }
  });

  container.addEventListener('dragend', (e) => {
    if (e.target.classList.contains('sortable-item')) {
      e.target.classList.remove('dragging');
      if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
      draggedElement = null;
      placeholder = null;
    }
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!draggedElement || !placeholder) return;

    const afterElement = getDragAfterElement(container, e.clientY);
    if (afterElement == null) {
      container.appendChild(placeholder);
    } else {
      container.insertBefore(placeholder, afterElement);
    }
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!draggedElement || !placeholder) return;

    // Replace placeholder with dragged element
    placeholder.parentNode.insertBefore(draggedElement, placeholder);
    placeholder.parentNode.removeChild(placeholder);

    // Call reorder callback with new order
    const items = Array.from(container.querySelectorAll('.sortable-item'));
    const newOrder = items.map((item, index) => ({
      id: parseInt(item.dataset.id),
      sortOrder: index + 1
    }));

    if (onReorder) onReorder(newOrder);
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = Array.from(container.querySelectorAll('.sortable-item:not(.dragging)'));

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}