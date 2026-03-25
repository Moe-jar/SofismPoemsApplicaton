// Current shared wasla page for ديوان الصوفية
import { requireAuth, getUser } from '../auth.js';
import { currentApi } from '../api.js';
import { t, applyLang, getLang } from '../i18n.js';
import { buildNav, showToast, showLoading, showEmpty, categoryBadge, hadraSectionBadge, formatDate, updateConnectionStatus } from '../ui.js';
import { connectSignalR, disconnectSignalR, getConnectionStatus } from '../signalr.js';

if (!requireAuth()) return;

let currentWasla = null;
let lastUpdate = null;

document.addEventListener('DOMContentLoaded', async () => {
  applyLang();
  
  // Setup UI
  document.getElementById('nav').innerHTML = buildNav('waslat');
  document.getElementById('pageTitle').textContent = t('currentWasla');
  
  // Setup event listeners
  setupEventListeners();
  
  // Load current wasla
  await loadCurrentWasla();
  
  // Setup SignalR connection
  setupRealtimeConnection();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  disconnectSignalR();
});

function setupEventListeners() {
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', loadCurrentWasla);
  
  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
  });
}

async function loadCurrentWasla(showLoadingSpinner = true) {
  const container = document.getElementById('waslaContent');
  
  if (showLoadingSpinner) {
    showLoading(container);
  }
  
  try {
    const response = await currentApi.getWasla();
    
    if (response && response.wasla) {
      currentWasla = response;
      lastUpdate = new Date();
      renderCurrentWasla(container, response);
    } else {
      showEmpty(container, t('noCurrentWasla'), 'playlist_play');
    }
    
  } catch (error) {
    console.error('Error loading current wasla:', error);
    showEmpty(container, t('noCurrentWasla'), 'playlist_play');
  }
}

function renderCurrentWasla(container, data) {
  const { wasla, sharedBy, sharedAt, message } = data;
  const lang = getLang();
  
  container.innerHTML = `
    <div class="shared-info glass-panel" style="margin-bottom: 2rem; text-align: center;">
      <div class="status-indicator connection-status" style="margin-bottom: 1rem;">
        <div class="status-dot"></div>
        <span></span>
      </div>
      <div class="text-sm text-muted">
        <p><strong>${t('sharedBy')}:</strong> ${sharedBy}</p>
        <p><strong>${t('sharedAt')}:</strong> ${formatDate(sharedAt)}</p>
        ${message ? `<p class="text-primary" style="margin-top: 0.5rem;">"${message}"</p>` : ''}
      </div>
    </div>
    
    <div class="current-wasla-display">
      <div class="wasla-header text-center glass-panel" style="margin-bottom: 2rem;">
        <h1 class="text-gold">${wasla.name}</h1>
        ${wasla.description ? `<p class="text-muted text-lg">${wasla.description}</p>` : ''}
        <div class="wasla-stats text-sm text-muted" style="margin-top: 1rem;">
          <p><strong>${t('totalPoems')}:</strong> ${wasla.items ? wasla.items.length : 0}</p>
          <p><strong>${t('createdBy')}:</strong> ${wasla.createdByUserName || 'غير معروف'}</p>
        </div>
      </div>
      
      <div class="wasla-items">
        <h2 class="text-center" style="margin-bottom: 2rem;">${t('waslaItems')}</h2>
        <div id="waslaItemsList"></div>
      </div>
      
      <div class="wasla-footer text-center text-sm text-muted" style="margin-top: 2rem;">
        <p><strong>${t('lastUpdated')}:</strong> ${formatDate(lastUpdate)}</p>
      </div>
    </div>
  `;
  
  // Render wasla items
  renderWaslaItems();
  
  // Update connection status
  updateConnectionStatus(getConnectionStatus());
}

function renderWaslaItems() {
  const itemsList = document.getElementById('waslaItemsList');
  const lang = getLang();
  
  if (!currentWasla || !currentWasla.wasla.items || currentWasla.wasla.items.length === 0) {
    showEmpty(itemsList, t('noPoems'), 'queue_music');
    return;
  }
  
  itemsList.innerHTML = '';
  
  currentWasla.wasla.items.forEach((item, index) => {
    const poetName = lang === 'ar' ? item.poetNameAr : item.poetNameEn;
    const maqamName = lang === 'ar' ? item.maqamNameAr : item.maqamNameEn;
    
    const itemElement = document.createElement('div');
    itemElement.className = 'poem-item card-clickable';
    itemElement.innerHTML = `
      <div class="poem-number">${index + 1}</div>
      <div class="poem-info">
        <div class="poem-title">
          ${item.title}
        </div>
        <div class="poem-meta">
          ${poetName} • ${maqamName}
          <span style="margin-right: 1rem;">
            ${categoryBadge(item.category)}
            ${item.hadraSection ? hadraSectionBadge(item.hadraSection) : ''}
          </span>
        </div>
        ${item.notes ? `<div class="text-sm text-muted">${item.notes}</div>` : ''}
        
        <!-- Poem preview -->
        <div class="poem-preview font-arabic" style="color: var(--text-muted); font-size: 1rem; line-height: 1.5; margin: 1rem 0; padding: 1rem; background: rgba(10, 87, 80, 0.1); border-radius: 0.5rem; border: 1px solid rgba(10, 87, 80, 0.2);">
          ${item.body.length > 200 ? item.body.substring(0, 200) + '...' : item.body}
        </div>
      </div>
    `;
    
    // Make clickable to view full poem
    itemElement.addEventListener('click', () => {
      showPoemModal(item);
    });
    
    itemsList.appendChild(itemElement);
  });
}

function showPoemModal(poem) {
  const lang = getLang();
  const poetName = lang === 'ar' ? poem.poetNameAr : poem.poetNameEn;
  const maqamName = lang === 'ar' ? poem.maqamNameAr : poem.maqamNameEn;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box glass-panel" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
      <div class="poem-header text-center" style="margin-bottom: 2rem;">
        <h2 class="text-gold">${poem.title}</h2>
        <div class="poem-meta" style="margin: 1rem 0;">
          <p class="text-lg">
            <span class="text-gold">${t('poet')}:</span> ${poetName}
          </p>
          <p class="text-lg">
            <span class="text-gold">${t('maqam')}:</span> ${maqamName}
          </p>
          <div class="flex gap-2 justify-center" style="margin: 1rem 0;">
            ${categoryBadge(poem.category)}
            ${poem.hadraSection ? hadraSectionBadge(poem.hadraSection) : ''}
          </div>
        </div>
      </div>
      
      <div class="poem-body">
        ${poem.body}
      </div>
      
      ${poem.notes ? `
        <div class="poem-notes glass-panel" style="margin: 2rem 0;">
          <h3>${t('notes')}</h3>
          <p class="text-muted">${poem.notes}</p>
        </div>
      ` : ''}
      
      <div class="modal-actions">
        <button class="btn btn-secondary" id="closePoemModal">${t('back')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#closePoemModal').onclick = () => modal.remove();
  modal.onclick = (e) => e.target === modal && modal.remove();
}

function setupRealtimeConnection() {
  // Connect to SignalR hub
  connectSignalR(
    // On poem update (not needed here)
    null,
    // On wasla update
    (data) => {
      console.log('Current wasla updated via SignalR', data);
      
      if (data && data.wasla) {
        currentWasla = data;
        lastUpdate = new Date();
        
        const container = document.getElementById('waslaContent');
        renderCurrentWasla(container, data);
        
        // Show notification
        showToast(t('waslaUpdated'), 'success');
      }
    }
  );
  
  // Update connection status periodically
  setInterval(() => {
    updateConnectionStatus(getConnectionStatus());
  }, 5000);
  
  // Initial status update
  setTimeout(() => {
    updateConnectionStatus(getConnectionStatus());
  }, 1000);
}