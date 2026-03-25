// Reference management page for ديوان الصوفية (Lead only)
import { requireLead } from '../auth.js';
import { poetsApi, maqamatApi } from '../api.js';
import { t, applyLang, getLang } from '../i18n.js';
import { buildNav, showToast, showLoading, showError, showEmpty, confirm, prompt } from '../ui.js';

if (!requireLead()) return;

let poets = [];
let maqamat = [];
let activeTab = 'poets';

document.addEventListener('DOMContentLoaded', async () => {
  applyLang();
  
  // Setup UI
  document.getElementById('nav').innerHTML = buildNav('reference');
  document.getElementById('pageTitle').textContent = t('reference');
  
  // Setup event listeners
  setupEventListeners();
  
  // Load data
  await loadReferenceData();
  
  // Show initial tab
  showTab('poets');
});

function setupEventListeners() {
  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
  });
  
  // Tab buttons
  document.getElementById('poetsTabBtn').addEventListener('click', () => showTab('poets'));
  document.getElementById('maqamatTabBtn').addEventListener('click', () => showTab('maqamat'));
  
  // Add buttons
  document.getElementById('addPoetBtn').addEventListener('click', () => showAddPoetModal());
  document.getElementById('addMaqamBtn').addEventListener('click', () => showAddMaqamModal());
}

function showTab(tab) {
  activeTab = tab;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`${tab}TabBtn`).classList.add('active');
  
  // Show/hide content
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(`${tab}Tab`).classList.add('active');
  
  // Render content
  if (tab === 'poets') {
    renderPoets();
  } else if (tab === 'maqamat') {
    renderMaqamat();
  }
}

async function loadReferenceData() {
  try {
    const [poetsResponse, maqamatResponse] = await Promise.all([
      poetsApi.getAll(),
      maqamatApi.getAll()
    ]);
    
    poets = poetsResponse;
    maqamat = maqamatResponse;
    
  } catch (error) {
    console.error('Error loading reference data:', error);
    showToast(error.message || t('error'), 'error');
  }
}

function renderPoets() {
  const container = document.getElementById('poetsList');
  const lang = getLang();
  
  if (!poets || poets.length === 0) {
    showEmpty(container, 'لا يوجد شعراء', 'person');
    return;
  }
  
  container.innerHTML = '';
  
  poets.forEach(poet => {
    const name = lang === 'ar' ? poet.nameAr : poet.nameEn;
    const altName = lang === 'ar' ? poet.nameEn : poet.nameAr;
    
    const poetCard = document.createElement('div');
    poetCard.className = 'card';
    poetCard.innerHTML = `
      <div class="card-title">${name}</div>
      ${altName ? `<div class="card-subtitle">${altName}</div>` : ''}
      ${poet.description ? `<p class="text-muted">${poet.description}</p>` : ''}
      <div class="text-sm text-muted">
        <p><strong>${t('sortOrder')}:</strong> ${poet.sortOrder}</p>
        <p><strong>${t('active')}:</strong> ${poet.isActive ? t('yes') : 'لا'}</p>
      </div>
      <div class="action-buttons">
        <button class="btn btn-secondary btn-sm edit-poet-btn" data-id="${poet.id}">
          <span class="material-symbols-outlined">edit</span>
          ${t('edit')}
        </button>
        <button class="btn btn-danger btn-sm delete-poet-btn" data-id="${poet.id}" data-name="${name}">
          <span class="material-symbols-outlined">delete</span>
          ${t('delete')}
        </button>
      </div>
    `;
    
    // Event listeners
    const editBtn = poetCard.querySelector('.edit-poet-btn');
    const deleteBtn = poetCard.querySelector('.delete-poet-btn');
    
    editBtn.addEventListener('click', () => editPoet(poet));
    deleteBtn.addEventListener('click', () => deletePoet(poet.id, name));
    
    container.appendChild(poetCard);
  });
}

function renderMaqamat() {
  const container = document.getElementById('maqamatList');
  const lang = getLang();
  
  if (!maqamat || maqamat.length === 0) {
    showEmpty(container, 'لا يوجد مقامات', 'music_note');
    return;
  }
  
  container.innerHTML = '';
  
  maqamat.forEach(maqam => {
    const name = lang === 'ar' ? maqam.nameAr : maqam.nameEn;
    const altName = lang === 'ar' ? maqam.nameEn : maqam.nameAr;
    
    const maqamCard = document.createElement('div');
    maqamCard.className = 'card';
    maqamCard.innerHTML = `
      <div class="card-title">${name}</div>
      ${altName ? `<div class="card-subtitle">${altName}</div>` : ''}
      ${maqam.description ? `<p class="text-muted">${maqam.description}</p>` : ''}
      <div class="text-sm text-muted">
        <p><strong>${t('sortOrder')}:</strong> ${maqam.sortOrder}</p>
        <p><strong>${t('active')}:</strong> ${maqam.isActive ? t('yes') : 'لا'}</p>
      </div>
      <div class="action-buttons">
        <button class="btn btn-secondary btn-sm edit-maqam-btn" data-id="${maqam.id}">
          <span class="material-symbols-outlined">edit</span>
          ${t('edit')}
        </button>
        <button class="btn btn-danger btn-sm delete-maqam-btn" data-id="${maqam.id}" data-name="${name}">
          <span class="material-symbols-outlined">delete</span>
          ${t('delete')}
        </button>
      </div>
    `;
    
    // Event listeners
    const editBtn = maqamCard.querySelector('.edit-maqam-btn');
    const deleteBtn = maqamCard.querySelector('.delete-maqam-btn');
    
    editBtn.addEventListener('click', () => editMaqam(maqam));
    deleteBtn.addEventListener('click', () => deleteMaqam(maqam.id, name));
    
    container.appendChild(maqamCard);
  });
}

function showAddPoetModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box glass-panel">
      <h3>${t('add')} ${t('poet')}</h3>
      <form id="addPoetForm">
        <div class="form-group">
          <label class="form-label">${t('nameAr')}</label>
          <input type="text" class="form-control" id="poetNameAr" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t('nameEn')}</label>
          <input type="text" class="form-control" id="poetNameEn">
        </div>
        <div class="form-group">
          <label class="form-label">${t('description')}</label>
          <textarea class="form-control" id="poetDescription" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">${t('sortOrder')}</label>
          <input type="number" class="form-control" id="poetSortOrder" value="${poets.length + 1}">
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">${t('add')}</button>
          <button type="button" class="btn btn-secondary" id="cancelBtn">${t('cancel')}</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#addPoetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      nameAr: modal.querySelector('#poetNameAr').value.trim(),
      nameEn: modal.querySelector('#poetNameEn').value.trim() || null,
      description: modal.querySelector('#poetDescription').value.trim() || null,
      sortOrder: parseInt(modal.querySelector('#poetSortOrder').value),
      isActive: true
    };
    
    if (!data.nameAr) {
      showToast('الاسم بالعربية مطلوب', 'error');
      return;
    }
    
    try {
      await poetsApi.create(data);
      modal.remove();
      showToast(t('created'), 'success');
      await loadReferenceData();
      renderPoets();
    } catch (error) {
      showToast(error.message || t('error'), 'error');
    }
  });
  
  modal.querySelector('#cancelBtn').onclick = () => modal.remove();
  modal.onclick = (e) => e.target === modal && modal.remove();
}

function editPoet(poet) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box glass-panel">
      <h3>${t('edit')} ${t('poet')}</h3>
      <form id="editPoetForm">
        <div class="form-group">
          <label class="form-label">${t('nameAr')}</label>
          <input type="text" class="form-control" id="poetNameAr" value="${poet.nameAr}" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t('nameEn')}</label>
          <input type="text" class="form-control" id="poetNameEn" value="${poet.nameEn || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('description')}</label>
          <textarea class="form-control" id="poetDescription" rows="3">${poet.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">${t('sortOrder')}</label>
          <input type="number" class="form-control" id="poetSortOrder" value="${poet.sortOrder}">
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" id="poetIsActive" ${poet.isActive ? 'checked' : ''}>
            ${t('active')}
          </label>
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">${t('save')}</button>
          <button type="button" class="btn btn-secondary" id="cancelBtn">${t('cancel')}</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#editPoetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      nameAr: modal.querySelector('#poetNameAr').value.trim(),
      nameEn: modal.querySelector('#poetNameEn').value.trim() || null,
      description: modal.querySelector('#poetDescription').value.trim() || null,
      sortOrder: parseInt(modal.querySelector('#poetSortOrder').value),
      isActive: modal.querySelector('#poetIsActive').checked
    };
    
    if (!data.nameAr) {
      showToast('الاسم بالعربية مطلوب', 'error');
      return;
    }
    
    try {
      await poetsApi.update(poet.id, data);
      modal.remove();
      showToast(t('updated'), 'success');
      await loadReferenceData();
      renderPoets();
    } catch (error) {
      showToast(error.message || t('error'), 'error');
    }
  });
  
  modal.querySelector('#cancelBtn').onclick = () => modal.remove();
  modal.onclick = (e) => e.target === modal && modal.remove();
}

async function deletePoet(id, name) {
  const confirmed = await confirm(`${t('confirmDelete')} "${name}"?`);
  if (confirmed) {
    try {
      await poetsApi.delete(id);
      showToast(t('deleted'), 'success');
      await loadReferenceData();
      renderPoets();
    } catch (error) {
      showToast(error.message || t('error'), 'error');
    }
  }
}

function showAddMaqamModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box glass-panel">
      <h3>${t('add')} ${t('maqam')}</h3>
      <form id="addMaqamForm">
        <div class="form-group">
          <label class="form-label">${t('nameAr')}</label>
          <input type="text" class="form-control" id="maqamNameAr" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t('nameEn')}</label>
          <input type="text" class="form-control" id="maqamNameEn">
        </div>
        <div class="form-group">
          <label class="form-label">${t('description')}</label>
          <textarea class="form-control" id="maqamDescription" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">${t('sortOrder')}</label>
          <input type="number" class="form-control" id="maqamSortOrder" value="${maqamat.length + 1}">
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">${t('add')}</button>
          <button type="button" class="btn btn-secondary" id="cancelBtn">${t('cancel')}</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#addMaqamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      nameAr: modal.querySelector('#maqamNameAr').value.trim(),
      nameEn: modal.querySelector('#maqamNameEn').value.trim() || null,
      description: modal.querySelector('#maqamDescription').value.trim() || null,
      sortOrder: parseInt(modal.querySelector('#maqamSortOrder').value),
      isActive: true
    };
    
    if (!data.nameAr) {
      showToast('الاسم بالعربية مطلوب', 'error');
      return;
    }
    
    try {
      await maqamatApi.create(data);
      modal.remove();
      showToast(t('created'), 'success');
      await loadReferenceData();
      renderMaqamat();
    } catch (error) {
      showToast(error.message || t('error'), 'error');
    }
  });
  
  modal.querySelector('#cancelBtn').onclick = () => modal.remove();
  modal.onclick = (e) => e.target === modal && modal.remove();
}

function editMaqam(maqam) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box glass-panel">
      <h3>${t('edit')} ${t('maqam')}</h3>
      <form id="editMaqamForm">
        <div class="form-group">
          <label class="form-label">${t('nameAr')}</label>
          <input type="text" class="form-control" id="maqamNameAr" value="${maqam.nameAr}" required>
        </div>
        <div class="form-group">
          <label class="form-label">${t('nameEn')}</label>
          <input type="text" class="form-control" id="maqamNameEn" value="${maqam.nameEn || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('description')}</label>
          <textarea class="form-control" id="maqamDescription" rows="3">${maqam.description || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">${t('sortOrder')}</label>
          <input type="number" class="form-control" id="maqamSortOrder" value="${maqam.sortOrder}">
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" id="maqamIsActive" ${maqam.isActive ? 'checked' : ''}>
            ${t('active')}
          </label>
        </div>
        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">${t('save')}</button>
          <button type="button" class="btn btn-secondary" id="cancelBtn">${t('cancel')}</button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.querySelector('#editMaqamForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
      nameAr: modal.querySelector('#maqamNameAr').value.trim(),
      nameEn: modal.querySelector('#maqamNameEn').value.trim() || null,
      description: modal.querySelector('#maqamDescription').value.trim() || null,
      sortOrder: parseInt(modal.querySelector('#maqamSortOrder').value),
      isActive: modal.querySelector('#maqamIsActive').checked
    };
    
    if (!data.nameAr) {
      showToast('الاسم بالعربية مطلوب', 'error');
      return;
    }
    
    try {
      await maqamatApi.update(maqam.id, data);
      modal.remove();
      showToast(t('updated'), 'success');
      await loadReferenceData();
      renderMaqamat();
    } catch (error) {
      showToast(error.message || t('error'), 'error');
    }
  });
  
  modal.querySelector('#cancelBtn').onclick = () => modal.remove();
  modal.onclick = (e) => e.target === modal && modal.remove();
}

async function deleteMaqam(id, name) {
  const confirmed = await confirm(`${t('confirmDelete')} "${name}"?`);
  if (confirmed) {
    try {
      await maqamatApi.delete(id);
      showToast(t('deleted'), 'success');
      await loadReferenceData();
      renderMaqamat();
    } catch (error) {
      showToast(error.message || t('error'), 'error');
    }
  }
}