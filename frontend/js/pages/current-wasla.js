// Current wasla (live) page logic for ديوان الصوفية
import { requireAuth, isLead } from '../auth.js';
import { currentApi } from '../api.js';
import { showToast, showEmpty } from '../ui.js';
import { escapeHtml } from '../utils.js';
import { startPolling, stopPolling, on } from '../signalr.js';

if (!requireAuth()) throw new Error('Not authenticated');

let lastWaslaId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (isLead()) {
    document.querySelectorAll('.lead-only').forEach(el => el.classList.remove('hidden'));
  }

  document.getElementById('backBtn')?.addEventListener('click', () => history.back());

  await loadCurrentWasla();

  on('currentWaslaUpdated', (state) => {
    if (state?.wasla?.id !== lastWaslaId) loadCurrentWasla();
  });

  startPolling(null, () => currentApi.getWasla());
});

window.addEventListener('beforeunload', stopPolling);

async function loadCurrentWasla() {
  const container = document.getElementById('waslaContainer');
  const noWasla = document.getElementById('noWaslaMessage');

  try {
    const state = await currentApi.getWasla();

    if (!state?.wasla) {
      if (container) container.classList.add('hidden');
      if (noWasla) noWasla.classList.remove('hidden');
      return;
    }

    if (noWasla) noWasla.classList.add('hidden');
    if (container) container.classList.remove('hidden');

    if (state.wasla.id !== lastWaslaId) {
      lastWaslaId = state.wasla.id;
      renderWasla(state);
    }
  } catch (err) {
    console.warn('Could not load current wasla:', err.message);
  }
}

function renderWasla(state) {
  const wasla = state.wasla;
  const items = wasla.items || [];

  const nameEl = document.getElementById('waslaName');
  const sharedByEl = document.getElementById('sharedBy');
  const itemsListEl = document.getElementById('waslaItemsList');
  const countEl = document.getElementById('waslaItemCount');

  if (nameEl) nameEl.textContent = wasla.name || '';
  if (sharedByEl) sharedByEl.textContent = state.sharedByName || '';
  if (countEl) countEl.textContent = `${items.length} قصيدة`;

  document.title = `الوصلة الحالية: ${wasla.name} - ديوان الصوفية`;

  if (!itemsListEl) return;

  if (!items.length) {
    showEmpty('waslaItemsList', 'لا توجد قصائد في هذه الوصلة', 'queue_music');
    return;
  }

  itemsListEl.innerHTML = items.map((item, idx) => `
    <a href="view-poem.html?id=${item.poemId}"
      class="flex items-center gap-4 p-4 rounded-xl glass-card hover:bg-white/10
        transition-all group cursor-pointer">
      <div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0
        text-primary-light font-bold border border-primary/30">
        ${idx + 1}
      </div>
      <div class="flex-1 min-w-0">
        <h4 class="text-white font-serif font-bold text-lg group-hover:text-primary-light
          transition-colors truncate">${escapeHtml(item.poemTitle || '')}</h4>
        <p class="text-[#9db8b6] text-sm truncate">${escapeHtml(item.poemPoetName || '')}</p>
      </div>
      <span class="material-symbols-outlined text-[#9db8b6] group-hover:text-white
        transition-colors rotate-180">chevron_right</span>
    </a>`).join('');
}
