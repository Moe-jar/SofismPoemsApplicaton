// Wasla detail/editor page for ديوان الصوفية
import { requireAuth, getUser } from '../auth.js';
import { waslatApi, poemsApi, currentApi } from '../api.js';
import { t, applyLang, getLang } from '../i18n.js';
import { buildNav, showToast, showLoading, showError, showEmpty, categoryBadge, hadraSectionBadge, formatDate, confirm, prompt, initSortable } from '../ui.js';

if (!requireAuth()) return;

let wasla = null;
let waslaId = null;
let isNewWasla = false;

document.addEventListener('DOMContentLoaded', async () => {
  applyLang();
  
  // Setup UI
  document.getElementById('nav').innerHTML = buildNav('waslat');
  
  // Get wasla ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  waslaId = urlParams.get('id');
  isNewWasla = !waslaId;
  
  // Setup event listeners
  setupEventListeners();
  
  if (isNewWasla) {
    // Show new wasla form
    showNewWaslaForm();
  } else {
    // Load existing wasla
    await loadWasla();
  }
});

function setupEventListeners() {
  const user = getUser();
  const isLead = user.role === 'LeadMunshid';
  
  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
  });
}

function showNewWaslaForm() {
  const user = getUser();
  if (user.role !== 'LeadMunshid') {
    window.location.href = '/waslat.html';
    return;
  }
  
  document.getElementById('pageTitle').textContent = t('newWasla');
  document.getElementById('waslaContent').innerHTML = `
    <div class="glass-panel">
      <form id="newWaslaForm">
        <div class="form-group">
          <label class="form-label">${t('waslaName')}</label>
          <input type="text" class="form-control" id="waslaNameInput" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t('waslaDesc')}</label>
          <textarea class="form-control" id="waslaDescInput" rows="3"></textarea>
        </div>
        <div class="action-buttons">
          <button type="submit" class="btn btn-primary">${t('save')}</button>
          <button type="button" class="btn btn-secondary" id="cancelNewBtn">${t('cancel')}</button>
        </div>
      </form>
    </div>
  `;
  
  // Event listeners for new wasla form
  document.getElementById('newWaslaForm').addEventListener('submit', handleNewWaslaSubmit);
  document.getElementById('cancelNewBtn').addEventListener('click', () => {
    window.location.href = '/waslat.html';
  });
  
  // Focus name input
  document.getElementById('waslaNameInput').focus();
}

async function handleNewWaslaSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('waslaNameInput').value.trim();
  const description = document.getElementById('waslaDescInput').value.trim();
  
  if (!name) {
    showToast('اسم الوصلة مطلوب', 'error');
    return;
  }
  
  try {
    const newWasla = await waslatApi.create({ name, description });
    showToast(t('created'), 'success');
    
    // Redirect to the new wasla detail page
    setTimeout(() => {
      window.location.href = `/wasla-detail.html?id=${newWasla.id}`;
    }, 1000);
    
  } catch (error) {
    showToast(error.message || t('error'), 'error');
  }
}

async function loadWasla() {
  const container = document.getElementById('waslaContent');
  showLoading(container);
  
  try {
    wasla = await waslatApi.getById(waslaId);
    renderWasla(container, wasla);
  } catch (error) {
    console.error('Error loading wasla:', error);
    showError(container, error.message);
  }
}

function renderWasla(container, wasla) {
  const user = getUser();
  const isLead = user.role === 'LeadMunshid';
  const lang = getLang();
  
  document.getElementById('pageTitle').textContent = wasla.name;
  
  container.innerHTML = `
    <div class="wasla-header glass-panel">
      <h2>${wasla.name}</h2>
      ${wasla.description ? `<p class="text-muted">${wasla.description}</p>` : ''}
      <div class="wasla-meta text-sm text-muted">
        <p><strong>${t('createdBy')}:</strong> ${wasla.createdByUserName || 'غير معروف'}</p>
        <p><strong>${t('created')}:</strong> ${formatDate(wasla.createdAt)}</p>
        <p><strong>${t('totalPoems')}:</strong> ${wasla.items ? wasla.items.length : 0}</p>
      </div>
      
      ${isLead ? `
        <div class="action-buttons">
          <button class="btn btn-primary" id="shareWaslaBtn">
            <span class="material-symbols-outlined">share</span>
            ${t('shareWasla')}
          </button>
          <button class="btn btn-secondary" id="editWaslaBtn">
            <span class="material-symbols-outlined">edit</span>
            ${t('editWasla')}
          </button>
          <button class="btn btn-secondary" id="addPoemBtn">
            <span class="material-symbols-outlined">add</span>
            ${t('addPoem')}
          </button>
        </div>
      ` : ''}
    </div>
    
    <div class="wasla-items">
      <h3>${t('waslaItems')}</h3>
      <div id="waslaItemsList"></div>
    </div>
  `;
  
  // Render wasla items
  renderWaslaItems();
  
  // Setup action buttons
  if (isLead) {
    setupActionButtons();
  }
}

function renderWaslaItems() {
  const itemsList = document.getElementById('waslaItemsList');
  const user = getUser();
  const isLead = user.role === 'LeadMunshid';
  const lang = getLang();
  
  if (!wasla.items || wasla.items.length === 0) {
    showEmpty(itemsList, t('noPoems'), 'queue_music');
    return;
  }
  
  itemsList.innerHTML = '';
  
  wasla.items.forEach((item, index) => {
    const poetName = lang === 'ar' ? item.poetNameAr : item.poetNameEn;
    const maqamName = lang === 'ar' ? item.maqamNameAr : item.maqamNameEn;
    
    const itemElement = document.createElement('div');
    itemElement.className = `poem-item ${isLead ? 'sortable-item' : ''}`;
    itemElement.draggable = isLead;
    itemElement.dataset.id = item.id;
    itemElement.innerHTML = `
      <div class="poem-number">${index + 1}</div>
      <div class="poem-info">
        <div class="poem-title">
          <a href="/poem-detail.html?id=${item.poemId}" class="text-primary">${item.title}</a>
        </div>
        <div class="poem-meta">
          ${poetName} • ${maqamName}
          <span style="margin-right: 1rem;">
            ${categoryBadge(item.category)}
            ${item.hadraSection ? hadraSectionBadge(item.hadraSection) : ''}
          </span>
        </div>
        ${item.notes ? `<div class="text-sm text-muted">${item.notes}</div>` : ''}
      </div>
      ${isLead ? `
        <div class="item-actions">
          <button class="btn btn-icon move-up-btn" data-id="${item.id}" ${index === 0 ? 'disabled' : ''}>
            <span class="material-symbols-outlined">keyboard_arrow_up</span>
          </button>
          <button class="btn btn-icon move-down-btn" data-id="${item.id}" ${index === wasla.items.length - 1 ? 'disabled' : ''}>
            <span class="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
          <button class="btn btn-icon btn-danger remove-item-btn" data-id="${item.id}">
            <span class="material-symbols-outlined">remove</span>
          </button>
        </div>
      ` : ''}
    `;
    
    itemsList.appendChild(itemElement);
  });
  
  // Setup item action listeners
  if (isLead) {
    setupItemActions();
    
    // Initialize drag and drop
    initSortable(itemsList, handleReorder);
  }
}

function setupActionButtons() {
  // Share wasla
  document.getElementById('shareWaslaBtn').addEventListener('click', async () => {
    try {
      const message = await prompt(t('message'), '', 'text');
      if (message !== null) {
        await currentApi.shareWasla(waslaId, message);
        showToast(t('shared'), 'success');
      }
    } catch (error) {
      showToast(error.message || t('error'), 'error');
    }
  });
  
  // Edit wasla
  document.getElementById('editWaslaBtn').addEventListener('click', async () => {
    const name = await prompt(t('waslaName'), wasla.name, 'text');
    if (name) {
      const description = await prompt(t('waslaDesc'), wasla.description || '', 'text');
      if (description !== null) {
        try {
          await waslatApi.update(waslaId, { name, description });
          showToast(t('updated'), 'success');
          await loadWasla(); // Reload to show changes
        } catch (error) {
          showToast(error.message || t('error'), 'error');
        }
      }
    }
  });
  
  // Add poem
  document.getElementById('addPoemBtn').addEventListener('click', () => {
    showAddPoemModal();
  });
}

function setupItemActions() {
  // Move up/down buttons
  document.querySelectorAll('.move-up-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = parseInt(btn.dataset.id);
      moveItem(itemId, 'up');
    });
  });
  
  document.querySelectorAll('.move-down-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = parseInt(btn.dataset.id);
      moveItem(itemId, 'down');
    });
  });
  
  // Remove buttons
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const itemId = parseInt(btn.dataset.id);
      await removeItem(itemId);
    });
  });
}

async function moveItem(itemId, direction) {
  const items = [...wasla.items];
  const currentIndex = items.findIndex(item => item.id === itemId);
  
  if (currentIndex === -1) return;
  
  const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  
  if (newIndex < 0 || newIndex >= items.length) return;
  
  // Swap items
  [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];
  
  // Update sort order
  const reorderedItems = items.map((item, index) => ({
    id: item.id,
    sortOrder: index + 1
  }));
  
  await handleReorder(reorderedItems);
}

async function removeItem(itemId) {
  const confirmed = await confirm(t('confirmDelete'));
  if (confirmed) {
    try {
      await waslatApi.removeItem(waslaId, itemId);
      showToast(t('deleted'), 'success');
      await loadWasla(); // Reload to show changes
    } catch (error) {
      showToast(error.message || t('error'), 'error');
    }
  }
}

async function handleReorder(reorderedItems) {
  try {
    await waslatApi.reorder(waslaId, reorderedItems);
    await loadWasla(); // Reload to show new order
  } catch (error) {
    showToast(error.message || t('error'), 'error');
  }
}

async function showAddPoemModal() {
  // Load available poems
  try {
    const response = await poemsApi.getAll({ pageSize: 100 });
    const availablePoems = response.items || [];
    
    if (availablePoems.length === 0) {
      showToast('لا توجد قصائد متاحة', 'warning');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box glass-panel" style="max-width: 600px;">
        <h3>${t('addPoem')}</h3>
        <div class="form-group">
          <input type="text" class="form-control" id="poemSearchInput" placeholder="${t('search')}">
        </div>
        <div id="poemsSelectList" style="max-height: 300px; overflow-y: auto;">
          ${availablePoems.map(poem => `
            <div class="poem-option card-clickable" data-id="${poem.id}" style="padding: 0.5rem; margin: 0.25rem 0; border: 1px solid var(--glass-border); border-radius: 0.5rem; cursor: pointer;">
              <div class="font-semibold">${poem.title}</div>
              <div class="text-sm text-muted">${poem.poetNameAr} • ${poem.maqamNameAr}</div>
            </div>
          `).join('')}
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="cancelAddBtn">${t('cancel')}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Filter poems
    const searchInput = modal.querySelector('#poemSearchInput');
    const poemsList = modal.querySelector('#poemsSelectList');
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      modal.querySelectorAll('.poem-option').forEach(option => {
        const title = option.querySelector('.font-semibold').textContent.toLowerCase();
        const poet = option.querySelector('.text-muted').textContent.toLowerCase();
        option.style.display = (title.includes(query) || poet.includes(query)) ? 'block' : 'none';
      });
    });
    
    // Select poem
    modal.querySelectorAll('.poem-option').forEach(option => {
      option.addEventListener('click', async () => {
        const poemId = parseInt(option.dataset.id);
        try {
          await waslatApi.addItem(waslaId, { poemId });
          modal.remove();
          showToast(t('created'), 'success');
          await loadWasla(); // Reload to show changes
        } catch (error) {
          showToast(error.message || t('error'), 'error');
        }
      });
    });
    
    modal.querySelector('#cancelAddBtn').onclick = () => modal.remove();
    modal.onclick = (e) => e.target === modal && modal.remove();
    
  } catch (error) {
    showToast(error.message || t('error'), 'error');
  }
}