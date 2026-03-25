// Home dashboard page for ديوان الصوفية
import { requireAuth, getUser, logout } from '../auth.js';
import { poemsApi } from '../api.js';
import { t, applyLang, toggleLang, getLang } from '../i18n.js';
import { buildNav, showToast, formatDate } from '../ui.js';

// Check authentication
if (!requireAuth()) return;

document.addEventListener('DOMContentLoaded', async () => {
  applyLang();
  
  const user = getUser();
  
  // Update UI elements
  document.getElementById('userGreeting').textContent = `${t('welcome')} ${user.fullName}`;
  document.getElementById('appTitle').textContent = t('appName');
  
  // Language toggle
  const langToggle = document.getElementById('langToggle');
  langToggle.textContent = t('langToggle');
  langToggle.addEventListener('click', () => {
    toggleLang();
    window.location.reload(); // Reload to apply new language
  });
  
  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  // Navigation
  document.getElementById('nav').innerHTML = buildNav('home');
  
  // Main action cards
  setupActionCards();
  
  // Quick search
  setupQuickSearch();
  
  // Load featured poem
  await loadFeaturedPoem();
});

function setupActionCards() {
  // Current poem card
  document.getElementById('currentPoemCard').addEventListener('click', () => {
    window.location.href = '/current-poem.html';
  });
  
  // Current wasla card  
  document.getElementById('currentWaslaCard').addEventListener('click', () => {
    window.location.href = '/current-wasla.html';
  });
  
  // Catalog card
  document.getElementById('catalogCard').addEventListener('click', () => {
    window.location.href = '/poems.html';
  });
}

function setupQuickSearch() {
  const searchForm = document.getElementById('quickSearchForm');
  const searchInput = document.getElementById('quickSearch');
  
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `/poems.html?q=${encodeURIComponent(query)}`;
    }
  });
}

async function loadFeaturedPoem() {
  const featuredContainer = document.getElementById('featuredPoem');
  
  try {
    // Get latest poems
    const response = await poemsApi.getAll({ 
      sortBy: 'CreatedAt', 
      sortDesc: true, 
      pageSize: 1 
    });
    
    if (response.items && response.items.length > 0) {
      const poem = response.items[0];
      renderFeaturedPoem(featuredContainer, poem);
    } else {
      featuredContainer.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading featured poem:', error);
    featuredContainer.style.display = 'none';
  }
}

function renderFeaturedPoem(container, poem) {
  const lang = getLang();
  const poetName = lang === 'ar' ? poem.poetNameAr : poem.poetNameEn;
  const maqamName = lang === 'ar' ? poem.maqamNameAr : poem.maqamNameEn;
  
  // Truncate poem body for preview
  const preview = poem.body.length > 150 ? 
    poem.body.substring(0, 150) + '...' : poem.body;
  
  container.innerHTML = `
    <div class="card card-clickable" data-poem-id="${poem.id}">
      <div class="card-title">${poem.title}</div>
      <div class="card-subtitle">
        ${poetName} • ${maqamName}
        <span style="margin-right: 1rem;">${getBadgeHtml(poem)}</span>
      </div>
      <div class="poem-preview font-arabic text-lg" style="color: var(--text-muted); margin: 1rem 0;">
        ${preview}
      </div>
      <div class="text-sm text-muted">
        ${formatDate(poem.createdAt, false)}
      </div>
    </div>
  `;
  
  // Make clickable
  container.querySelector('.card').addEventListener('click', () => {
    window.location.href = `/poem-detail.html?id=${poem.id}`;
  });
}

function getBadgeHtml(poem) {
  const categoryMap = {
    Ilahiyyat: 'إلهيات',
    Nabawiyyat: 'نبويات', 
    Mufrad: 'مفرد',
    Hadra: 'حضرة'
  };
  
  const lang = getLang();
  const categoryLabel = lang === 'ar' ? 
    (categoryMap[poem.category] || poem.category) : 
    poem.category;
    
  let badges = `<span class="badge badge-${poem.category.toLowerCase()}">${categoryLabel}</span>`;
  
  // Add hadra section badge if applicable
  if (poem.category === 'Hadra' && poem.hadraSection) {
    const sectionMap = {
      Matali: 'مطالع',
      Ruku: 'ركوع', 
      Qiyam: 'قيام'
    };
    
    const sectionLabel = lang === 'ar' ? 
      (sectionMap[poem.hadraSection] || poem.hadraSection) : 
      poem.hadraSection;
      
    badges += ` <span class="badge badge-${poem.hadraSection.toLowerCase()}">${sectionLabel}</span>`;
  }
  
  return badges;
}