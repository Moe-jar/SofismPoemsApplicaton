// Waslat list page for ديوان الصوفية
import { requireAuth, getUser } from '../auth.js';
import { waslatApi } from '../api.js';
import { t, applyLang } from '../i18n.js';
import { buildNav, showToast, showLoading, showError, showEmpty, debounce, formatDate, confirm } from '../ui.js';

if (!requireAuth()) return;

let waslat = [];

document.addEventListener('DOMContentLoaded', async () => {
  applyLang();
  
  // Setup UI
  document.getElementById('nav').innerHTML = buildNav('waslat');
  
  // Setup event listeners
  setupEventListeners();
  
  // Load waslat
  await loadWaslat();
});

function setupEventListeners() {
  const user = getUser();
  const isLead = user.role === 'LeadMunshid';
  
  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
  });
  
  // Search with debouncing
  const searchInput = document.getElementById('searchInput');
  const debouncedSearch = debounce((query) => {
    loadWaslat(query);
  }, 400);
  
  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value.trim());
  });
  
  // New wasla button (lead only)
  if (isLead) {
    document.getElementById('newWaslaBtn').style.display = 'block';
    document.getElementById('newWaslaBtn').addEventListener('click', () => {
      window.location.href = '/wasla-detail.html';
    });
  }
}

async function loadWaslat(search = '') {
  const container = document.getElementById('waslatGrid');
  showLoading(container);
  
  try {
    waslat = await waslatApi.getAll(search);
    
    if (waslat && waslat.length > 0) {
      renderWaslat(container, waslat);
      updateResultsCount(waslat.length);
    } else {
      showEmpty(container, search ? t('noResults') : t('noWaslat'), 'playlist_play');
      updateResultsCount(0);
    }
    
  } catch (error) {
    console.error('Error loading waslat:', error);
    showError(container, error.message);
  }
}

function renderWaslat(container, waslat) {
  const user = getUser();
  const isLead = user.role === 'LeadMunshid';
  
  container.innerHTML = '';
  
  waslat.forEach(wasla => {
    const waslaCard = document.createElement('div');
    waslaCard.className = 'card card-clickable';
    waslaCard.innerHTML = `
      <div class="card-title">${wasla.name}</div>
      <div class="card-subtitle">
        ${wasla.description || t('noDescription')}
      </div>
      <div class="wasla-stats" style="margin: 1rem 0;">
        <div class="flex justify-between text-sm text-muted">
          <span>
            <span class="material-symbols-outlined" style="font-size: 1rem; vertical-align: middle;">queue_music</span>
            ${wasla.itemCount || 0} ${t('poems')}
          </span>
          <span>${formatDate(wasla.updatedAt, false)}</span>
        </div>
      </div>
      <div class="text-sm text-muted">
        <strong>${t('createdBy')}:</strong> ${wasla.createdByUserName || 'غير معروف'}
      </div>
      ${isLead ? `
        <div class="action-buttons" style="margin-top: 1rem;">
          <button class="btn btn-primary btn-sm share-wasla-btn" data-id="${wasla.id}">
            <span class="material-symbols-outlined">share</span>
            ${t('shareWasla')}
          </button>
          <button class="btn btn-danger btn-sm delete-wasla-btn" data-id="${wasla.id}" data-name="${wasla.name}">
            <span class="material-symbols-outlined">delete</span>
            ${t('deleteWasla')}
          </button>
        </div>
      ` : ''}
    `;
    
    // Click to view details
    waslaCard.addEventListener('click', (e) => {
      if (!e.target.closest('.action-buttons')) {
        window.location.href = `/wasla-detail.html?id=${wasla.id}`;
      }
    });
    
    // Action buttons for lead users
    if (isLead) {
      const shareBtn = waslaCard.querySelector('.share-wasla-btn');
      const deleteBtn = waslaCard.querySelector('.delete-wasla-btn');
      
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shareWasla(wasla.id, wasla.name);
      });
      
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteWasla(wasla.id, wasla.name);
      });
    }
    
    container.appendChild(waslaCard);
  });
}

function updateResultsCount(count) {
  const countElement = document.getElementById('resultsCount');
  if (count === 0) {
    countElement.textContent = '';
  } else {
    countElement.textContent = `${count} ${t('waslat')}`;
  }
}

async function shareWasla(waslaId, name) {
  try {
    const { currentApi } = await import('../api.js');
    await currentApi.shareWasla(waslaId, '');
    showToast(`${t('shared')}: ${name}`, 'success');
  } catch (error) {
    showToast(error.message || t('error'), 'error');
  }
}

async function deleteWasla(waslaId, name) {
  const confirmed = await confirm(`${t('confirmDelete')} "${name}"?`);
  if (confirmed) {
    try {
      await waslatApi.delete(waslaId);
      showToast(t('deleted'), 'success');
      
      // Reload waslat
      const searchInput = document.getElementById('searchInput');
      await loadWaslat(searchInput.value.trim());
    } catch (error) {
      showToast(error.message || t('error'), 'error');
    }
  }
}