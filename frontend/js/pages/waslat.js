// Waslat (Playlists) page logic for ديوان الصوفية
import { requireAuth, isLead } from '../auth.js';
import { waslatApi, poemsApi, currentApi } from '../api.js';
import { showToast, showConfirm, showLoading, showEmpty } from '../ui.js';
import { escapeHtml, debounce } from '../utils.js';

if (!requireAuth()) throw new Error('Not authenticated');

let waslat = [];
let selectedWaslaId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (isLead()) {
    document.querySelectorAll('.lead-only').forEach(el => el.classList.remove('hidden'));
  }

  // Create wasla button
  document.getElementById('createWaslaBtn')?.addEventListener('click', () => showCreateWaslaModal());

  // Load waslat list
  await loadWaslat();
});

async function loadWaslat() {
  const container = document.getElementById('waslatContainer');
  if (!container) return;
  showLoading('waslatContainer', 'جاري تحميل الوصلات...');

  try {
    waslat = await waslatApi.getAll();
    if (!waslat?.length) {
      showEmpty('waslatContainer', 'لا توجد وصلات بعد. أنشئ وصلتك الأولى!', 'queue_music');
      return;
    }
    renderWaslat(waslat);
  } catch (err) {
    container.innerHTML = `<div class="text-center py-12 text-red-400">${escapeHtml(err.message)}</div>`;
  }
}

function renderWaslat(list) {
  const container = document.getElementById('waslatContainer');
  if (!container) return;
  container.innerHTML = list.map(w => buildWaslaCard(w)).join('');

  // Attach click handlers
  container.querySelectorAll('.wasla-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      openWaslaDetail(card.dataset.id);
    });
  });

  if (isLead()) {
    container.querySelectorAll('.share-wasla-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          await currentApi.shareWasla(btn.dataset.id);
          showToast('تم مشاركة الوصلة مع الجميع', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    container.querySelectorAll('.delete-wasla-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await showConfirm(`هل أنت متأكد من حذف "${btn.dataset.name}"؟`, 'حذف الوصلة');
        if (!confirmed) return;
        try {
          await waslatApi.delete(btn.dataset.id);
          showToast('تم حذف الوصلة', 'success');
          loadWaslat();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  }
}

function buildWaslaCard(w) {
  const lead = isLead();
  return `
    <article class="glass-card rounded-2xl p-5 group hover:bg-[#1c2626]/60 transition-all
      duration-300 hover:-translate-y-1 cursor-pointer relative overflow-hidden wasla-card"
      data-id="${w.id}">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0
          border border-primary/30">
          <span class="material-symbols-outlined text-primary-light text-3xl">queue_music</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-white font-bold text-xl truncate group-hover:text-primary-light transition-colors">
            ${escapeHtml(w.name)}
          </h3>
          <p class="text-[#9db8b6] text-sm mt-1">${w.itemCount || 0} قصيدة</p>
          ${w.description ? `<p class="text-[#9db8b6] text-xs mt-1 truncate">${escapeHtml(w.description)}</p>` : ''}
        </div>
        <div class="flex flex-col gap-2 shrink-0">
          ${lead ? `
            <button class="share-wasla-btn p-2 rounded-full text-[#9db8b6] hover:text-primary-light
              hover:bg-white/5 transition-all" title="مشاركة مع الجميع"
              data-id="${w.id}" data-name="${escapeHtml(w.name)}">
              <span class="material-symbols-outlined text-lg">podcasts</span>
            </button>
            <button class="delete-wasla-btn p-2 rounded-full text-[#9db8b6] hover:text-red-400
              hover:bg-white/5 transition-all" title="حذف"
              data-id="${w.id}" data-name="${escapeHtml(w.name)}">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>` : ''}
          <button class="p-2 rounded-full text-[#9db8b6] hover:text-white
            hover:bg-white/5 transition-all">
            <span class="material-symbols-outlined rotate-180">chevron_right</span>
          </button>
        </div>
      </div>
    </article>`;
}

async function openWaslaDetail(waslaId) {
  selectedWaslaId = waslaId;
  const modal = document.getElementById('waslaDetailModal');
  const detailContainer = document.getElementById('waslaDetailContainer');
  if (!modal || !detailContainer) return;

  modal.classList.remove('hidden');
  showLoading('waslaDetailContainer', 'جاري تحميل الوصلة...');

  try {
    const wasla = await waslatApi.getById(waslaId);
    renderWaslaDetail(wasla, detailContainer);
  } catch (err) {
    detailContainer.innerHTML = `<div class="text-red-400 p-4">${escapeHtml(err.message)}</div>`;
  }

  // Close button
  document.getElementById('closeWaslaModal')?.addEventListener('click', () => {
    modal.classList.add('hidden');
    selectedWaslaId = null;
  });

  // Backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) { modal.classList.add('hidden'); selectedWaslaId = null; }
  };
}

function renderWaslaDetail(wasla, container) {
  const lead = isLead();
  const items = wasla.items || [];

  container.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-white text-2xl font-bold font-serif">${escapeHtml(wasla.name)}</h2>
        <p class="text-[#9db8b6] text-sm mt-1">${items.length} قصيدة</p>
      </div>
      ${lead ? `
        <button id="addToPoemWaslaBtn" class="flex items-center gap-2 px-4 py-2 rounded-xl
          bg-primary/20 border border-primary/30 text-primary-light hover:bg-primary/30 transition-all
          text-sm font-bold">
          <span class="material-symbols-outlined text-lg">playlist_add</span>
          إضافة قصيدة
        </button>` : ''}
    </div>

    <div id="waslaItemsList" class="flex flex-col gap-3">
      ${items.length
        ? items.map((item, idx) => buildWaslaItem(item, idx, wasla.id, lead)).join('')
        : `<div class="text-center py-8 text-[#9db8b6]">
            <span class="material-symbols-outlined text-4xl mb-2">queue_music</span>
            <p>لا توجد قصائد في هذه الوصلة بعد</p>
          </div>`}
    </div>`;

  if (lead) {
    container.querySelector('#addToPoemWaslaBtn')?.addEventListener('click', () => {
      showAddPoemToWaslaModal(wasla.id);
    });

    container.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await showConfirm('هل تريد حذف هذه القصيدة من الوصلة؟');
        if (!confirmed) return;
        try {
          await waslatApi.removeItem(wasla.id, btn.dataset.itemId);
          showToast('تم حذف القصيدة من الوصلة', 'success');
          const updated = await waslatApi.getById(wasla.id);
          renderWaslaDetail(updated, container);
          // Reload waslat list to update count
          loadWaslat();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  }
}

function buildWaslaItem(item, idx, waslaId, lead) {
  return `
    <div class="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5
      hover:bg-white/10 transition-all group">
      <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0
        text-primary-light font-bold text-sm">
        ${idx + 1}
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="text-white font-medium truncate">${escapeHtml(item.poemTitle || '')}</h4>
        <p class="text-[#9db8b6] text-xs mt-0.5">${escapeHtml(item.poemPoetName || '')}</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <a href="view-poem.html?id=${item.poemId}" class="p-2 rounded-full text-[#9db8b6]
          hover:text-white hover:bg-white/10 transition-all" title="قراءة القصيدة"
          onclick="event.stopPropagation()">
          <span class="material-symbols-outlined text-lg">open_in_new</span>
        </a>
        ${lead ? `
          <button class="remove-item-btn p-2 rounded-full text-[#9db8b6] hover:text-red-400
            hover:bg-white/5 transition-all" title="حذف من الوصلة" data-item-id="${item.id}">
            <span class="material-symbols-outlined text-lg">remove_circle</span>
          </button>` : ''}
      </div>
    </div>`;
}

async function showAddPoemToWaslaModal(waslaId) {
  const modal = document.getElementById('addPoemModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const searchInput = modal.querySelector('#poemSearchInput');
  const resultsContainer = modal.querySelector('#poemSearchResults');
  let searchTimeout;

  const doSearch = async (q) => {
    if (!resultsContainer) return;
    showLoading('poemSearchResults');
    try {
      const result = await poemsApi.getAll({ query: q, pageSize: 10 });
      const items = result?.items || result || [];
      if (!items.length) {
        showEmpty('poemSearchResults', 'لا توجد نتائج', 'search_off');
        return;
      }
      resultsContainer.innerHTML = items.map(p => `
        <button class="add-to-wasla-item w-full flex items-center gap-3 p-3 rounded-xl
          hover:bg-white/10 transition-all text-right border border-transparent
          hover:border-primary/20" data-id="${p.id}" data-title="${escapeHtml(p.title)}">
          <div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-primary-light">book</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white font-medium truncate">${escapeHtml(p.title)}</p>
            <p class="text-[#9db8b6] text-xs">${escapeHtml(p.poetName || '')}</p>
          </div>
          <span class="material-symbols-outlined text-primary-light text-lg">add</span>
        </button>`).join('');

      resultsContainer.querySelectorAll('.add-to-wasla-item').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await waslatApi.addItem(waslaId, { poemId: btn.dataset.id });
            showToast(`تم إضافة "${btn.dataset.title}" للوصلة`, 'success');
            modal.classList.add('hidden');
            // Refresh wasla detail
            const updated = await waslatApi.getById(selectedWaslaId);
            const detailContainer = document.getElementById('waslaDetailContainer');
            if (detailContainer) renderWaslaDetail(updated, detailContainer);
            loadWaslat();
          } catch (err) {
            showToast(err.message, 'error');
          }
        });
      });
    } catch (err) {
      if (resultsContainer) resultsContainer.innerHTML = `<div class="text-red-400 p-4">${escapeHtml(err.message)}</div>`;
    }
  };

  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => doSearch(searchInput.value.trim()), 300);
  });

  // Initial load
  doSearch('');

  // Close
  modal.querySelector('#closeAddPoemModal')?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
}

function showCreateWaslaModal() {
  const modal = document.getElementById('createWaslaModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const form = modal.querySelector('#createWaslaForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = modal.querySelector('#waslaName')?.value.trim();
    const desc = modal.querySelector('#waslaDesc')?.value.trim();
    if (!name) { showToast('اسم الوصلة مطلوب', 'error'); return; }
    try {
      await waslatApi.create({ name, description: desc || null });
      showToast('تم إنشاء الوصلة بنجاح', 'success');
      modal.classList.add('hidden');
      loadWaslat();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, { once: true });

  modal.querySelector('#closeCreateWaslaModal')?.addEventListener('click', () => {
    modal.classList.add('hidden');
  });
  modal.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); };
}
