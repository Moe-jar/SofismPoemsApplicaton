// Poems catalog page for ديوان الصوفية
import { requireAuth, getUser } from '../auth.js';
import { poemsApi, poetsApi, maqamatApi, waslatApi } from '../api.js';
import { t, applyLang, getLang } from '../i18n.js';
import { buildNav, showToast, showLoading, showError, showEmpty, debounce, categoryBadge, hadraSectionBadge, formatDate, confirm } from '../ui.js';

if (!requireAuth()) return;

let currentPage = 1;
let isLoading = false;
let hasMore = true;
let currentFilters = {};
let poets = [];
let maqamat = [];
let waslat = [];

document.addEventListener('DOMContentLoaded', async () => {
  applyLang();
  
  // Setup UI
  document.getElementById('nav').innerHTML = buildNav('poems');
  
  // Check URL params for initial query
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q');
  if (initialQuery) {
    document.getElementById('searchInput').value = initialQuery;
    currentFilters.query = initialQuery;
  }
  
  // Setup event listeners
  setupEventListeners();
  
  // Load reference data
  await loadReferenceData();
  
  // Load poems
  await loadPoems(true);
});

function setupEventListeners() {
  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
  });
  
  // Search input with debouncing
  const searchInput = document.getElementById('searchInput');
  const debouncedSearch = debounce((query) => {
    currentFilters.query = query || undefined;
    resetAndLoad();
  }, 400);
  
  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value.trim());
  });
  
  // Filter controls
  document.getElementById('poetSelect').addEventListener('change', (e) => {
    currentFilters.poetId = e.target.value || undefined;
    resetAndLoad();
  });
  
  document.getElementById('maqamSelect').addEventListener('change', (e) => {
    currentFilters.maqamId = e.target.value || undefined;
    resetAndLoad();
  });
  
  document.getElementById('categorySelect').addEventListener('change', (e) => {
    currentFilters.category = e.target.value || undefined;
    resetAndLoad();
  });
  
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    const value = e.target.value;
    if (value === 'newest') {
      currentFilters.sortBy = 'CreatedAt';
      currentFilters.sortDesc = true;
    } else if (value === 'oldest') {
      currentFilters.sortBy = 'CreatedAt';
      currentFilters.sortDesc = false;
    } else if (value === 'title') {
      currentFilters.sortBy = 'Title';
      currentFilters.sortDesc = false;
    } else if (value === 'poet') {
      currentFilters.sortBy = 'PoetName';
      currentFilters.sortDesc = false;
    }
    resetAndLoad();
  });
  
  // Clear filters
  document.getElementById('clearFiltersBtn').addEventListener('click', () => {
    currentFilters = {};
    document.getElementById('searchInput').value = '';
    document.getElementById('poetSelect').value = '';
    document.getElementById('maqamSelect').value = '';
    document.getElementById('categorySelect').value = '';
    document.getElementById('sortSelect').value = 'newest';
    resetAndLoad();
  });
  
  // Load more button
  document.getElementById('loadMoreBtn').addEventListener('click', () => {
    if (!isLoading && hasMore) {
      currentPage++;
      loadPoems(false);
    }
  });
}

async function loadReferenceData() {
  try {
    const [poetsResponse, maqamatResponse, waslatResponse] = await Promise.all([
      poetsApi.getAll(),
      maqamatApi.getAll(),
      waslatApi.getAll()
    ]);
    
    poets = poetsResponse;
    maqamat = maqamatResponse;
    waslat = waslatResponse;
    
    populateFilterOptions();
  } catch (error) {
    console.error('Error loading reference data:', error);
  }
}

function populateFilterOptions() {
  const lang = getLang();
  
  // Poets
  const poetSelect = document.getElementById('poetSelect');
  poetSelect.innerHTML = `<option value="">${t('all')}</option>`;
  poets.forEach(poet => {
    const name = lang === 'ar' ? poet.nameAr : poet.nameEn;
    poetSelect.innerHTML += `<option value="${poet.id}">${name}</option>`;
  });
  
  // Maqamat
  const maqamSelect = document.getElementById('maqamSelect');
  maqamSelect.innerHTML = `<option value="">${t('all')}</option>`;
  maqamat.forEach(maqam => {
    const name = lang === 'ar' ? maqam.nameAr : maqam.nameEn;
    maqamSelect.innerHTML += `<option value="${maqam.id}">${name}</option>`;
  });
}

async function loadPoems(reset = false) {
  if (isLoading) return;
  
  isLoading = true;
  const container = document.getElementById('poemsGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  
  if (reset) {
    currentPage = 1;
    hasMore = true;
    showLoading(container);
  } else {
    loadMoreBtn.textContent = t('loading');
    loadMoreBtn.disabled = true;
  }
  
  try {
    const params = {
      ...currentFilters,
      page: currentPage,
      pageSize: 12
    };
    
    const response = await poemsApi.getAll(params);
    
    if (reset) {
      container.innerHTML = '';
    }
    
    if (response.items && response.items.length > 0) {
      renderPoems(container, response.items, reset);
      
      // Update pagination
      hasMore = response.hasNext;
      loadMoreBtn.style.display = hasMore ? 'block' : 'none';
      
      // Update results count
      if (reset) {
        updateResultsCount(response.totalCount);
      }
    } else if (reset) {
      showEmpty(container, t('noPoems'), 'menu_book');
      loadMoreBtn.style.display = 'none';
      updateResultsCount(0);
    }
    
  } catch (error) {
    console.error('Error loading poems:', error);
    if (reset) {
      showError(container, error.message);
      loadMoreBtn.style.display = 'none';
    } else {
      showToast(error.message || t('error'), 'error');
    }
  } finally {
    isLoading = false;
    loadMoreBtn.textContent = t('loadMore');
    loadMoreBtn.disabled = false;
  }
}

function renderPoems(container, poems, reset) {
  const user = getUser();
  const isLead = user.role === 'LeadMunshid';
  const lang = getLang();
  
  poems.forEach(poem => {
    const poetName = lang === 'ar' ? poem.poetNameAr : poem.poetNameEn;
    const maqamName = lang === 'ar' ? poem.maqamNameAr : poem.maqamNameEn;
    
    const poemCard = document.createElement('div');
    poemCard.className = 'card card-clickable';
    poemCard.innerHTML = `
      <div class="card-title">${poem.title}</div>
      <div class="card-subtitle">
        ${poetName} • ${maqamName}
      </div>
      <div class="flex gap-2" style="margin: 0.5rem 0;">
        ${categoryBadge(poem.category)}
        ${poem.hadraSection ? hadraSectionBadge(poem.hadraSection) : ''}
      </div>
      <div class="poem-preview font-arabic" style="color: var(--text-muted); font-size: 1rem; line-height: 1.5; margin: 1rem 0;">
        ${poem.body.substring(0, 100)}${poem.body.length > 100 ? '...' : ''}
      </div>
      <div class="text-sm text-muted">
        ${formatDate(poem.createdAt, false)}
      </div>
      ${isLead ? `
        <div class="action-buttons">
          <button class="btn btn-primary btn-sm share-poem-btn" data-id="${poem.id}">
            <span class="material-symbols-outlined">share</span>
            ${t('sharePoem')}
          </button>
          <button class="btn btn-secondary btn-sm add-to-wasla-btn" data-id="${poem.id}">
            <span class="material-symbols-outlined">playlist_add</span>
            ${t('addToWasla')}
          </button>
        </div>
      ` : ''}
    `;
    
    // Click to view details
    poemCard.addEventListener('click', (e) => {
      if (!e.target.closest('.action-buttons')) {
        window.location.href = `/poem-detail.html?id=${poem.id}`;
      }
    });
    
    // Action buttons for lead users
    if (isLead) {
      const shareBtn = poemCard.querySelector('.share-poem-btn');
      const addToWaslaBtn = poemCard.querySelector('.add-to-wasla-btn');
      
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sharePoem(poem.id, poem.title);
      });
      
      addToWaslaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showAddToWaslaModal(poem.id, poem.title);
      });
    }
    
    container.appendChild(poemCard);
  });
}

function updateResultsCount(count) {
  const countElement = document.getElementById('resultsCount');
  if (count === 0) {
    countElement.textContent = '';
  } else {
    countElement.textContent = `${count} ${t('poems')}`;
  }
}

function resetAndLoad() {
  loadPoems(true);
}

async function sharePoem(poemId, title) {
  try {
    const { currentApi } = await import('../api.js');
    await currentApi.sharePoem(poemId, '');
    showToast(`${t('shared')}: ${title}`, 'success');
  } catch (error) {
    showToast(error.message || t('error'), 'error');
  }
}

function showAddToWaslaModal(poemId, title) {
  if (waslat.length === 0) {
    showToast('لا توجد وصلات متاحة', 'warning');
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box glass-panel">
      <h3>${t('addPoemToWasla')}</h3>
      <p class="modal-msg">${title}</p>
      <div class="form-group">
        <select class="form-control" id="waslaSelect">
          <option value="">${t('selectWasla')}</option>
          ${waslat.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="addToWaslaBtn">${t('add')}</button>
        <button class="btn btn-secondary" id="cancelBtn">${t('cancel')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#addToWaslaBtn').onclick = async () => {
    const waslaId = modal.querySelector('#waslaSelect').value;
    if (!waslaId) {
      showToast(t('selectWasla'), 'warning');
      return;
    }
    
    try {
      await waslatApi.addItem(waslaId, { poemId: parseInt(poemId) });
      modal.remove();
      showToast(t('created'), 'success');
    } catch (error) {
      showToast(error.message || t('error'), 'error');
    }
  };
  
  modal.querySelector('#cancelBtn').onclick = () => modal.remove();
  modal.onclick = (e) => e.target === modal && modal.remove();
}