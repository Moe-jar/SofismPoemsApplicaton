// Poem detail page for ديوان الصوفية
import { requireAuth, getUser } from '../auth.js';
import { poemsApi, currentApi, waslatApi } from '../api.js';
import { t, applyLang, getLang } from '../i18n.js';
import { buildNav, showToast, showLoading, showError, categoryBadge, hadraSectionBadge, formatDate, confirm, prompt } from '../ui.js';

if (!requireAuth()) return;

let currentPoem = null;
let waslat = [];

document.addEventListener('DOMContentLoaded', async () => {
  applyLang();
  
  // Setup UI
  document.getElementById('nav').innerHTML = buildNav('poems');
  
  // Get poem ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const poemId = urlParams.get('id');
  
  if (!poemId) {
    showError(document.getElementById('poemContent'), 'معرف القصيدة مطلوب');
    return;
  }
  
  // Setup event listeners
  setupEventListeners();
  
  // Load poem data
  await loadPoem(poemId);
  
  // Load waslat for lead users
  const user = getUser();
  if (user.role === 'LeadMunshid') {
    await loadWaslat();
  }
});

function setupEventListeners() {
  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
  });
}

async function loadPoem(poemId) {
  const container = document.getElementById('poemContent');
  showLoading(container);
  
  try {
    currentPoem = await poemsApi.getById(poemId);
    renderPoem(container, currentPoem);
  } catch (error) {
    console.error('Error loading poem:', error);
    showError(container, error.message);
  }
}

async function loadWaslat() {
  try {
    waslat = await waslatApi.getAll();
  } catch (error) {
    console.error('Error loading waslat:', error);
  }
}

function renderPoem(container, poem) {
  const user = getUser();
  const isLead = user.role === 'LeadMunshid';
  const lang = getLang();
  
  const poetName = lang === 'ar' ? poem.poetNameAr : poem.poetNameEn;
  const maqamName = lang === 'ar' ? poem.maqamNameAr : poem.maqamNameEn;
  const createdByName = poem.createdByUserName || 'غير معروف';
  
  container.innerHTML = `
    <div class="poem-header">
      <h1 class="poem-title">${poem.title}</h1>
      <div class="poem-meta">
        <p class="text-lg">
          <span class="text-gold">${t('poet')}:</span> ${poetName}
        </p>
        <p class="text-lg">
          <span class="text-gold">${t('maqam')}:</span> ${maqamName}
        </p>
        <div class="flex gap-2" style="margin: 1rem 0;">
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
    
    <div class="poem-footer glass-panel" style="margin: 2rem 0;">
      <div class="text-sm text-muted">
        <p><strong>${t('createdBy')}:</strong> ${createdByName}</p>
        <p><strong>${t('created')}:</strong> ${formatDate(poem.createdAt)}</p>
        ${poem.updatedAt !== poem.createdAt ? `
          <p><strong>${t('updated')}:</strong> ${formatDate(poem.updatedAt)}</p>
        ` : ''}
      </div>
    </div>
    
    ${isLead ? `
      <div class="action-buttons">
        <button class="btn btn-primary btn-lg" id="sharePoemBtn">
          <span class="material-symbols-outlined">share</span>
          ${t('sharePoem')}
        </button>
        <button class="btn btn-secondary" id="addToWaslaBtn">
          <span class="material-symbols-outlined">playlist_add</span>
          ${t('addToWasla')}
        </button>
        <button class="btn btn-secondary" id="editPoemBtn">
          <span class="material-symbols-outlined">edit</span>
          ${t('editPoem')}
        </button>
        <button class="btn btn-danger" id="deletePoemBtn">
          <span class="material-symbols-outlined">delete</span>
          ${t('deletePoem')}
        </button>
      </div>
    ` : ''}
  `;
  
  // Setup action button listeners
  if (isLead) {
    setupActionButtons(poem);
  }
}

function setupActionButtons(poem) {
  // Share poem button
  document.getElementById('sharePoemBtn').addEventListener('click', async () => {
    try {
      const message = await prompt(t('message'), '', 'text');
      if (message !== null) {
        await currentApi.sharePoem(poem.id, message);
        showToast(t('shared'), 'success');
      }
    } catch (error) {
      showToast(error.message || t('error'), 'error');
    }
  });
  
  // Add to wasla button
  document.getElementById('addToWaslaBtn').addEventListener('click', () => {
    showAddToWaslaModal(poem.id, poem.title);
  });
  
  // Edit poem button
  document.getElementById('editPoemBtn').addEventListener('click', () => {
    window.location.href = `/poem-form.html?id=${poem.id}`;
  });
  
  // Delete poem button
  document.getElementById('deletePoemBtn').addEventListener('click', async () => {
    const confirmed = await confirm(`${t('confirmDelete')} "${poem.title}"?`);
    if (confirmed) {
      try {
        await poemsApi.delete(poem.id);
        showToast(t('deleted'), 'success');
        setTimeout(() => {
          window.location.href = '/poems.html';
        }, 1000);
      } catch (error) {
        showToast(error.message || t('error'), 'error');
      }
    }
  });
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
        <button class="btn btn-primary" id="addToWaslaConfirmBtn">${t('add')}</button>
        <button class="btn btn-secondary" id="cancelBtn">${t('cancel')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#addToWaslaConfirmBtn').onclick = async () => {
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