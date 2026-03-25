// Current shared poem page for ديوان الصوفية
import { requireAuth, getUser } from '../auth.js';
import { currentApi } from '../api.js';
import { t, applyLang, getLang } from '../i18n.js';
import { buildNav, showToast, showLoading, showEmpty, categoryBadge, hadraSectionBadge, formatDate, updateConnectionStatus } from '../ui.js';
import { connectSignalR, disconnectSignalR, getConnectionStatus } from '../signalr.js';

if (!requireAuth()) return;

let currentPoem = null;
let lastUpdate = null;

document.addEventListener('DOMContentLoaded', async () => {
  applyLang();
  
  // Setup UI
  document.getElementById('nav').innerHTML = buildNav('current-poem');
  document.getElementById('pageTitle').textContent = t('currentPoem');
  
  // Setup event listeners
  setupEventListeners();
  
  // Load current poem
  await loadCurrentPoem();
  
  // Setup SignalR connection
  setupRealtimeConnection();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  disconnectSignalR();
});

function setupEventListeners() {
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', loadCurrentPoem);
  
  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
  });
}

async function loadCurrentPoem(showLoadingSpinner = true) {
  const container = document.getElementById('poemContent');
  
  if (showLoadingSpinner) {
    showLoading(container);
  }
  
  try {
    const response = await currentApi.getPoem();
    
    if (response && response.poem) {
      currentPoem = response;
      lastUpdate = new Date();
      renderCurrentPoem(container, response);
    } else {
      showEmpty(container, t('noCurrentPoem'), 'record_voice_over');
    }
    
  } catch (error) {
    console.error('Error loading current poem:', error);
    showEmpty(container, t('noCurrentPoem'), 'record_voice_over');
  }
}

function renderCurrentPoem(container, data) {
  const { poem, sharedBy, sharedAt, message } = data;
  const lang = getLang();
  
  const poetName = lang === 'ar' ? poem.poetNameAr : poem.poetNameEn;
  const maqamName = lang === 'ar' ? poem.maqamNameAr : poem.maqamNameEn;
  
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
    
    <div class="current-poem-display">
      <div class="poem-header text-center" style="margin-bottom: 2rem;">
        <h1 class="poem-title text-gold">${poem.title}</h1>
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
        <div class="poem-notes glass-panel" style="margin: 2rem 0; text-center;">
          <h3>${t('notes')}</h3>
          <p class="text-muted">${poem.notes}</p>
        </div>
      ` : ''}
      
      <div class="poem-footer text-center text-sm text-muted" style="margin-top: 2rem;">
        <p><strong>${t('createdBy')}:</strong> ${poem.createdByUserName || 'غير معروف'}</p>
        <p><strong>${t('lastUpdated')}:</strong> ${formatDate(lastUpdate)}</p>
      </div>
    </div>
  `;
  
  // Update connection status
  updateConnectionStatus(getConnectionStatus());
}

function setupRealtimeConnection() {
  // Connect to SignalR hub
  connectSignalR(
    // On poem update
    (data) => {
      console.log('Current poem updated via SignalR', data);
      
      if (data && data.poem) {
        currentPoem = data;
        lastUpdate = new Date();
        
        const container = document.getElementById('poemContent');
        renderCurrentPoem(container, data);
        
        // Show notification
        showToast(t('poemUpdated'), 'success');
      }
    },
    // On wasla update (not needed here)
    null
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