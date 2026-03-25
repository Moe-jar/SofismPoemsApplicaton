// Home page logic for ديوان الصوفية
import { requireAuth, getUser, isLead, logout } from '../auth.js';
import { currentApi, poemsApi } from '../api.js';
import { showToast } from '../ui.js';

if (!requireAuth('login.html')) throw new Error('Not authenticated');

document.addEventListener('DOMContentLoaded', async () => {
  const user = getUser();

  // Display user info
  const userNameEl = document.getElementById('userName');
  const userRoleEl = document.getElementById('userRole');
  if (userNameEl) userNameEl.textContent = user?.fullName || user?.username || '';
  if (userRoleEl) userRoleEl.textContent = user?.role === 'LeadMunshid' ? 'منشد رئيسي' : 'منشد';

  // Show lead-only elements
  if (isLead()) {
    document.querySelectorAll('.lead-only').forEach(el => el.classList.remove('hidden'));
  }

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', logout);

  // Search form
  const searchInput = document.getElementById('searchInput');
  document.getElementById('searchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchInput?.value.trim();
    if (q) window.location.href = `pages/poems.html?q=${encodeURIComponent(q)}`;
    else window.location.href = 'pages/poems.html';
  });

  // Load current poem state
  try {
    const currentPoem = await currentApi.getPoem();
    renderCurrentPoem(currentPoem);
  } catch (err) {
    console.warn('Could not load current poem:', err.message);
  }

  // Load current wasla state
  try {
    const currentWasla = await currentApi.getWasla();
    renderCurrentWasla(currentWasla);
  } catch (err) {
    console.warn('Could not load current wasla:', err.message);
  }

  // Load featured poems
  try {
    const result = await poemsApi.getAll({ page: 1, pageSize: 3 });
    renderFeaturedPoems(result?.items || []);
  } catch (err) {
    console.warn('Could not load featured poems:', err.message);
  }
});

function renderCurrentPoem(state) {
  const card = document.getElementById('currentPoemCard');
  const noPoem = document.getElementById('noPoemMsg');
  if (!card) return;

  if (state?.poem) {
    if (noPoem) noPoem.classList.add('hidden');
    card.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-primary-light text-2xl">menu_book</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-white font-serif font-bold text-lg truncate">${state.poem.title}</h3>
          <p class="text-[#9db8b6] text-sm truncate">${state.poem.poetName || ''}</p>
        </div>
        <a href="pages/view-poem.html?id=${state.poem.id}"
          class="text-primary-light hover:text-white transition-colors">
          <span class="material-symbols-outlined rotate-180">arrow_right_alt</span>
        </a>
      </div>`;
    card.parentElement?.classList.remove('hidden');
  }
}

function renderCurrentWasla(state) {
  const card = document.getElementById('currentWaslaCard');
  if (!card) return;

  if (state?.wasla) {
    card.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[#9db8b6] text-2xl">queue_music</span>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-white font-bold text-lg truncate">${state.wasla.name}</h3>
          <p class="text-[#9db8b6] text-sm">${state.wasla.itemCount || 0} قصيدة</p>
        </div>
        <a href="pages/current-wasla.html"
          class="text-[#9db8b6] hover:text-white transition-colors">
          <span class="material-symbols-outlined rotate-180">arrow_right_alt</span>
        </a>
      </div>`;
  }
}

function renderFeaturedPoems(poems) {
  const container = document.getElementById('featuredPoems');
  if (!container || !poems.length) return;

  container.innerHTML = poems.map(p => `
    <a href="pages/view-poem.html?id=${p.id}"
      class="glass-panel p-5 rounded-2xl flex items-center gap-5 cursor-pointer
        hover:bg-white/5 transition-colors group">
      <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-black
        flex items-center justify-center shrink-0 shadow-lg">
        <span class="font-serif text-2xl text-white font-bold">
          ${(p.title || '؟')[0]}
        </span>
      </div>
      <div class="flex-1 text-right min-w-0">
        <h3 class="text-white font-serif text-xl leading-none mb-2
          group-hover:text-primary-light transition-colors truncate">${p.title}</h3>
        <p class="text-sm text-[#9db8b6] line-clamp-1">${p.poetName || ''}</p>
      </div>
      <div class="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center
        group-hover:bg-primary group-hover:text-white transition-all text-[#9db8b6]">
        <span class="material-symbols-outlined text-[20px]">chevron_left</span>
      </div>
    </a>`).join('');
}
