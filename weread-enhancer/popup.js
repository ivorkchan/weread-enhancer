const GENERAL_KEYS = new Set(["hide-recommendations", "hide-account-details", "hide-navbar-links"]);
const READER_KEYS = new Set([
  "text-align-start",
  "change-background-color",
  "simplify-floating-buttons",
  "font-latin",
]);

const controls = {};
for (const key of STYLE_SETTING_KEYS) {
  controls[key] = document.getElementById(key);
}

// The active tab cannot change while the popup is open, so capture it once and
// send its id along; resolving the active tab later in the background would
// race against the user switching tabs during the debounce.
let activeTabId = null;

const PACKAGED_FONTS = new Set(["font-songti", "font-kaiti", "font-heiti"]);
let lastFontFamily = null;

function updateFontControls() {
  document.getElementById("custom-font-row").hidden = controls["font-family"].value !== "font-custom";
}

// Returns which pages need a reload for this change, or null when the change
// applies live (the custom font is injected by reader-content.js, which
// watches storage).
function scopeForChange(key) {
  if (GENERAL_KEYS.has(key)) {
    return "general";
  }
  if (READER_KEYS.has(key)) {
    return "reader";
  }
  if (key === "font-family") {
    // Only packaged fonts are applied via registered CSS; switching between
    // Default and Custom is handled live by reader-content.js.
    return PACKAGED_FONTS.has(lastFontFamily) || PACKAGED_FONTS.has(controls["font-family"].value) ? "reader" : null;
  }
  return null;
}

async function saveSetting(key, value) {
  await chrome.storage.sync.set({ [key]: value });
  updateFontControls();

  const scope = scopeForChange(key);
  if (key === "font-family") {
    lastFontFamily = value;
  }
  if (scope) {
    // The background collapses bursts of changes and reloads after syncing, so
    // nothing is lost if the popup closes right away.
    chrome.runtime.sendMessage({ action: "apply_settings", scope, tabId: activeTabId }).catch(() => {});
  }
}

let fontNameTimer = null;

function bindControls() {
  for (const key of STYLE_SETTING_KEYS) {
    const control = controls[key];

    if (key === "custom-font-name") {
      // Debounced live preview while typing; "change" (Enter/blur) flushes
      // immediately so the value is not lost if the popup closes mid-debounce.
      const commit = () => {
        clearTimeout(fontNameTimer);
        void saveSetting(key, control.value);
      };
      control.addEventListener("input", () => {
        clearTimeout(fontNameTimer);
        fontNameTimer = setTimeout(commit, 300);
      });
      control.addEventListener("change", commit);
      continue;
    }

    control.addEventListener("change", () => {
      const value = control.type === "checkbox" ? control.checked : control.value;
      void saveSetting(key, value);
    });
  }
}

async function init() {
  document.getElementById("version").textContent = `v${chrome.runtime.getManifest().version}`;

  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    activeTabId = tab?.id ?? null;
  });

  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  for (const key of STYLE_SETTING_KEYS) {
    const control = controls[key];
    if (control.type === "checkbox") {
      control.checked = Boolean(settings[key]);
    } else {
      control.value = settings[key];
    }
  }
  lastFontFamily = settings["font-family"];

  updateFontControls();
  bindControls();
}

void init();
