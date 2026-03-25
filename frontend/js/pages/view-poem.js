// View poem page logic for ديوان الصوفية
import { requireAuth, isLead } from '../auth.js';
import { poemsApi, currentApi, waslatApi } from '../api.js';
import { showToast, showConfirm } from '../ui.js';
import { escapeHtml, getParam, CATEGORY_LABELS, HADRA_SECTION_LABELS } from '../utils.js';

if (!requireAuth()) throw new Error('Not authenticated');

const poemId = getParam('id');
let poem = null;
let readingProgress = 0;

document.addEventListener('DOMContentLoaded', async () => {
  if (!poemId) {
    window.location.href = 'poems.html';
    return;
  }

  if (isLead()) {
    document.querySelectorAll('.lead-only').forEach(el => el.classList.remove('hidden'));
  }

  // Back button
  document.getElementById('backBtn')?.addEventListener('click', () => history.back());

  // Bookmark toggle
  const bookmarks = JSON.parse(localStorage.getItem('divan_bookmarks') || '[]');
  const bookmarkBtn = document.getElementById('bookmarkBtn');
  updateBookmarkBtn(bookmarks.includes(poemId));

  bookmarkBtn?.addEventListener('click', () => {
    const saved = JSON.parse(localStorage.getItem('divan_bookmarks') || '[]');
    const idx = saved.indexOf(poemId);
    if (idx === -1) {
      saved.push(poemId);
      showToast('تم حفظ القصيدة في الإشارات المرجعية', 'success');
    } else {
      saved.splice(idx, 1);
      showToast('تم إزالة القصيدة من الإشارات المرجعية', 'info');
    }
    localStorage.setItem('divan_bookmarks', JSON.stringify(saved));
    updateBookmarkBtn(idx === -1);
  });

  // Load poem
  await loadPoem();

  // Share poem (LeadMunshid only)
  document.getElementById('sharePoemBtn')?.addEventListener('click', async () => {
    try {
      await currentApi.sharePoem(poemId);
      showToast('تم مشاركة القصيدة مع الجميع', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Edit poem
  document.getElementById('editPoemBtn')?.addEventListener('click', () => {
    window.location.href = `add-poem.html?id=${poemId}`;
  });

  // Delete poem
  document.getElementById('deletePoemBtn')?.addEventListener('click', async () => {
    const confirmed = await showConfirm(
      `هل أنت متأكد من حذف "${poem?.title}"؟`,
      'حذف القصيدة'
    );
    if (!confirmed) return;
    try {
      await poemsApi.delete(poemId);
      showToast('تم حذف القصيدة', 'success');
      setTimeout(() => { window.location.href = 'poems.html'; }, 800);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Track reading progress on scroll
  window.addEventListener('scroll', updateProgress);
});

function updateBookmarkBtn(isBookmarked) {
  const btn = document.getElementById('bookmarkBtn');
  if (!btn) return;
  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon) icon.textContent = isBookmarked ? 'bookmark' : 'bookmark_border';
  btn.title = isBookmarked ? 'إزالة الإشارة المرجعية' : 'إضافة إشارة مرجعية';
  btn.style.color = isBookmarked ? '#d4b068' : '';
}

async function loadPoem() {
  const titleEl = document.getElementById('poemTitle');
  const poetEl = document.getElementById('poemPoet');
  const maqamEl = document.getElementById('poemMaqam');
  const categoryEl = document.getElementById('poemCategory');
  const bodyEl = document.getElementById('poemBody');

  // Show skeleton loading
  if (titleEl) titleEl.innerHTML = '<div class="skeleton h-8 w-48 mx-auto rounded"></div>';
  if (bodyEl) bodyEl.innerHTML = Array(3).fill(`
    <div class="skeleton h-6 w-full rounded mb-3"></div>
    <div class="skeleton h-6 w-3/4 mx-auto rounded mb-6"></div>`).join('');

  try {
    poem = await poemsApi.getById(poemId);

    if (titleEl) titleEl.textContent = poem.title || '';
    if (poetEl) poetEl.textContent = poem.poetName || '';
    if (maqamEl) {
      maqamEl.textContent = poem.maqamName || '';
      maqamEl.parentElement?.classList.toggle('hidden', !poem.maqamName);
    }
    if (categoryEl) {
      categoryEl.textContent = CATEGORY_LABELS[poem.category] || poem.category || '';
    }

    // Update page title
    document.title = `${poem.title} - ديوان الصوفية`;

    renderPoemBody(poem, bodyEl);
    updateProgress();
  } catch (err) {
    if (bodyEl) bodyEl.innerHTML = `
      <div class="text-center py-12 text-red-400">${escapeHtml(err.message)}</div>`;
  }
}

function renderPoemBody(poem, container) {
  if (!container || !poem.content) return;

  const lines = poem.content.split('\n').filter(l => l.trim());
  const verses = [];

  // Group lines into verses (pairs)
  for (let i = 0; i < lines.length; i += 2) {
    const sadr = lines[i]?.trim() || '';
    const ajuz = lines[i + 1]?.trim() || '';
    verses.push({ sadr, ajuz });
  }

  if (!verses.length) {
    container.innerHTML = `<p class="font-poem text-2xl leading-loose text-center whitespace-pre-wrap">${escapeHtml(poem.content)}</p>`;
    return;
  }

  container.innerHTML = verses.map((v, idx) => `
    <div class="group flex flex-col md:flex-row items-center justify-center
      md:justify-between md:gap-8 hover:text-white transition-colors duration-500
      relative py-3 verse-item" data-verse="${idx}">
      <!-- Mobile: first hemistich -->
      <div class="flex-1 text-center w-full md:text-left md:pl-8 relative">
        <span>${escapeHtml(v.sadr)}</span>
        ${v.ajuz ? `<div class="md:hidden text-primary/40 my-1 text-sm">۞</div>` : ''}
      </div>
      <!-- Desktop divider -->
      ${v.ajuz ? `
        <div class="hidden md:flex items-center justify-center w-12 opacity-30 text-[#d4b068] select-none">
          <span class="text-xl">✤</span>
        </div>
        <div class="flex-1 text-center w-full md:text-right md:pr-8">
          <span>${escapeHtml(v.ajuz)}</span>
        </div>` : ''}
      <!-- Hover effect -->
      <div class="absolute inset-0 -mx-4 rounded-xl bg-white/[0.02] opacity-0
        group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </div>`).join('');
}

function updateProgress() {
  const progressBar = document.getElementById('progressBar');
  if (!progressBar) return;

  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = height > 0 ? (winScroll / height) * 100 : 0;

  progressBar.style.width = `${Math.min(scrolled, 100)}%`;
}
