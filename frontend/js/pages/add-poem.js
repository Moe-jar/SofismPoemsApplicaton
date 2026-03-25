// Add / Edit poem page logic for ديوان الصوفية
import { requireLead } from '../auth.js';
import { poemsApi, poetsApi, maqamatApi } from '../api.js';
import { showToast } from '../ui.js';
import { escapeHtml, CATEGORY_LABELS } from '../utils.js';

if (!requireLead()) throw new Error('Not authorized');

let editId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  editId = params.get('id');

  // Load poets and maqamat in parallel
  await Promise.allSettled([loadPoets(), loadMaqamat()]);

  if (editId) {
    document.getElementById('pageTitle').textContent = 'تعديل قصيدة';
    document.getElementById('submitBtn').innerHTML = `
      <span class="material-symbols-outlined text-lg">save</span> حفظ التعديلات`;
    await loadPoemForEdit(editId);
  }

  // Show/hide hadra section based on category
  document.querySelectorAll('input[name="category"]').forEach(radio => {
    radio.addEventListener('change', () => toggleHadraSection());
  });
  toggleHadraSection();

  // New poet toggle
  document.getElementById('poetId')?.addEventListener('change', (e) => {
    const newPoetGroup = document.getElementById('newPoetGroup');
    if (newPoetGroup) {
      newPoetGroup.classList.toggle('hidden', e.target.value !== 'new');
    }
  });

  // Cancel
  document.getElementById('cancelBtn')?.addEventListener('click', () => {
    history.back();
  });

  // Draft save
  document.getElementById('draftBtn')?.addEventListener('click', () => {
    submitForm(true);
  });

  // Main form submit
  document.getElementById('poemForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(false);
  });
});

function toggleHadraSection() {
  const selected = document.querySelector('input[name="category"]:checked')?.value;
  const hadraSectionGroup = document.getElementById('hadraSectionGroup');
  if (hadraSectionGroup) {
    hadraSectionGroup.classList.toggle('hidden', selected !== 'Hadra');
  }
}

async function loadPoets() {
  const select = document.getElementById('poetId');
  if (!select) return;
  try {
    const poets = await poetsApi.getAll();
    select.innerHTML =
      `<option value="" disabled selected>اختر الشاعر...</option>` +
      poets.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join('') +
      `<option value="new">+ شاعر جديد...</option>`;
  } catch {
    showToast('تعذر تحميل قائمة الشعراء', 'warning');
  }
}

async function loadMaqamat() {
  const select = document.getElementById('maqamId');
  if (!select) return;
  try {
    const maqamat = await maqamatApi.getAll();
    select.innerHTML =
      `<option value="" disabled selected>اختر المقام...</option>` +
      maqamat.map(m => `<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
  } catch {
    showToast('تعذر تحميل قائمة المقامات', 'warning');
  }
}

async function loadPoemForEdit(id) {
  try {
    const poem = await poemsApi.getById(id);

    document.getElementById('title').value = poem.title || '';
    document.getElementById('content').value = poem.content || '';

    const poetSelect = document.getElementById('poetId');
    if (poetSelect && poem.poetId) poetSelect.value = poem.poetId;

    const maqamSelect = document.getElementById('maqamId');
    if (maqamSelect && poem.maqamId) maqamSelect.value = poem.maqamId;

    const categoryRadio = document.querySelector(`input[name="category"][value="${poem.category}"]`);
    if (categoryRadio) categoryRadio.checked = true;

    const hadraSelect = document.getElementById('hadraSection');
    if (hadraSelect && poem.hadraSection) hadraSelect.value = poem.hadraSection;

    toggleHadraSection();
  } catch (err) {
    showToast('تعذر تحميل بيانات القصيدة', 'error');
  }
}

async function submitForm(isDraft = false) {
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const poetSelect = document.getElementById('poetId');
  const maqamSelect = document.getElementById('maqamId');
  const categoryInput = document.querySelector('input[name="category"]:checked');
  const hadraSectionSelect = document.getElementById('hadraSection');
  const newPoetInput = document.getElementById('newPoetName');

  // Validation
  clearErrors();
  let valid = true;

  if (!titleInput?.value.trim()) {
    showFieldError('titleError', 'عنوان القصيدة مطلوب');
    valid = false;
  }
  if (!contentInput?.value.trim()) {
    showFieldError('contentError', 'نص القصيدة مطلوب');
    valid = false;
  }
  if (!categoryInput) {
    showFieldError('categoryError', 'يرجى اختيار تصنيف القصيدة');
    valid = false;
  }

  if (!valid) return;

  // Handle new poet creation
  let poetId = poetSelect?.value;
  if (poetId === 'new') {
    const newName = newPoetInput?.value.trim();
    if (!newName) {
      showFieldError('newPoetError', 'اسم الشاعر مطلوب');
      return;
    }
    try {
      const created = await poetsApi.create({ name: newName });
      poetId = created.id;
    } catch (err) {
      showToast('تعذر إضافة الشاعر الجديد', 'error');
      return;
    }
  }

  const data = {
    title: titleInput.value.trim(),
    content: contentInput.value.trim(),
    poetId: poetId || null,
    maqamId: maqamSelect?.value || null,
    category: categoryInput?.value || null,
    hadraSection: categoryInput?.value === 'Hadra' ? (hadraSectionSelect?.value || null) : null,
  };

  const submitBtn = document.getElementById('submitBtn');
  const draftBtn = document.getElementById('draftBtn');
  const btn = isDraft ? draftBtn : submitBtn;
  if (btn) { btn.disabled = true; btn.innerHTML += ' <span style="opacity:.7">...</span>'; }

  try {
    if (editId) {
      await poemsApi.update(editId, data);
      showToast('تم تحديث القصيدة بنجاح', 'success');
    } else {
      const created = await poemsApi.create(data);
      showToast(isDraft ? 'تم حفظ المسودة بنجاح' : 'تم نشر القصيدة بنجاح', 'success');
      if (!isDraft) {
        setTimeout(() => { window.location.href = `view-poem.html?id=${created.id}`; }, 800);
        return;
      }
    }
    setTimeout(() => { window.location.href = 'poems.html'; }, 800);
  } catch (err) {
    showToast(err.message || 'حدث خطأ أثناء الحفظ', 'error');
    if (btn) { btn.disabled = false; }
  }
}

function showFieldError(id, message) {
  const el = document.getElementById(id);
  if (el) { el.textContent = message; el.classList.remove('hidden'); }
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.classList.add('hidden');
  });
}
