// ─── State ────────────────────────────────────────────────────────────────────
let refreshInterval   = null;
let keepAliveInterval = null;
let currentHistory    = [];
let currentRange      = 7;
let ignoredDomains    = [];
let currentLang       = 'es';
let currentCurrency   = 'USD';

// ─── Translations ─────────────────────────────────────────────────────────────
const translations = {
  es: {
    welcomeTitle: "Bienvenido a TabCost",
    welcomeDesc: "Configura tu tarifa por hora para empezar a medir el coste de oportunidad.",
    currencyLabel: "USD / hora",
    startBtn: "Iniciar auditoría",
    panelTitle: "Panel de control",
    hourlyRateTitle: "Tarifa por hora",
    saveRateBtn: "Guardar tarifa",
    unlockMsg: "Desbloquea las funciones avanzadas activando la licencia Pro.",
    proSettingsTitle: "Configuración Pro",
    graceLabel: "Minutos de gracia:",
    graceHint: "(inactividad antes de contar)",
    impactLabel: "Porcentaje de impacto:",
    impactHint: "% de la tarifa por minuto",
    autoCloseLabel: "Cerrar automáticamente (min):",
    autoCloseHint: "0 = desactivado",
    notifThresholdLabel: "Umbral de notificación:",
    notifEnabledLabel: "Notificaciones push:",
    notifEnabledTrue: "Activadas",
    notifEnabledFalse: "Desactivadas",
    saveProConfigBtn: "Guardar configuración Pro",
    historyLockMsg: "Historial completo y exportación",
    docsLink: "📘 Guía y FAQ",
    historyTitle: "Historial de pérdidas",
    rangeLabel: "Mostrar últimos:",
    applyRangeBtn: "Actualizar gráfico",
    exportCsvBtn: "Exportar CSV (rango actual)",
    auditTitle: "Auditoría de pestañas críticas",
    tabHeader: "Pestaña",
    timeHeader: "Tiempo inactivo",
    costHeader: "Coste de oportunidad",
    loadingText: "Cargando...",
    refreshBtn: "Actualizar",
    noData: "No hay pestañas inactivas (dentro del período de gracia).",
    rateUpdated: "Tarifa actualizada.",
    proActivated: "¡Pro activado! Recargando...",
    configSaved: "Configuración Pro guardada.",
    errorSaving: "Error al guardar.",
    noHistory: "Sin datos en el rango seleccionado.",
    invalidRate: "Introduce una tarifa válida.",
    ignoredTitle: "Dominios ignorados",
    ignoredDesc: "Añade dominios (p.ej. spotify.com) para excluir sus pestañas del cálculo.",
    addDomainBtn: "Añadir dominio",
    domainPlaceholder: "ejemplo.com",
    removeDomain: "Eliminar",
    domainAdded: "Dominio añadido.",
    domainExists: "El dominio ya está en la lista.",
    invalidDomain: "Introduce un dominio válido (p.ej. spotify.com).",
    domainRemoved: "Dominio eliminado.",
    licenseTitle: "Licencia Pro",
    licenseDesc: "Introduce tu código de licencia de Gumroad para desbloquear todas las funciones.",
    activateBtn: "Activar Pro",
    licenseVerifying: "Verificando...",
    licenseValid: "¡Licencia válida! Pro activado. Recargando...",
    licenseInvalid: "Código inválido. Comprueba e inténtalo de nuevo.",
    gotoLicense: "Activar licencia Pro",
    buyPro: "Comprar Pro (5 USD/EUR)",
    howItWorksTitle: "Cómo funciona TabCost",
    howItWorksContent: `
      <p><strong>El valor de tu tiempo</strong> — Cada minuto que una pestaña permanece inactiva (no visitada) después del período de gracia, se calcula un pequeño coste basado en tu tarifa por hora. Esto muestra el "coste de oportunidad" de las pestañas olvidadas.</p>
      <p><strong>Fórmula de cálculo</strong> — <code>Coste por minuto = (Tarifa/hora ÷ 60) × Porcentaje de impacto</code>. El impacto por defecto es 20%; los usuarios Pro pueden ajustarlo.</p>
      <p><strong>Funciones gratuitas</strong> — Todos los usuarios pueden:</p>
      <ul><li>Ver el coste diario acumulado en el popup.</li><li>Auditar las pestañas inactivas y su coste individual.</li><li>Cerrar manualmente las pestañas inactivas con el botón "Liberar foco".</li><li>Configurar su tarifa por hora.</li><li>Cambiar el idioma (ES/EN).</li></ul>
      <p><strong>Funciones Pro</strong> — Activa la licencia para obtener:</p>
      <ul><li>Ignorar dominios específicos (p.ej. Spotify, YouTube).</li><li>Cerrar automáticamente pestañas tras X minutos.</li><li>Historial completo con gráficos y exportación CSV.</li><li>Ajustar el porcentaje de impacto y los minutos de gracia.</li><li><strong>Exportar la lista actual de pestañas inactivas a CSV.</strong></li></ul>
      <p><strong>¿Por qué a veces se "detiene"?</strong> — El navegador puede suspender la extensión para ahorrar recursos. Al reactivarse, TabCost recupera el tiempo perdido (hasta 15 minutos por ciclo). Si ves que no se actualiza, abre el popup o esta página para reactivarla.</p>
      <p><strong>Consejos</strong> — Usa una tarifa realista. Ajusta los minutos de gracia para evitar que las pausas cortas cuenten. Activa las notificaciones para recibir alertas cuando el coste supere un umbral.</p>
    `,
    exportTabsBtn: "📎 Exportar pestañas inactivas a CSV",
    exportTabsSuccess: "Exportación completada",
    exportTabsError: "Error al exportar",
    exportTabsNoData: "No hay pestañas inactivas para exportar."
  },
  en: {
    welcomeTitle: "Welcome to TabCost",
    welcomeDesc: "Set your hourly rate to start tracking opportunity cost.",
    currencyLabel: "USD / hour",
    startBtn: "Start Audit",
    panelTitle: "Control Panel",
    hourlyRateTitle: "Hourly Rate",
    saveRateBtn: "Save Rate",
    unlockMsg: "Unlock advanced features by activating your Pro license.",
    proSettingsTitle: "Pro Settings",
    graceLabel: "Grace minutes:",
    graceHint: "(inactivity before counting)",
    impactLabel: "Impact percentage:",
    impactHint: "% of rate per minute",
    autoCloseLabel: "Auto-close after (min):",
    autoCloseHint: "0 = off",
    notifThresholdLabel: "Notification threshold:",
    notifEnabledLabel: "Push notifications:",
    notifEnabledTrue: "Enabled",
    notifEnabledFalse: "Disabled",
    saveProConfigBtn: "Save Pro Settings",
    historyLockMsg: "Full history and export",
    docsLink: "📘 Guide & FAQ",
    historyTitle: "Loss History",
    rangeLabel: "Show last:",
    applyRangeBtn: "Update chart",
    exportCsvBtn: "Export CSV (current range)",
    auditTitle: "Critical Tabs Audit",
    tabHeader: "Tab",
    timeHeader: "Inactive time",
    costHeader: "Opportunity cost",
    loadingText: "Loading...",
    refreshBtn: "Refresh",
    noData: "No inactive tabs (within grace period).",
    rateUpdated: "Rate updated.",
    proActivated: "Pro activated! Reloading...",
    configSaved: "Pro settings saved.",
    errorSaving: "Error saving.",
    noHistory: "No data in selected range.",
    invalidRate: "Please enter a valid rate.",
    ignoredTitle: "Ignored domains",
    ignoredDesc: "Add domains (e.g., spotify.com) to exclude their tabs from counting.",
    addDomainBtn: "Add domain",
    domainPlaceholder: "example.com",
    removeDomain: "Remove",
    domainAdded: "Domain added.",
    domainExists: "Domain already in list.",
    invalidDomain: "Enter a valid domain (e.g., spotify.com).",
    domainRemoved: "Domain removed.",
    licenseTitle: "Pro License",
    licenseDesc: "Enter your Gumroad license code to unlock all features.",
    activateBtn: "Activate Pro",
    licenseVerifying: "Verifying...",
    licenseValid: "Valid license. Pro activated! Reloading...",
    licenseInvalid: "Invalid code. Please check and try again.",
    gotoLicense: "Activate Pro License",
    buyPro: "Buy Pro (5 USD/EUR)",
    howItWorksTitle: "How TabCost works",
    howItWorksContent: `
      <p><strong>The value of your time</strong> — Every minute a tab stays inactive (not visited) after a grace period, a small cost is calculated based on your hourly rate. This shows the "opportunity cost" of forgotten tabs.</p>
      <p><strong>Calculation formula</strong> — <code>Cost per minute = (Hourly rate ÷ 60) × Impact percentage</code>. Default impact is 20%; Pro users can adjust it.</p>
      <p><strong>Free features</strong> — All users can:</p>
      <ul><li>See the daily accumulated cost in the popup.</li><li>Audit inactive tabs and their individual cost.</li><li>Manually close inactive tabs with the "Release Focus" button.</li><li>Set your hourly rate.</li><li>Switch language (ES/EN).</li></ul>
      <p><strong>Pro features</strong> — Activate the license to get:</p>
      <ul><li>Ignore specific domains (e.g., Spotify, YouTube).</li><li>Auto-close tabs after X minutes.</li><li>Full history with charts and CSV export.</li><li>Adjust impact percentage and grace minutes.</li><li><strong>Export current inactive tabs list to CSV.</strong></li></ul>
      <p><strong>Why does it sometimes "stop"?</strong> — The browser may suspend the extension to save resources. When it wakes up, TabCost recovers lost time (up to 15 minutes per cycle). If you notice it's not updating, open the popup or options page to reactivate it.</p>
      <p><strong>Tips</strong> — Set a realistic hourly rate. Use grace minutes to avoid counting short pauses. Enable notifications to get alerts when the cost exceeds a threshold.</p>
    `,
    exportTabsBtn: "📎 Export inactive tabs to CSV",
    exportTabsSuccess: "Export completed",
    exportTabsError: "Export error",
    exportTabsNoData: "No inactive tabs to export."
  }
};

function t(key) {
  return translations[currentLang]?.[key] ?? key;
}

// ─── Toast helper ─────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ─── Language ─────────────────────────────────────────────────────────────────
async function loadLanguage() {
  const data = await chrome.storage.local.get('language');
  currentLang = data.language === 'en' ? 'en' : 'es';
  syncLangButtons();
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
  applyTranslations();
  renderRealInactivityTable();
  const { isPro } = await chrome.storage.local.get('isPro');
  if (isPro) { drawHistoryChartWithRange(); renderIgnoredDomainsList(); }
}

// ─── "How it works" ──────────────────────────────────────────────────────────
function updateExplanationCard() {
  const el = document.getElementById('howItWorksContent');
  if (el) el.innerHTML = translations[currentLang].howItWorksContent;
}

// ─── Apply translations ───────────────────────────────────────────────────────
function applyTranslations() {
  const set = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };

  document.querySelector('.page-header h1').textContent = t('panelTitle');

  const map = {
    onboardingTitle:    'welcomeTitle',
    onboardingDesc:     'welcomeDesc',
    currencyLabel:      'currencyLabel',
    startOnboardingBtn: 'startBtn',
    hourlyRateTitle:    'hourlyRateTitle',
    saveRateBtn:        'saveRateBtn',
    licenseTitle:       'licenseTitle',
    licenseDesc:        'licenseDesc',
    activateProBtn:     'activateBtn',
    proSettingsTitle:   'proSettingsTitle',
    graceLabel:         'graceLabel',
    graceHint:          'graceHint',
    impactLabel:        'impactLabel',
    impactHint:         'impactHint',
    autoCloseLabel:     'autoCloseLabel',
    autoCloseHint:      'autoCloseHint',
    notifThresholdLabel:'notifThresholdLabel',
    notifEnabledLabel:  'notifEnabledLabel',
    notifEnabledTrue:   'notifEnabledTrue',
    notifEnabledFalse:  'notifEnabledFalse',
    saveProConfigBtn:   'saveProConfigBtn',
    ignoredTitle:       'ignoredTitle',
    ignoredDesc:        'ignoredDesc',
    addDomainBtn:       'addDomainBtn',
    historyTitle:       'historyTitle',
    rangeLabel:         'rangeLabel',
    applyRangeBtn:      'applyRangeBtn',
    exportCsvBtn:       'exportCsvBtn',
    auditTitle:         'auditTitle',
    tabHeader:          'tabHeader',
    timeHeader:         'timeHeader',
    costHeader:         'costHeader',
    refreshTableBtn:    'refreshBtn',
    howItWorksTitle:    'howItWorksTitle',
    unlockMsg:          'unlockMsg',
    docsLink:           'docsLink',
    historyLockMsg:     'historyLockMsg',
    exportTabsBtn:      'exportTabsBtn'
  };

  for (const [id, key] of Object.entries(map)) set(id, key);

  const newDomainInput = document.getElementById('newDomainInput');
  if (newDomainInput) newDomainInput.placeholder = t('domainPlaceholder');

  document.querySelectorAll('#gotoLicenseBtn, #historyGotoLicenseBtn').forEach(btn => {
    if (btn) btn.textContent = t('gotoLicense');
  });

  const buyBtn = document.getElementById('buyProBtn');
  if (buyBtn) buyBtn.textContent = t('buyPro');

  updateExplanationCard();
}

// ─── Accordion ────────────────────────────────────────────────────────────────
function setupAccordion() {
  const header  = document.getElementById('infoHeader');
  const content = document.getElementById('infoContent');
  const toggle  = document.getElementById('infoToggle');
  if (!header || !content) return;

  let isOpen = false;
  content.style.maxHeight = '0';
  toggle.textContent = '▼';

  header.addEventListener('click', () => {
    isOpen = !isOpen;
    content.style.maxHeight = isOpen ? content.scrollHeight + 'px' : '0';
    toggle.textContent = isOpen ? '▲' : '▼';
  });
}

// ─── Settings Loader (incluye currency) ───────────────────────────────────────
async function loadSettings() {
  const data = await chrome.storage.local.get([
    'hourlyRate','isPro','graceMinutes','impactPercent',
    'autoCloseMinutes','notificationThreshold','notificationsEnabled','dailyHistory','currency'
  ]);

  if (!data.hourlyRate || data.hourlyRate === 0) {
    document.getElementById('onboardingSection').style.display = 'block';
  } else {
    document.getElementById('rateInput').value = data.hourlyRate;
    renderRealInactivityTable();
  }

  // Cargar moneda
  currentCurrency = data.currency === 'EUR' ? 'EUR' : 'USD';
  const currencySelect = document.getElementById('currencySelect');
  if (currencySelect) currencySelect.value = currentCurrency;

  const isPro         = !!data.isPro;
  const proConfigCard = document.getElementById('proConfigCard');
  const proConfigLock = document.getElementById('proConfigLock');
  const historyLock   = document.getElementById('historyLock');
  const exportBtn     = document.getElementById('exportCsvBtn');
  const rangeRow      = document.querySelector('#historyCard .flex-row');
  const exportTabsBtn = document.getElementById('exportTabsBtn');

  if (isPro) {
    if (proConfigLock) proConfigLock.style.display = 'none';
    if (historyLock)   historyLock.style.display   = 'none';
    if (exportBtn)     exportBtn.style.display      = 'inline-block';
    if (rangeRow)      rangeRow.style.display        = 'flex';
    if (proConfigCard) proConfigCard.style.opacity   = '1';
    if (exportTabsBtn) exportTabsBtn.style.display   = 'inline-block';

    document.getElementById('graceMinutes').value          = data.graceMinutes          ?? 5;
    document.getElementById('impactPercent').value         = data.impactPercent         ?? 20;
    document.getElementById('autoCloseMinutes').value      = data.autoCloseMinutes      ?? 0;
    document.getElementById('notificationThreshold').value = data.notificationThreshold ?? 2.50;
    document.getElementById('notificationsEnabled').value  = data.notificationsEnabled ? 'true' : 'false';

    currentHistory = data.dailyHistory || [];
    currentRange   = 7;
    const rangeSelect = document.getElementById('rangeDays');
    if (rangeSelect) rangeSelect.value = "7";
    drawHistoryChartWithRange();
    updateRangeInfo();
  } else {
    if (proConfigCard) proConfigCard.style.opacity = '0.6';
    if (rangeRow)      rangeRow.style.display = 'none';
    if (exportTabsBtn) exportTabsBtn.style.display = 'none';
  }
}

// ─── Ignored Domains ─────────────────────────────────────────────────────────
async function loadIgnoredDomains() {
  const data = await chrome.storage.local.get('ignoredDomains');
  ignoredDomains = data.ignoredDomains || [];
  renderIgnoredDomainsList();
}

function renderIgnoredDomainsList() {
  const container = document.getElementById('domainListContainer');
  if (!container) return;
  container.innerHTML = '';

  if (ignoredDomains.length === 0) {
    container.innerHTML = `<p style="color:var(--text-sub);font-size:12px;">${currentLang === 'es' ? 'No hay dominios ignorados.' : 'No ignored domains.'}</p>`;
    return;
  }

  ignoredDomains.forEach(domain => {
    const div = document.createElement('div');
    div.className = 'domain-item';
    div.innerHTML = `
      <span class="domain-name">${escapeHtml(domain)}</span>
      <button class="btn btn-small btn-danger remove-domain" data-domain="${escapeHtml(domain)}">${t('removeDomain')}</button>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('.remove-domain').forEach(btn => {
    btn.addEventListener('click', () => {
      const domain  = btn.getAttribute('data-domain');
      const newList = ignoredDomains.filter(d => d !== domain);
      chrome.runtime.sendMessage({ action: "updateIgnoredDomains", domains: newList }, (res) => {
        if (res?.success) {
          ignoredDomains = newList;
          renderIgnoredDomainsList();
          renderRealInactivityTable();
          showToast(t('domainRemoved'));
        } else {
          showToast(t('errorSaving'), 'error');
        }
      });
    });
  });
}

// ─── History Chart ────────────────────────────────────────────────────────────
function filterHistoryByDays(history, days) {
  if (!history?.length) return [];
  const limit = new Date();
  limit.setDate(limit.getDate() - days);
  const limitStr = limit.toISOString().split('T')[0];
  return history.filter(e => e.date >= limitStr);
}

function updateRangeInfo() {
  const span = document.getElementById('rangeInfo');
  if (!span) return;
  const filtered = filterHistoryByDays(currentHistory, currentRange);
  const daysWord = currentLang === 'es' ? 'días' : 'days';
  span.textContent = `${filtered.length} ${daysWord}`;
}

async function drawHistoryChartWithRange() {
  const canvas = document.getElementById('historyCanvas');
  if (!canvas) return;
  const { isPro } = await chrome.storage.local.get('isPro');
  if (!isPro) return;

  const filtered       = filterHistoryByDays(currentHistory, currentRange);
  const containerWidth = (canvas.parentElement?.clientWidth ?? 600) - 40;
  canvas.width = Math.max(containerWidth, 200);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (filtered.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(currentLang === 'es' ? 'No hay datos en este rango.' : 'No data in this range.', canvas.width / 2, 80);
    return;
  }

  const maxCost  = Math.max(...filtered.map(d => d.cost), 1);
  const count    = filtered.length;
  const gap      = Math.max(4, Math.floor(16 - count * 0.3));
  const barWidth = Math.max(4, (canvas.width - 60 - gap * (count - 1)) / count);
  const startX   = 30;

  filtered.forEach((day, i) => {
    const barHeight = Math.max(2, (day.cost / maxCost) * 90);
    const x = startX + i * (barWidth + gap);
    const y = canvas.height - barHeight - 35;

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(x, y, barWidth, barHeight);

    if (barWidth > 20) {
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      const symbol = currentCurrency === 'EUR' ? '€' : '$';
      ctx.fillText(`${symbol}${day.cost.toFixed(1)}`, x + barWidth / 2, y - 5);
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(day.date.substring(5), x + barWidth / 2, canvas.height - 12);
  });
}

// ─── Tab Audit Table (con moneda dinámica) ─────────────────────────────────────
function renderRealInactivityTable() {
  const tbody = document.getElementById('realTabList');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">${t('loadingText')}</td></tr>`;

  chrome.runtime.sendMessage({ action: "getTabInactivityList" }, (list) => {
    if (chrome.runtime.lastError) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--danger);">Error connecting to service worker</td></tr>';
      return;
    }
    if (!list?.length) {
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">${t('noData')}</td></tr>`;
      return;
    }

    const symbol = currentCurrency === 'EUR' ? '€' : '$';
    tbody.innerHTML = '';
    list.slice(0, 15).forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(item.url)}">${escapeHtml(item.title)}</td>
        <td style="text-align:center;white-space:nowrap;">${Math.floor(item.minutes)} min</td>
        <td style="text-align:right;white-space:nowrap;color:var(--danger);">-${symbol}${item.cost.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });

    if (list.length > 15) {
      const extra = document.createElement('tr');
      extra.innerHTML = `<td colspan="3" style="text-align:center;color:var(--text-sub);font-size:12px;">… ${currentLang === 'es' ? 'y' : 'and'} ${list.length - 15} ${currentLang === 'es' ? 'más' : 'more'}</td>`;
      tbody.appendChild(extra);
    }
  });
}

// ─── Export inactive tabs to CSV (Pro only) ───────────────────────────────────
async function exportInactiveTabsToCSV() {
  try {
    const { isPro, hourlyRate, currency } = await chrome.storage.local.get(['isPro', 'hourlyRate', 'currency']);
    if (!isPro) {
      showToast(t('exportTabsError'), 'error');
      return;
    }

    const list = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "getInactiveTabsList" }, (response) => {
        resolve(response || []);
      });
    });

    if (!list.length) {
      showToast(t('exportTabsNoData'), 'error');
      return;
    }

    const symbol = currency === 'EUR' ? '€' : '$';
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 19).replace('T', ' ');
    const csvRows = [];
    // Metadata
    csvRows.push(`# Exported at: ${dateStr}`);
    csvRows.push(`# Hourly rate: ${symbol}${hourlyRate}/h`);
    csvRows.push(`# Currency: ${currency}`);
    csvRows.push(''); // empty line
    // Headers
    csvRows.push(['Title', 'URL', 'Inactive minutes', `Opportunity cost (${symbol})`].join(','));
    // Data rows
    for (const tab of list) {
      const title = `"${escapeCsvField(tab.title)}"`;
      const url = `"${escapeCsvField(tab.url)}"`;
      const minutes = tab.minutes.toFixed(1);
      const cost = tab.cost.toFixed(2);
      csvRows.push([title, url, minutes, cost].join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for UTF-8
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tabcost_inactive_tabs_${now.toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('exportTabsSuccess'));
  } catch (err) {
    console.error("Export error:", err);
    showToast(t('exportTabsError'), 'error');
  }
}

function escapeCsvField(field) {
  if (!field) return '';
  // Escape double quotes by doubling them
  return field.replace(/"/g, '""');
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

// ─── Storage Sync ─────────────────────────────────────────────────────────────
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.dailyHistory) {
    const historyLock = document.getElementById('historyLock');
    if (historyLock?.style.display === 'none') {
      chrome.storage.local.get('dailyHistory', res => {
        currentHistory = res.dailyHistory || [];
        drawHistoryChartWithRange();
        updateRangeInfo();
      });
    }
  }
  if (changes.ignoredDomains) {
    loadIgnoredDomains();
    renderRealInactivityTable();
  }
  if (changes.currency) {
    loadSettings(); // recargar moneda en la UI
  }
});

// ─── DOMContentLoaded ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadLanguage();
  applyTranslations();
  await loadSettings();
  await loadIgnoredDomains();
  setupAccordion();

  function startTableRefresh() {
    if (refreshInterval) return;
    refreshInterval = setInterval(renderRealInactivityTable, 15_000);
  }
  function stopTableRefresh() {
    if (refreshInterval) { clearInterval(refreshInterval); refreshInterval = null; }
  }
  startTableRefresh();
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopTableRefresh();
    else { renderRealInactivityTable(); startTableRefresh(); }
  });

  keepAliveInterval = setInterval(() => {
    chrome.runtime.sendMessage({ action: "forceRecalc" }, () => {});
  }, 30_000);

  // ── Language toggle ──
  document.getElementById('langToggle')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.lang-btn');
    if (!btn) return;
    const lang = btn.dataset.lang;
    if (lang && lang !== currentLang) await setLanguage(lang);
  });

  // ── Onboarding save ──
  document.getElementById('startOnboardingBtn')?.addEventListener('click', () => {
    const rate = parseFloat(document.getElementById('onboardingRateInput').value);
    if (rate > 0) {
      chrome.storage.local.set({ hourlyRate: rate }, () => {
        document.getElementById('onboardingSection').style.display = 'none';
        document.getElementById('rateInput').value = rate;
        renderRealInactivityTable();
      });
    } else showToast(t('invalidRate'), 'error');
  });

  // ── Save rate and currency ──
  document.getElementById('saveRateBtn')?.addEventListener('click', () => {
    const rate = parseFloat(document.getElementById('rateInput').value);
    const currency = document.getElementById('currencySelect').value;
    if (rate > 0) {
      chrome.storage.local.set({ hourlyRate: rate, currency: currency }, () => {
        showToast(t('rateUpdated'));
        renderRealInactivityTable();
      });
    } else showToast(t('invalidRate'), 'error');
  });
  document.getElementById('rateInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('saveRateBtn')?.click();
  });

  // ── Activate Pro license ──
  document.getElementById('activateProBtn')?.addEventListener('click', () => {
    const key = document.getElementById('proLicenseKey').value.trim();
    if (!key) return;
    const statusDiv = document.getElementById('licenseStatus');
    const btn = document.getElementById('activateProBtn');
    statusDiv.textContent = t('licenseVerifying');
    statusDiv.style.color = 'var(--text-sub)';
    btn.disabled = true;

    chrome.runtime.sendMessage({ action: "verifyLicense", key }, (response) => {
      btn.disabled = false;
      if (response?.success) {
        statusDiv.textContent = t('licenseValid');
        statusDiv.style.color = '#22c55e';
        setTimeout(() => location.reload(), 1500);
      } else {
        statusDiv.textContent = t('licenseInvalid');
        statusDiv.style.color = 'var(--danger)';
      }
    });
  });
  document.getElementById('proLicenseKey')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('activateProBtn')?.click();
  });

  // ── Buy Pro button (options) ──
  const buyProBtn = document.getElementById('buyProBtn');
  if (buyProBtn) {
    buyProBtn.addEventListener('click', () => {
      const currency = document.getElementById('currencySelect').value;
      window.open(`https://gumroad.com/l/tabcost-pro?currency=${currency}`, '_blank');
    });
  }

  // ── Scroll to license from overlay buttons ──
  document.querySelectorAll('#gotoLicenseBtn, #historyGotoLicenseBtn').forEach(btn => {
    btn?.addEventListener('click', () => {
      document.getElementById('licenseCard')?.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // ── Save Pro config ──
  document.getElementById('saveProConfigBtn')?.addEventListener('click', async () => {
    const { isPro } = await chrome.storage.local.get('isPro');
    if (!isPro) { showToast(t('unlockMsg'), 'error'); return; }

    const grace          = parseInt(document.getElementById('graceMinutes').value)           || 5;
    const impact         = parseInt(document.getElementById('impactPercent').value)          || 20;
    const autoClose      = parseInt(document.getElementById('autoCloseMinutes').value)       || 0;
    const notifThreshold = parseFloat(document.getElementById('notificationThreshold').value) || 2.5;
    const notifEnabled   = document.getElementById('notificationsEnabled').value === 'true';

    chrome.runtime.sendMessage({
      action: "updateProConfig",
      graceMinutes: grace, impactPercent: impact,
      autoCloseMinutes: autoClose, notificationThreshold: notifThreshold,
      notificationsEnabled: notifEnabled
    }, (res) => {
      if (res?.success) showToast(t('configSaved'));
      else showToast(t('errorSaving'), 'error');
    });
  });

  // ── Add ignored domain ──
  document.getElementById('addDomainBtn')?.addEventListener('click', async () => {
    const { isPro } = await chrome.storage.local.get('isPro');
    if (!isPro) { showToast(t('unlockMsg'), 'error'); return; }

    const input = document.getElementById('newDomainInput');
    let domain  = input.value.trim().toLowerCase()
                    .replace(/^https?:\/\//i, '').replace(/^www\./, '').split('/')[0];

    if (!domain || domain.includes(' ') || !domain.includes('.')) {
      showToast(t('invalidDomain'), 'error'); return;
    }
    if (ignoredDomains.includes(domain)) {
      showToast(t('domainExists'), 'error'); return;
    }

    const newList = [...ignoredDomains, domain];
    chrome.runtime.sendMessage({ action: "updateIgnoredDomains", domains: newList }, (res) => {
      if (res?.success) {
        ignoredDomains = newList;
        renderIgnoredDomainsList();
        input.value = '';
        renderRealInactivityTable();
        showToast(t('domainAdded'));
      } else showToast(t('errorSaving'), 'error');
    });
  });
  document.getElementById('newDomainInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('addDomainBtn')?.click();
  });

  // ── History range ──
  document.getElementById('applyRangeBtn')?.addEventListener('click', () => {
    const val = parseInt(document.getElementById('rangeDays').value);
    if (!isNaN(val) && val > 0) {
      currentRange = val;
      drawHistoryChartWithRange();
      updateRangeInfo();
    }
  });

  // ── Export CSV (history) ──
  document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
    const filtered = filterHistoryByDays(currentHistory, currentRange);
    if (!filtered.length) { showToast(t('noHistory'), 'error'); return; }

    const symbol   = currentCurrency === 'EUR' ? '€' : '$';
    const colLabel = `Cost (${currentCurrency})`;
    let csv = `Date,${colLabel}\n`;
    filtered.forEach(e => { csv += `${e.date},${e.cost.toFixed(2)}\n`; });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `tabcost_history_${currentCurrency}_${currentRange}d_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ── Export inactive tabs (new) ──
  const exportTabsBtn = document.getElementById('exportTabsBtn');
  if (exportTabsBtn) {
    exportTabsBtn.addEventListener('click', exportInactiveTabsToCSV);
  }

  // ── Refresh table ──
  document.getElementById('refreshTableBtn')?.addEventListener('click', renderRealInactivityTable);

  // Enlace a la documentación (docs.html)
  const docsLink = document.getElementById('docsLink');
  if (docsLink) {
    docsLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL('docs.html') });
    });
  }
});

// ─── Cleanup ──────────────────────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (refreshInterval)   clearInterval(refreshInterval);
  if (keepAliveInterval) clearInterval(keepAliveInterval);
});