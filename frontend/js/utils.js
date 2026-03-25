// Utility helpers for ديوان الصوفية

// Arabic text normalization for search
export function normalizeArabic(text) {
  if (!text) return '';
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ى]/g, 'ي')
    .replace(/[ة]/g, 'ه')
    .replace(/[\u064B-\u065F]/g, '') // Remove tashkeel
    .trim();
}

// Get URL search param
export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Category labels mapping
export const CATEGORY_LABELS = {
  Ilahiyat: 'إلهيات',
  Nabawiyat: 'نبويات',
  Hadra: 'حضرة',
  Mufrad: 'مفرد',
};

// Hadra section labels
export const HADRA_SECTION_LABELS = {
  Opening: 'الافتتاح',
  Main: 'الرئيسي',
  Closing: 'الختام',
};

// Maqam color palette for badges
const MAQAM_COLORS = [
  { bg: 'rgba(10,87,80,0.3)',    border: 'rgba(21,140,130,0.4)', text: '#4ecdc4' },
  { bg: 'rgba(140,126,21,0.3)',  border: 'rgba(140,126,21,0.4)', text: '#d4c34a' },
  { bg: 'rgba(140,58,21,0.3)',   border: 'rgba(140,58,21,0.4)',  text: '#d4764a' },
  { bg: 'rgba(42,140,21,0.3)',   border: 'rgba(42,140,21,0.4)',  text: '#60d44a' },
  { bg: 'rgba(10,87,140,0.3)',   border: 'rgba(10,87,140,0.4)',  text: '#4a8cd4' },
  { bg: 'rgba(90,21,140,0.3)',   border: 'rgba(90,21,140,0.4)',  text: '#c44ae8' },
];
const maqamColorMap = {};
let colorIndex = 0;

export function getMaqamColor(maqamName) {
  if (!maqamColorMap[maqamName]) {
    maqamColorMap[maqamName] = MAQAM_COLORS[colorIndex % MAQAM_COLORS.length];
    colorIndex++;
  }
  return maqamColorMap[maqamName];
}

// Debounce function
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Format a datetime string to Arabic locale
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Escape HTML to prevent XSS
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Build poem card HTML (for catalog/waslat pages)
export function buildPoemCard(poem, options = {}) {
  const { showShare = false, showAddToWasla = false, basePath = '' } = options;
  const maqamColor = poem.maqamName ? getMaqamColor(poem.maqamName) : MAQAM_COLORS[0];
  const categoryLabel = CATEGORY_LABELS[poem.category] || poem.category || '';

  return `
    <article class="glass-card rounded-2xl p-5 group hover:bg-[#1c2626]/60 transition-all duration-300
      hover:shadow-lg hover:-translate-y-1 cursor-pointer relative overflow-hidden"
      data-id="${poem.id}">
      <div class="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-primary/50 to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2 mb-1">
            ${poem.maqamName ? `
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide"
                style="background:${maqamColor.bg};border:1px solid ${maqamColor.border};color:${maqamColor.text};">
                <span class="w-1.5 h-1.5 rounded-full" style="background:${maqamColor.text};"></span>
                مقام ${escapeHtml(poem.maqamName)}
              </span>` : ''}
            ${categoryLabel ? `
              <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5
                border border-white/10 text-[#9db8b6] text-xs">${escapeHtml(categoryLabel)}</span>` : ''}
          </div>
          <h3 class="text-white text-xl md:text-2xl font-serif font-bold leading-normal
            group-hover:text-primary-light transition-colors">
            ${escapeHtml(poem.title)}
          </h3>
          ${poem.poetName ? `
            <p class="text-[#9db8b6] text-sm font-medium flex items-center gap-2 mt-1">
              <span class="material-symbols-outlined text-base opacity-70">edit</span>
              ${escapeHtml(poem.poetName)}
            </p>` : ''}
        </div>
        <button class="bookmark-btn text-[#9db8b6] hover:text-yellow-400 hover:bg-white/5
          p-2 rounded-full transition-all" title="إشارة مرجعية" data-id="${poem.id}">
          <span class="material-symbols-outlined">bookmark</span>
        </button>
      </div>
      <div class="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between
        text-xs text-[#6b8c89] gap-3">
        <div class="flex items-center gap-3">
          ${showShare ? `
            <button class="share-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-white/5 hover:bg-primary/20 hover:text-primary-light transition-colors text-[#9db8b6]"
              data-id="${poem.id}">
              <span class="material-symbols-outlined text-lg">podcasts</span>
              <span class="font-medium">عرض للجميع</span>
            </button>` : ''}
          ${showAddToWasla ? `
            <button class="add-wasla-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-white/5 hover:bg-primary/20 hover:text-primary-light transition-colors text-[#9db8b6]"
              data-id="${poem.id}" data-title="${escapeHtml(poem.title)}">
              <span class="material-symbols-outlined text-lg">playlist_add</span>
              <span class="font-medium">إضافة للوصلة</span>
            </button>` : ''}
        </div>
        <a href="${basePath}view-poem.html?id=${poem.id}"
          class="flex items-center gap-1 text-primary-light font-bold hover:underline">
          اقرأ القصيدة
          <span class="material-symbols-outlined text-sm rotate-180">arrow_right_alt</span>
        </a>
      </div>
    </article>`;
}
