// Poem form (add/edit) page for ديوان الصوفية
import { requireLead } from '../auth.js';
import { poemsApi, poetsApi, maqamatApi } from '../api.js';
import { t, applyLang, getLang } from '../i18n.js';
import { buildNav, showToast, showLoading, showError } from '../ui.js';

if (!requireLead()) return;

let poets = [];
let maqamat = [];
let isEditMode = false;
let poemId = null;

document.addEventListener('DOMContentLoaded', async () => {
  applyLang();
  
  // Setup UI
  document.getElementById('nav').innerHTML = buildNav('poems');
  
  // Check if edit mode
  const urlParams = new URLSearchParams(window.location.search);
  poemId = urlParams.get('id');
  isEditMode = !!poemId;
  
  // Update page title
  document.getElementById('pageTitle').textContent = isEditMode ? t('editPoem') : t('addPoem');
  document.getElementById('submitBtn').textContent = t('savePoem');
  
  // Setup event listeners
  setupEventListeners();
  
  // Load reference data
  await loadReferenceData();
  
  // Load poem data for edit mode
  if (isEditMode) {
    await loadPoemForEdit();
  }
  
  // Update category change handler
  updateHadraSectionVisibility();
});

function setupEventListeners() {
  // Back button
  document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();
  });
  
  // Category change to show/hide hadra section
  document.getElementById('categorySelect').addEventListener('change', updateHadraSectionVisibility);
  
  // Form submission
  document.getElementById('poemForm').addEventListener('submit', handleSubmit);
}

async function loadReferenceData() {
  try {
    const [poetsResponse, maqamatResponse] = await Promise.all([
      poetsApi.getAll(),
      maqamatApi.getAll()
    ]);
    
    poets = poetsResponse;
    maqamat = maqamatResponse;
    
    populateSelects();
  } catch (error) {
    console.error('Error loading reference data:', error);
    showToast(error.message || t('error'), 'error');
  }
}

function populateSelects() {
  const lang = getLang();
  
  // Poets
  const poetSelect = document.getElementById('poetSelect');
  poetSelect.innerHTML = `<option value="">${t('poet')}...</option>`;
  poets.forEach(poet => {
    const name = lang === 'ar' ? poet.nameAr : poet.nameEn;
    poetSelect.innerHTML += `<option value="${poet.id}">${name}</option>`;
  });
  
  // Maqamat
  const maqamSelect = document.getElementById('maqamSelect');
  maqamSelect.innerHTML = `<option value="">${t('maqam')}...</option>`;
  maqamat.forEach(maqam => {
    const name = lang === 'ar' ? maqam.nameAr : maqam.nameEn;
    maqamSelect.innerHTML += `<option value="${maqam.id}">${name}</option>`;
  });
}

async function loadPoemForEdit() {
  try {
    const poem = await poemsApi.getById(poemId);
    
    // Populate form fields
    document.getElementById('titleInput').value = poem.title;
    document.getElementById('poetSelect').value = poem.poetId;
    document.getElementById('maqamSelect').value = poem.maqamId;
    document.getElementById('categorySelect').value = poem.category;
    document.getElementById('notesInput').value = poem.notes || '';
    document.getElementById('bodyInput').value = poem.body;
    
    if (poem.hadraSection) {
      document.getElementById('hadraSectionSelect').value = poem.hadraSection;
    }
    
    updateHadraSectionVisibility();
    
  } catch (error) {
    console.error('Error loading poem:', error);
    showError(document.querySelector('.main-content'), error.message);
  }
}

function updateHadraSectionVisibility() {
  const categorySelect = document.getElementById('categorySelect');
  const hadraSectionGroup = document.getElementById('hadraSectionGroup');
  
  if (categorySelect.value === 'Hadra') {
    hadraSectionGroup.style.display = 'block';
  } else {
    hadraSectionGroup.style.display = 'none';
    document.getElementById('hadraSectionSelect').value = '';
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  
  const submitBtn = document.getElementById('submitBtn');
  const formData = new FormData(e.target);
  
  // Validation
  const title = formData.get('title').trim();
  const poetId = formData.get('poetId');
  const maqamId = formData.get('maqamId');
  const category = formData.get('category');
  const body = formData.get('body').trim();
  
  if (!title || !poetId || !maqamId || !category || !body) {
    showToast('جميع الحقول مطلوبة', 'error');
    return;
  }
  
  // Hadra category requires hadra section
  if (category === 'Hadra' && !formData.get('hadraSection')) {
    showToast('قسم الحضرة مطلوب للقصائد من فئة الحضرة', 'error');
    return;
  }
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = t('loading');
  
  try {
    const poemData = {
      title,
      body,
      poetId: parseInt(poetId),
      maqamId: parseInt(maqamId),
      category,
      hadraSection: category === 'Hadra' ? formData.get('hadraSection') : null,
      notes: formData.get('notes')?.trim() || null
    };
    
    let result;
    if (isEditMode) {
      result = await poemsApi.update(poemId, poemData);
      showToast(t('updated'), 'success');
    } else {
      result = await poemsApi.create(poemData);
      showToast(t('created'), 'success');
    }
    
    // Redirect to poem detail
    setTimeout(() => {
      const id = isEditMode ? poemId : result.id;
      window.location.href = `/poem-detail.html?id=${id}`;
    }, 1000);
    
  } catch (error) {
    console.error('Error saving poem:', error);
    showToast(error.message || t('error'), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = t('savePoem');
  }
}