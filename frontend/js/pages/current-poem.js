// Current poem (live) page logic for ديوان الصوفية
import { requireAuth, isLead } from '../auth.js';
import { currentApi } from '../api.js';
import { showToast } from '../ui.js';
import { escapeHtml, CATEGORY_LABELS } from '../utils.js';
import { startPolling, stopPolling, on } from '../signalr.js';

if (!requireAuth()) throw new Error('Not authenticated');

let currentPoem = null;
let lastPoemId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (isLead()) {
    document.querySelectorAll('.lead-only').forEach(el => el.classList.remove('hidden'));
  }

  // Back button
  document.getElementById('backBtn')?.addEventListener('click', () => history.back());

  // Initial load
  await loadCurrentPoem();

  // Start polling for updates
  on('currentPoemUpdated', (state) => {
    if (state?.poem?.id !== lastPoemId) {
      loadCurrentPoem();
    }
  });

  startPolling(() => currentApi.getPoem(), null);
});

// Cleanup polling on page unload
window.addEventListener('beforeunload', stopPolling);

async function loadCurrentPoem() {
  const container = document.getElementById('poemContainer');
  const noPoem = document.getElementById('noPoemMessage');

  try {
    const state = await currentApi.getPoem();

    if (!state?.poem) {
      if (container) container.classList.add('hidden');
      if (noPoem) noPoem.classList.remove('hidden');
      return;
    }

    if (noPoem) noPoem.classList.add('hidden');
    if (container) container.classList.remove('hidden');

    if (state.poem.id !== lastPoemId) {
      lastPoemId = state.poem.id;
      currentPoem = state.poem;
      renderPoem(state);
    }
  } catch (err) {
    console.warn('Could not load current poem:', err.message);
  }
}

function renderPoem(state) {
  const poem = state.poem;

  // Update title and meta
  const titleEl = document.getElementById('poemTitle');
  const poetEl = document.getElementById('poemPoet');
  const maqamEl = document.getElementById('poemMaqam');
  const sharedByEl = document.getElementById('sharedBy');
  const sharedAtEl = document.getElementById('sharedAt');

  if (titleEl) titleEl.textContent = poem.title || '';
  if (poetEl)  poetEl.textContent  = poem.poetName || '';
  if (maqamEl) {
    maqamEl.textContent = poem.maqamName || '';
    maqamEl.closest('.maqam-pill')?.classList.toggle('hidden', !poem.maqamName);
  }
  if (sharedByEl) sharedByEl.textContent = state.sharedByName || '';
  if (sharedAtEl && state.sharedAt) {
    sharedAtEl.textContent = new Date(state.sharedAt).toLocaleTimeString('ar-SA', {
      hour: '2-digit', minute: '2-digit'
    });
  }

  // Render poem body
  const bodyEl = document.getElementById('poemBody');
  if (bodyEl && poem.content) {
    const lines = poem.content.split('\n').filter(l => l.trim());
    const verses = [];
    for (let i = 0; i < lines.length; i += 2) {
      verses.push({ sadr: lines[i]?.trim() || '', ajuz: lines[i+1]?.trim() || '' });
    }

    bodyEl.innerHTML = verses.map(v => `
      <div class="group flex flex-col md:flex-row items-center justify-center
        md:justify-between md:gap-8 hover:text-white transition-colors duration-500
        relative py-3">
        <div class="flex-1 text-center w-full md:text-left md:pl-8">
          <span>${escapeHtml(v.sadr)}</span>
          ${v.ajuz ? `<div class="md:hidden text-primary/40 my-1 text-sm">۞</div>` : ''}
        </div>
        ${v.ajuz ? `
          <div class="hidden md:flex items-center justify-center w-12 opacity-30 text-[#d4b068]">
            <span class="text-xl">✤</span>
          </div>
          <div class="flex-1 text-center w-full md:text-right md:pr-8">
            <span>${escapeHtml(v.ajuz)}</span>
          </div>` : ''}
        <div class="absolute inset-0 -mx-4 rounded-xl bg-white/[0.02] opacity-0
          group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      </div>`).join('');
  }

  // Read poem link
  const readLink = document.getElementById('readPoemLink');
  if (readLink) readLink.href = `../pages/view-poem.html?id=${poem.id}`;
  document.title = `القصيدة الحالية: ${poem.title} - ديوان الصوفية`;
}
