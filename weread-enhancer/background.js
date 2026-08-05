importScripts("settings.js");

const GENERAL_MATCHES = ["*://weread.qq.com/*"];
const READER_MATCHES = ["*://weread.qq.com/web/reader/*"];

const STYLE_SCRIPTS = {
  "hide-recommendations": {
    id: "hide-recommendations",
    matches: GENERAL_MATCHES,
    css: ["rules/hide-recommendations.css"],
  },
  "hide-account-details": {
    id: "hide-account-details",
    matches: GENERAL_MATCHES,
    css: ["rules/hide-account-details.css"],
  },
  "hide-navbar-links": {
    id: "hide-navbar-links",
    matches: GENERAL_MATCHES,
    css: ["rules/hide-navbar-links.css"],
  },
  "text-align-start": {
    id: "reader-text-align-start",
    matches: READER_MATCHES,
    css: ["rules/text-align-start.css"],
  },
  "change-background-color": {
    id: "reader-change-background-color",
    matches: READER_MATCHES,
    css: ["rules/change-background-color.css"],
  },
  "simplify-floating-buttons": {
    id: "reader-simplify-floating-buttons",
    matches: READER_MATCHES,
    css: ["rules/simplify-floating-buttons.css"],
  },
  "font-songti": {
    id: "reader-font-songti",
    matches: READER_MATCHES,
    css: ["rules/font-songti.css"],
  },
  "font-kaiti": {
    id: "reader-font-kaiti",
    matches: READER_MATCHES,
    css: ["rules/font-kaiti.css"],
  },
  "font-heiti": {
    id: "reader-font-heiti",
    matches: READER_MATCHES,
    css: ["rules/font-heiti.css"],
  },
  "font-latin": {
    id: "reader-font-latin",
    matches: READER_MATCHES,
    css: ["rules/font-latin.css"],
  },
};

const TOGGLED_SCRIPT_KEYS = [
  "hide-recommendations",
  "hide-account-details",
  "hide-navbar-links",
  "text-align-start",
  "change-background-color",
  "simplify-floating-buttons",
  "font-latin",
];

const MANAGED_SCRIPT_IDS = Object.values(STYLE_SCRIPTS).map((script) => script.id);

let styleSync = Promise.resolve();

function getDesiredScripts(settings) {
  const scripts = TOGGLED_SCRIPT_KEYS.filter((key) => settings[key]).map((key) => STYLE_SCRIPTS[key]);

  // "font-default" and "font-custom" have no packaged stylesheet, so they fall through.
  const fontScript = STYLE_SCRIPTS[settings["font-family"]];
  if (fontScript) {
    scripts.push(fontScript);
  }

  return scripts.map((script) => ({ ...script, runAt: "document_start" }));
}

async function applyStyleRegistrations(settings, { force = false } = {}) {
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: MANAGED_SCRIPT_IDS });
  const registeredIds = new Set(registered.map((script) => script.id));
  const desired = getDesiredScripts(settings);
  const desiredIds = new Set(desired.map((script) => script.id));

  // Only touch scripts whose presence changed; definitions are static, so
  // already-registered ids need no update. `force` re-registers everything to
  // flush definitions left behind by a previous extension version.
  const toUnregister = force ? [...registeredIds] : [...registeredIds].filter((id) => !desiredIds.has(id));
  const toRegister = force ? desired : desired.filter((script) => !registeredIds.has(script.id));

  if (toUnregister.length > 0) {
    await chrome.scripting.unregisterContentScripts({ ids: toUnregister });
  }
  if (toRegister.length > 0) {
    await chrome.scripting.registerContentScripts(toRegister);
  }
}

function queueStyleSync(getSettings, options) {
  styleSync = styleSync
    .catch(() => {})
    .then(async () => {
      const settings = await getSettings();
      await applyStyleRegistrations(settings, options);
    });

  return styleSync;
}

function syncStyles(options) {
  return queueStyleSync(() => chrome.storage.sync.get(DEFAULT_SETTINGS), options);
}

async function initializeDefaults() {
  const stored = await chrome.storage.sync.get([...STYLE_SETTING_KEYS, "customize-font"]);
  const updates = {};

  // Until v1.0 a separate "customize-font" toggle gated the font selection; an
  // unchecked toggle now maps to the "Default" font option.
  if (typeof stored["customize-font"] !== "undefined") {
    if (stored["customize-font"] === false) {
      updates["font-family"] = "font-default";
    }
    await chrome.storage.sync.remove("customize-font");
  }

  for (const key of STYLE_SETTING_KEYS) {
    if (typeof stored[key] === "undefined") {
      updates[key] = DEFAULT_SETTINGS[key];
    }
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.sync.set(updates);
  }
}

async function reloadWereadTab(scope, tabId) {
  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    return; // Tab was closed in the meantime.
  }

  const url = tab?.url || "";
  if (!url.includes("weread.qq.com")) {
    return;
  }

  // "general" styles affect every WeRead page; "reader" styles only matter on reader pages.
  if (scope === "general" || url.includes("/web/reader/")) {
    await chrome.tabs.reload(tabId);
  }
}

// Collapse bursts of popup changes into a single sync + reload. The popup sends
// the tab id it was opened on, so a tab switch during the debounce cannot
// redirect the reload.
let pendingReloadScope = null;
let pendingReloadTabId = null;
let applyTimer = null;

function scheduleApply(scope, tabId) {
  if (scope === "general" || (scope === "reader" && pendingReloadScope === null)) {
    pendingReloadScope = scope;
  }
  if (typeof tabId === "number") {
    pendingReloadTabId = tabId;
  }

  clearTimeout(applyTimer);
  applyTimer = setTimeout(async () => {
    const reloadScope = pendingReloadScope;
    const reloadTabId = pendingReloadTabId;
    pendingReloadScope = null;
    pendingReloadTabId = null;

    try {
      await syncStyles();
      if (reloadScope && reloadTabId !== null) {
        await reloadWereadTab(reloadScope, reloadTabId);
      }
    } catch (error) {
      console.error("Failed to apply style changes.", error);
    }
  }, 300);
}

chrome.runtime.onInstalled.addListener(() => {
  void initializeDefaults().then(() => syncStyles({ force: true }));
});

chrome.runtime.onStartup.addListener(() => {
  void syncStyles();
});

// Covers writes that bypass the popup message, e.g. settings synced from another device.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  if (STYLE_SETTING_KEYS.some((key) => Object.prototype.hasOwnProperty.call(changes, key))) {
    void syncStyles();
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action !== "apply_settings") {
    return false;
  }

  scheduleApply(request.scope ?? null, request.tabId);
  sendResponse({ ok: true });
  return false;
});
