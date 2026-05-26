// ─── Config & State ────────────────────────────────────────────────────────
const DEBUG = false;  // Set to true for verbose logging

let tabLastInteraction = {};
let lastCalculationTimestamp = null;

let config = {
  hourlyRate: 0,
  isPro: false,
  graceMinutes: 5,
  impactPercent: 20,
  autoCloseMinutes: 0,
  notificationThreshold: 2.50,
  notificationsEnabled: true,
  language: 'es',
  ignoredDomains: [],
  currency: 'USD'      // 'USD' o 'EUR'
};

// ─── License Security ───────────────────────────────────────────────────────
const _LS = "TC_fp_v1_prod";

function computeLicenseFingerprint(key) {
  let h = 5381;
  const s = key + _LS;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(36);
}

async function verifyStoredLicense() {
  const data = await chrome.storage.local.get(['isPro', 'licenseKey', 'licenseFingerprint']);
  if (!data.isPro) return;

  if (!data.licenseKey || !data.licenseFingerprint) {
    if (DEBUG) console.warn("TabCost: isPro set without credentials, revoking.");
    await chrome.storage.local.set({ isPro: false });
    config.isPro = false;
    return;
  }

  const expected = computeLicenseFingerprint(data.licenseKey);
  if (expected !== data.licenseFingerprint) {
    if (DEBUG) console.warn("TabCost: License fingerprint mismatch, revoking Pro status.");
    await chrome.storage.local.set({ isPro: false, licenseKey: null, licenseFingerprint: null });
    config.isPro = false;
  }
}

// ─── Config Loading ─────────────────────────────────────────────────────────
async function loadConfig() {
  const stored = await chrome.storage.local.get([
    'hourlyRate', 'isPro', 'graceMinutes', 'impactPercent',
    'autoCloseMinutes', 'notificationThreshold', 'notificationsEnabled',
    'language', 'ignoredDomains', 'currency'
  ]);
  if (stored.hourlyRate   !== undefined) config.hourlyRate   = stored.hourlyRate;
  if (stored.isPro        !== undefined) config.isPro        = stored.isPro;
  if (stored.graceMinutes !== undefined) config.graceMinutes = stored.graceMinutes;
  if (stored.impactPercent!== undefined) config.impactPercent= stored.impactPercent;
  if (stored.autoCloseMinutes !== undefined) config.autoCloseMinutes = stored.autoCloseMinutes;
  if (stored.notificationThreshold !== undefined) config.notificationThreshold = stored.notificationThreshold;
  if (stored.notificationsEnabled  !== undefined) config.notificationsEnabled  = stored.notificationsEnabled;
  if (stored.language      !== undefined) config.language      = stored.language;
  if (stored.ignoredDomains!== undefined) config.ignoredDomains= stored.ignoredDomains;
  if (stored.currency      !== undefined) config.currency      = stored.currency;

  const defaults = {
    graceMinutes: 5, impactPercent: 20, autoCloseMinutes: 0,
    notificationThreshold: 2.50, notificationsEnabled: true,
    language: 'es', ignoredDomains: [], currency: 'USD'
  };
  for (const [key, val] of Object.entries(defaults)) {
    if (stored[key] === undefined) await chrome.storage.local.set({ [key]: val });
  }
}

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'local') return;
  const relevant = ['hourlyRate','isPro','graceMinutes','impactPercent',
                    'autoCloseMinutes','notificationThreshold','notificationsEnabled',
                    'language','ignoredDomains','currency'];
  if (relevant.some(k => changes[k])) {
    await loadConfig();
    await calculateOpportunityCost();
    if (DEBUG) console.log("TabCost: Config reloaded");
  }
});

// ─── Alarms ───────────────────────────────────────────────────────────────────
async function ensureAlarms() {
  const alarms = await chrome.alarms.getAll();
  const names = alarms.map(a => a.name);
  if (!names.includes("minuteTicker")) {
    await chrome.alarms.create("minuteTicker", { periodInMinutes: 1 });
    if (DEBUG) console.log("TabCost: Recreated minuteTicker");
  }
  if (!names.includes("heartbeat")) {
    await chrome.alarms.create("heartbeat", { periodInMinutes: 5 });
    if (DEBUG) console.log("TabCost: Recreated heartbeat");
  }
  if (config.autoCloseMinutes > 0 && !names.includes("autoCloseTicker")) {
    await chrome.alarms.create("autoCloseTicker", { periodInMinutes: config.autoCloseMinutes });
    if (DEBUG) console.log("TabCost: Recreated autoCloseTicker");
  }
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {
  await loadConfig();
  await verifyStoredLicense();

  const data = await chrome.storage.local.get(['dailyCost','dailyHistory','lastSavedDate','notifiedToday','lastCalculationTimestamp']);
  const todayStr = new Date().toISOString().split('T')[0];

  if (data.dailyCost               === undefined) await chrome.storage.local.set({ dailyCost: 0 });
  if (data.dailyHistory            === undefined) await chrome.storage.local.set({ dailyHistory: [] });
  if (data.notifiedToday           === undefined) await chrome.storage.local.set({ notifiedToday: false });
  if (data.lastSavedDate           === undefined) await chrome.storage.local.set({ lastSavedDate: todayStr });
  if (data.lastCalculationTimestamp === undefined) {
    lastCalculationTimestamp = Date.now();
    await chrome.storage.local.set({ lastCalculationTimestamp });
  } else {
    lastCalculationTimestamp = data.lastCalculationTimestamp;
  }

  await restoreTabInteractions();
  await ensureAlarms();

  if (details.reason === "install") chrome.runtime.openOptionsPage();
  if (DEBUG) console.log("TabCost: Service worker started");
});

chrome.runtime.onStartup.addListener(async () => {
  await loadConfig();
  await verifyStoredLicense();
  await restoreTabInteractions();
  const stored = await chrome.storage.local.get('lastCalculationTimestamp');
  if (stored.lastCalculationTimestamp) lastCalculationTimestamp = stored.lastCalculationTimestamp;
  await ensureAlarms();
  await calculateOpportunityCost();
  if (DEBUG) console.log("TabCost: Service worker awakened");
});

// ─── Tab Tracking ─────────────────────────────────────────────────────────────
async function restoreTabInteractions() {
  const stored = await chrome.storage.local.get(['tabLastInteraction']);
  tabLastInteraction = stored.tabLastInteraction || {};
  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  let changed = false;
  for (const tab of tabs) {
    if (!tabLastInteraction[tab.id]) {
      tabLastInteraction[tab.id] = now;
      changed = true;
    }
  }
  if (changed) await saveTabInteractions();
}

async function saveTabInteractions() {
  await chrome.storage.local.set({ tabLastInteraction });
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  tabLastInteraction[activeInfo.tabId] = Date.now();
  await saveTabInteractions();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    tabLastInteraction[tabId] = Date.now();
    await saveTabInteractions();
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  delete tabLastInteraction[tabId];
  await saveTabInteractions();
});

// ─── Alarms Handler ───────────────────────────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "minuteTicker") {
    await checkMidnightRotation();
    await calculateOpportunityCost();
    if (config.autoCloseMinutes > 0) {
      await closeTabsOlderThan(config.autoCloseMinutes);
    }
  }
  if (alarm.name === "autoCloseTicker" && config.autoCloseMinutes > 0) {
    await closeTabsOlderThan(config.autoCloseMinutes);
  }
  if (alarm.name === "heartbeat") {
    await ensureAlarms();
    const now = Date.now();
    if (lastCalculationTimestamp && (now - lastCalculationTimestamp) > 120_000) {
      if (DEBUG) console.log("TabCost: Heartbeat triggering recalc");
      await calculateOpportunityCost();
    }
  }
});

// ─── Midnight Rotation ────────────────────────────────────────────────────────
async function checkMidnightRotation() {
  const data = await chrome.storage.local.get(['lastSavedDate','dailyCost','dailyHistory']);
  const todayStr = new Date().toISOString().split('T')[0];
  if (data.lastSavedDate === todayStr) return;

  const history = data.dailyHistory || [];
  history.push({ date: data.lastSavedDate, cost: data.dailyCost || 0 });
  const maxHistory = config.isPro ? 365 : 90;
  if (history.length > maxHistory) history.shift();

  await chrome.storage.local.set({
    dailyHistory: history, dailyCost: 0,
    lastSavedDate: todayStr, notifiedToday: false
  });
  if (DEBUG) console.log("TabCost: Day rotation completed");
}

// ─── Cost Calculation ───────────────────────────────────────────────────────
function getDomainFromUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return null; }
}

function isTabIgnored(tab) {
  if (!config.isPro || !config.ignoredDomains?.length || !tab.url) return false;
  const domain = getDomainFromUrl(tab.url);
  if (!domain) return false;
  return config.ignoredDomains.some(d => domain === d || domain.endsWith(`.${d}`));
}

async function calculateOpportunityCost() {
  const now = Date.now();
  let elapsedMinutes = 1;

  if (lastCalculationTimestamp) {
    const elapsed = (now - lastCalculationTimestamp) / 1000 / 60;
    if (elapsed < 0.5) return;
    elapsedMinutes = Math.min(elapsed, 15);
  } else {
    lastCalculationTimestamp = now;
    await chrome.storage.local.set({ lastCalculationTimestamp });
    return;
  }

  lastCalculationTimestamp = now;
  await chrome.storage.local.set({ lastCalculationTimestamp });

  const rate = config.hourlyRate || 0;
  if (rate === 0) return;

  let accumulatedCost = (await chrome.storage.local.get('dailyCost')).dailyCost || 0;
  const previousCost = accumulatedCost;

  const tabs = await chrome.tabs.query({});
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTabId = activeTab?.id ?? null;

  const grace  = Math.max(1, config.graceMinutes);
  const impact = Math.min(50, Math.max(10, config.impactPercent)) / 100;
  let addedCost = 0;

  for (const tab of tabs) {
    if (isTabIgnored(tab)) continue;
    if (tab.id === activeTabId) {
      tabLastInteraction[tab.id] = now;
      continue;
    }
    const lastTime = tabLastInteraction[tab.id] || now;
    const inactiveMinutes = (now - lastTime) / 1000 / 60;
    if (inactiveMinutes > grace) {
      const costPerMinute = (rate / 60) * impact;
      const delta = costPerMinute * elapsedMinutes;
      accumulatedCost += delta;
      addedCost += delta;
    }
  }

  if (DEBUG && addedCost > 0) {
    console.log(`TabCost: +${getCurrencySymbol()}${addedCost.toFixed(4)} (${elapsedMinutes.toFixed(2)} min), total ${getCurrencySymbol()}${accumulatedCost.toFixed(2)}`);
  }

  await chrome.storage.local.set({ dailyCost: accumulatedCost });
  await saveTabInteractions();

  if (config.notificationsEnabled) {
    const { notifiedToday } = await chrome.storage.local.get('notifiedToday');
    if (!notifiedToday && accumulatedCost > config.notificationThreshold && previousCost <= config.notificationThreshold) {
      await chrome.storage.local.set({ notifiedToday: true });
      await showNotification(accumulatedCost);
    }
  }
}

// Helper para obtener el símbolo de moneda
function getCurrencySymbol() {
  return config.currency === 'EUR' ? '€' : '$';
}

// ─── Notifications ──────────────────────────────────────────────────────────
async function showNotification(cost) {
  const isEn = config.language === 'en';
  const symbol = getCurrencySymbol();
  const title = isEn ? "TabCost — Focus Alert" : "TabCost — Alerta de foco";
  const message = isEn
    ? `You have lost ${symbol}${cost.toFixed(2)} today due to inactive tabs.`
    : `Has perdido ${symbol}${cost.toFixed(2)} hoy por pestañas inactivas.`;

  try {
    await chrome.notifications.create("tabcost_alert", {
      type: "basic",
      iconUrl: "icon48.png",
      title,
      message,
      priority: 1
    });
  } catch (e) {
    if (DEBUG) console.warn("TabCost: Notification failed:", e);
  }
}

// ─── Gumroad License Verification con clave de prueba ───────────────────────
const GUMROAD_PRODUCT_ID = "mW7Pxt5wuIX29vrTTOotkw==";

async function verifyGumroadLicense(licenseKey, retry = true) {
  try {
    const response = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `product_id=${GUMROAD_PRODUCT_ID}&license_key=${encodeURIComponent(licenseKey)}`
    });
    const result = await response.json();
    return result.success === true && !result.uses_per_license_exceeded;
  } catch (error) {
    if (DEBUG) console.error("TabCost: Gumroad verification error:", error);
    if (retry) {
      await new Promise(r => setTimeout(r, 1000));
      return verifyGumroadLicense(licenseKey, false);
    }
    return false;
  }
}

// ─── Tab Utilities ──────────────────────────────────────────────────────────
async function getSortedInactiveTabs() {
  const rate   = config.hourlyRate || 0;
  const now    = Date.now();
  const grace  = Math.max(1, config.graceMinutes);
  const impact = Math.min(50, Math.max(10, config.impactPercent)) / 100;

  const tabs = await chrome.tabs.query({});
  const list = [];
  for (const tab of tabs) {
    if (isTabIgnored(tab)) continue;
    const lastTime       = tabLastInteraction[tab.id] || now;
    const inactiveMinutes = (now - lastTime) / 1000 / 60;
    if (inactiveMinutes > grace) {
      const lostCost = (inactiveMinutes - grace) * ((rate / 60) * impact);
      list.push({
        id: tab.id,
        title: tab.title || tab.url || (config.language === 'en' ? "Untitled tab" : "Pestaña sin título"),
        url: tab.url,
        minutes: inactiveMinutes,
        cost: lostCost,
        isIgnored: false
      });
    }
  }
  return list.sort((a, b) => b.cost - a.cost);
}

async function closeTabsOlderThan(minutes, manual = false) {
  const list = await getSortedInactiveTabs();
  let closed = 0;
  for (const t of list) {
    if (t.minutes >= minutes) {
      await chrome.tabs.remove(t.id).catch(e => { if (DEBUG) console.warn("TabCost: Failed to close tab:", e); });
      closed++;
    }
  }
  if (DEBUG && closed > 0) console.log(`TabCost: ${manual ? 'Manual' : 'Auto'}-closed ${closed} tabs`);
  return closed;
}

async function exportHistoryToCSV() {
  const { dailyHistory } = await chrome.storage.local.get('dailyHistory');
  const colLabel = `Cost (${config.currency || 'USD'})`;
  if (!dailyHistory?.length) return `Date,${colLabel}\n`;
  let csv = `Date,${colLabel}\n`;
  for (const entry of dailyHistory) csv += `${entry.date},${entry.cost.toFixed(2)}\n`;
  return csv;
}

// ─── [NEW] Reset daily cost to zero (only for Pro users) ────────────────────
async function resetDailyCost() {
  if (!config.isPro) {
    if (DEBUG) console.warn("TabCost: Reset attempted without Pro license");
    return false;
  }
  await chrome.storage.local.set({ dailyCost: 0, notifiedToday: false });
  if (DEBUG) console.log("TabCost: Daily cost reset to 0 by Pro user");
  return true;
}

// ─── Message Handler ──────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {

    case "getCostData":
      chrome.storage.local.get(['dailyCost','hourlyRate','isPro','currency'], res => sendResponse(res));
      return true;

    case "getTabInactivityList":
      getSortedInactiveTabs().then(list => sendResponse(list));
      return true;

    // [NEW] Devuelve la lista completa sin límite para exportación CSV (Pro)
    case "getInactiveTabsList":
      getSortedInactiveTabs().then(list => sendResponse(list));
      return true;

    case "closeRedTabs":
      closeTabsOlderThan(config.graceMinutes, true).then(count => sendResponse({ closed: count }));
      return true;

    case "verifyLicense":
      (async () => {
        const isValid = await verifyGumroadLicense(message.key);
        if (isValid) {
          const fingerprint = computeLicenseFingerprint(message.key);
          await chrome.storage.local.set({
            isPro: true,
            licenseKey: message.key,
            licenseFingerprint: fingerprint
          });
          await loadConfig();
          sendResponse({ success: true });
        } else {
          sendResponse({ success: false });
        }
      })();
      return true;

    case "forceRecalc":
      calculateOpportunityCost().then(() => sendResponse({ success: true }));
      return true;

    case "updateProConfig":
      chrome.storage.local.set({
        graceMinutes: message.graceMinutes,
        impactPercent: message.impactPercent,
        autoCloseMinutes: message.autoCloseMinutes,
        notificationThreshold: message.notificationThreshold,
        notificationsEnabled: message.notificationsEnabled
      }, async () => {
        await loadConfig();
        await chrome.alarms.clear("autoCloseTicker");
        if (config.autoCloseMinutes > 0) {
          chrome.alarms.create("autoCloseTicker", { periodInMinutes: config.autoCloseMinutes });
        }
        sendResponse({ success: true });
      });
      return true;

    case "exportHistory":
      exportHistoryToCSV().then(csv => sendResponse({ csv }));
      return true;

    case "setLanguage":
      chrome.storage.local.set({ language: message.language }, async () => {
        await loadConfig();
        sendResponse({ success: true });
      });
      return true;

    case "updateIgnoredDomains":
      chrome.storage.local.set({ ignoredDomains: message.domains }, async () => {
        await loadConfig();
        sendResponse({ success: true });
      });
      return true;

    case "setCurrency":
      chrome.storage.local.set({ currency: message.currency }, async () => {
        await loadConfig();
        sendResponse({ success: true });
      });
      return true;

    // [NEW] Reset daily cost (Pro only)
    case "resetDailyCost":
      resetDailyCost().then(success => sendResponse({ success }));
      return true;
  }
});