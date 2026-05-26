 // ─── State ────────────────────────────────────────────────────────────────────
let updateInterval = null;
let currentLang = 'es';
let currentCurrency = 'USD';

// ─── Translations (añadidas claves para reset) ────────────────────────────────
const popupTranslations = {
  es: {
    badgeFree: "FREE",
    badgePro: "PRO",
    popupTitle: "Configura tu tarifa",
    popupDesc: "Introduce tu tarifa por hora para calibrar el radar de distracciones:",
    setRateBtn: "Guardar",
    opportunityLabel: "Coste de oportunidad hoy",
    closeRedBtn: "Liberar foco y cerrar inactivas",
    optionsBtn: "Historial y reportes avanzados",
    activateBtn: "Activar",
    privateData: "Datos privados locales",
    goProLink: "Desbloquear Premium",
    docsLink: "📘 Guía y FAQ",
    licensePlaceholder: "Código de licencia",
    ratePlaceholder: "$ p.ej. 45",
    alertInvalidRate: "Introduce una tarifa válida.",
    alertClosed: (n) => `${n} pestaña${n !== 1 ? 's' : ''} inactiva${n !== 1 ? 's' : ''} cerrada${n !== 1 ? 's' : ''}.`,
    confirmClose: "¿Cerrar todas las pestañas inactivas? Esta acción no se puede deshacer.",
    alertProActivated: "¡Licencia Pro activada!",
    alertInvalidKey: "Código inválido. Comprueba e inténtalo de nuevo.",
    rateLabel: (rate, symbol) => `Basado en ${symbol}${rate}/h (impacto 20%)`,
    rateWarning: "Configura tu tarifa arriba",
    buyPro: "Comprar Pro (5 USD/EUR)",
    // [NEW]
    resetSuccess: "Coste diario reiniciado a 0",
    resetError: "Solo disponible para usuarios Pro"    
  },
  en: {
    badgeFree: "FREE",
    badgePro: "PRO",
    popupTitle: "Set your rate",
    popupDesc: "Enter your hourly rate to calibrate the distraction radar:",
    setRateBtn: "Save",
    opportunityLabel: "Opportunity Cost Today",
    closeRedBtn: "Release Focus & Close Inactive",
    optionsBtn: "Advanced History & Reports",
    activateBtn: "Activate",
    privateData: "Private local data",
    goProLink: "Unlock Premium",
    docsLink: "📘 Guide & FAQ",
    licensePlaceholder: "License code",
    ratePlaceholder: "$ e.g. 45",
    alertInvalidRate: "Please enter a valid rate.",
    alertClosed: (n) => `Closed ${n} inactive tab${n !== 1 ? 's' : ''}.`,
    confirmClose: "Close all inactive tabs? This action cannot be undone.",
    alertProActivated: "Pro license activated!",
    alertInvalidKey: "Invalid code. Please check and try again.",
    rateLabel: (rate, symbol) => `Based on ${symbol}${rate}/h (20% impact)`,
    rateWarning: "Set your rate using the panel above",
    buyPro: "Buy Pro (5 USD/EUR)",
    // [NEW]
    resetSuccess: "Daily cost reset to 0",
    resetError: "Pro feature only"    
  }
};

function t(key, ...args) {
  const val = popupTranslations[currentLang]?.[key];
  if (typeof val === 'function') return val(...args);
  return val ?? key;
}

// ─── Toast helper ─────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  document.querySelectorAll('.toast').forEach(el => el.remove());
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

// ─── Language ─────────────────────────────────────────────────────────────────
async function loadLanguage() {
  const data = await chrome.storage.local.get('language');
  currentLang = data.language === 'en' ? 'en' : 'es';
}

function syncLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

async function setLanguage(lang) {
  currentLang = lang;
  await chrome.storage.local.set({ language: lang });
  chrome.runtime.sendMessage({ action: "setLanguage", language: lang }, () => {});
  syncLangButtons();
  applyPopupTranslations();
  updatePopupUI();
}

// ─── Currency ─────────────────────────────────────────────────────────────────
async function loadCurrency() {
  const data = await chrome.storage.local.get('currency');
  currentCurrency = data.currency === 'EUR' ? 'EUR' : 'USD';
  const selector = document.getElementById('currencySelectPopup');
  if (selector) selector.value = currentCurrency;
}

async function setCurrency(currency) {
  currentCurrency = currency;
  await chrome.storage.local.set({ currency: currency });
  chrome.runtime.sendMessage({ action: "setCurrency", currency: currency }, () => {});
  updatePopupUI();
}

function getCurrencySymbol() {
  return currentCurrency === 'EUR' ? '€' : '$';
}

// ─── UI Update (con control del botón reset según PRO) ─────────────────────────
function updatePopupUI() {
  chrome.runtime.sendMessage({ action: "forceRecalc" }, () => {
    chrome.runtime.sendMessage({ action: "getCostData" }, (data) => {
      if (!data) return;
      const hourly    = data.hourlyRate || 0;
      const isPro     = !!data.isPro;
      const dailyCost = data.dailyCost  || 0;
      const symbol    = getCurrencySymbol();

      const onboardingDiv = document.getElementById('popupOnboarding');
      if (onboardingDiv) onboardingDiv.style.display = (hourly === 0) ? 'block' : 'none';

      const costEl = document.getElementById('costValue');
      if (costEl) costEl.textContent = `${symbol}${dailyCost.toFixed(2)}`;

      const rateEl = document.getElementById('rateValue');
      if (rateEl) {
        rateEl.textContent = hourly === 0 ? t('rateWarning') : t('rateLabel', hourly, symbol);
      }

      const badge   = document.getElementById('planBadge');
      const link    = document.getElementById('goProLink');
      const proArea = document.getElementById('proArea');
      if (badge) {
        badge.textContent = isPro ? t('badgePro') : t('badgeFree');
        badge.className = `badge ${isPro ? 'pro' : 'free'}`;
      }
      if (link)    link.style.display    = isPro ? 'none' : 'inline';
      if (proArea && isPro) proArea.style.display = 'none';

      // [NEW] Mostrar/ocultar botón de reset según licencia Pro
      const resetBtn = document.getElementById('resetCostBtn');
      if (resetBtn) {
        resetBtn.style.display = isPro ? 'flex' : 'none';
      }
    });
  });
}

// ─── Interval management ──────────────────────────────────────────────────────
function startInterval() {
  if (updateInterval) return;
  updateInterval = setInterval(updatePopupUI, 10_000);
}
function stopInterval() {
  if (updateInterval) { clearInterval(updateInterval); updateInterval = null; }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadLanguage();
  await loadCurrency();
  applyPopupTranslations();
  syncLangButtons();
  updatePopupUI();
  startInterval();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopInterval();
    else { updatePopupUI(); startInterval(); }
  });

  // Language toggle
  document.getElementById('langToggle')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    const lang = btn.dataset.lang;
    if (lang && lang !== currentLang) await setLanguage(lang);
  });

  // Currency selector
  const currencySelect = document.getElementById('currencySelectPopup');
  if (currencySelect) {
    currencySelect.addEventListener('change', async (e) => {
      await setCurrency(e.target.value);
    });
  }

  // Buy Pro button
  const buyBtn = document.getElementById('buyProPopup');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      const currency = currentCurrency;
      window.open(`https://gumroad.com/l/tabcost-pro?currency=${currency}`, '_blank');
    });
    buyBtn.textContent = t('buyPro');
  }

  // Save rate (onboarding)
  document.getElementById('saveFastRateBtn')?.addEventListener('click', () => {
    const rate = parseFloat(document.getElementById('fastRateInput').value);
    if (rate > 0) {
      chrome.storage.local.set({ hourlyRate: rate }, () => {
        document.getElementById('popupOnboarding').style.display = 'none';
        setTimeout(updatePopupUI, 300);
      });
    } else {
      showToast(t('alertInvalidRate'), 'error');
    }
  });

  document.getElementById('fastRateInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('saveFastRateBtn')?.click();
  });

  // Close inactive tabs
  document.getElementById('closeRedBtn')?.addEventListener('click', () => {
    if (confirm(t('confirmClose'))) {
      chrome.runtime.sendMessage({ action: "closeRedTabs" }, (res) => {
        if (chrome.runtime.lastError) return;
        showToast(t('alertClosed', res.closed));
        updatePopupUI();
      });
    }
  });

  // Open options
  document.getElementById('optionsBtn')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Toggle pro input area
  document.getElementById('goProLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    const area = document.getElementById('proArea');
    if (area) {
      const isVisible = area.style.display === 'block';
      area.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) area.querySelector('input')?.focus();
    }
  });

  // Activate license
  document.getElementById('activateBtn')?.addEventListener('click', activateLicense);
  document.getElementById('licenseKey')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') activateLicense();
  });

 // [NEW] Reset daily cost button
  const resetBtn = document.getElementById('resetCostBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const { isPro } = await chrome.storage.local.get('isPro');
      if (!isPro) {
        showToast(t('resetError'), 'error');
        return;
      }
      chrome.runtime.sendMessage({ action: "resetDailyCost" }, (response) => {
        if (response && response.success) {
          showToast(t('resetSuccess'));
          updatePopupUI();
        } else {
          showToast(t('resetError'), 'error');
        }
      });
    });
  }

  // [NEW] Enlace a la documentación (docs.html)
  const docsLink = document.getElementById('docsLink');
  if (docsLink) {
    docsLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL('docs.html') });
    });
  }
});

async function activateLicense() {
  const key = document.getElementById('licenseKey').value.trim();
  if (!key) return;
  const btn = document.getElementById('activateBtn');
  btn.textContent = "···";
  btn.disabled = true;
  chrome.runtime.sendMessage({ action: "verifyLicense", key }, (response) => {
    if (response?.success) {
      showToast(t('alertProActivated'));
      setTimeout(updatePopupUI, 500);
    } else {
      showToast(t('alertInvalidKey'), 'error');
    }
    btn.textContent = t('activateBtn');
    btn.disabled = false;
  });
}

window.addEventListener('beforeunload', stopInterval);

function applyPopupTranslations() {
  const set = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };
  const ph = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.placeholder = t(key);
  };

  set('planBadge',           'badgeFree');
  set('popupOnboardingTitle','popupTitle');
  set('popupOnboardingDesc', 'popupDesc');
  set('saveFastRateBtn',     'setRateBtn');
  set('opportunityLabel',    'opportunityLabel');
  set('closeRedBtn',         'closeRedBtn');
  set('optionsBtn',          'optionsBtn');
  set('activateBtn',         'activateBtn');
  set('privateData',         'privateData');
  set('goProLink',           'goProLink');
  ph('licenseKey',           'licensePlaceholder');
  ph('fastRateInput',        'ratePlaceholder');

  const buyBtn = document.getElementById('buyProPopup');
  if (buyBtn) buyBtn.textContent = t('buyPro');
}