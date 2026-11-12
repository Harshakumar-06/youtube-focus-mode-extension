// Keys managed by this page
const SETTING_KEYS = ['hideSidebar', 'hideShorts', 'hideComments'];

// Defaults: everything hidden when study mode turns on
const DEFAULTS = {
  hideSidebar:   true,
  hideShorts:    true,
  hideComments:  false,
  breakInterval: 40,   // minutes; 0 = disabled
};

let _toastTimer = null;

// ── Boot: load saved prefs and reflect them in the UI ──────────────────────
chrome.storage.local.get([...SETTING_KEYS, 'breakInterval'], (stored) => {
  // Checkboxes
  SETTING_KEYS.forEach((key) => {
    const el = document.getElementById(key);
    if (!el) return;
    el.checked = (key in stored) ? stored[key] : DEFAULTS[key];
  });

  // Dropdown
  const sel = document.getElementById('breakInterval');
  if (sel) {
    const saved = (stored.breakInterval !== undefined) ? stored.breakInterval : DEFAULTS.breakInterval;
    sel.value = String(saved);
  }
});

// ── Auto-save on every toggle change ──────────────────────────────────────
SETTING_KEYS.forEach((key) => {
  const el = document.getElementById(key);
  if (!el) return;

  el.addEventListener('change', () => {
    chrome.storage.local.set({ [key]: el.checked }, showToast);
  });
});

// ── Auto-save on dropdown change ───────────────────────────────────────────
const breakSel = document.getElementById('breakInterval');
if (breakSel) {
  breakSel.addEventListener('change', () => {
    chrome.storage.local.set({ breakInterval: parseInt(breakSel.value, 10) }, showToast);
  });
}

// ── Toast notification ─────────────────────────────────────────────────────
function showToast() {
  const toast = document.getElementById('status-toast');
  toast.classList.add('visible');

  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
    _toastTimer = null;
  }, 1800);
}
