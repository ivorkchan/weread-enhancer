const STYLE_SETTING_KEYS = [
  "hide-recommendations",
  "hide-account-details",
  "hide-navbar-links",
  "text-align-start",
  "customize-font",
  "font-family",
  "custom-font-name",
  "change-background-color",
  "simplify-floating-buttons",
];

const DEFAULT_SETTINGS = {
  "hide-recommendations": true,
  "hide-account-details": true,
  "hide-navbar-links": true,
  "text-align-start": true,
  "customize-font": true,
  "font-family": "font-songti",
  "custom-font-name": "",
  "change-background-color": true,
  "simplify-floating-buttons": true,
};

const registeredStyleScripts = {
  "hide-recommendations": {
    id: "hide-recommendations",
    matches: ["*://weread.qq.com/*"],
    css: ["rules/hide-recommendations.css"],
    runAt: "document_start",
  },
  "hide-account-details": {
    id: "hide-account-details",
    matches: ["*://weread.qq.com/*"],
    css: ["rules/hide-account-details.css"],
    runAt: "document_start",
  },
  "hide-navbar-links": {
    id: "hide-navbar-links",
    matches: ["*://weread.qq.com/*"],
    css: ["rules/hide-navbar-links.css"],
    runAt: "document_start",
  },
  "text-align-start": {
    id: "reader-text-align-start",
    matches: ["*://weread.qq.com/web/reader/*"],
    css: ["rules/text-align-start.css"],
    runAt: "document_start",
  },
  "change-background-color": {
    id: "reader-change-background-color",
    matches: ["*://weread.qq.com/web/reader/*"],
    css: ["rules/change-background-color.css"],
    runAt: "document_start",
  },
  "simplify-floating-buttons": {
    id: "reader-simplify-floating-buttons",
    matches: ["*://weread.qq.com/web/reader/*"],
    css: ["rules/simplify-floating-buttons.css"],
    runAt: "document_start",
  },
  "font-songti": {
    id: "reader-font-songti",
    matches: ["*://weread.qq.com/web/reader/*"],
    css: ["rules/font-songti.css"],
    runAt: "document_start",
  },
  "font-kaiti": {
    id: "reader-font-kaiti",
    matches: ["*://weread.qq.com/web/reader/*"],
    css: ["rules/font-kaiti.css"],
    runAt: "document_start",
  },
  "font-heiti": {
    id: "reader-font-heiti",
    matches: ["*://weread.qq.com/web/reader/*"],
    css: ["rules/font-heiti.css"],
    runAt: "document_start",
  },
};

const managedStyleScriptIds = Object.values(registeredStyleScripts).map((script) => script.id);

let styleSync = Promise.resolve();

function getDesiredScripts(settings) {
  const scripts = [];

  if (settings["hide-recommendations"]) {
    scripts.push(registeredStyleScripts["hide-recommendations"]);
  }
  if (settings["hide-account-details"]) {
    scripts.push(registeredStyleScripts["hide-account-details"]);
  }
  if (settings["hide-navbar-links"]) {
    scripts.push(registeredStyleScripts["hide-navbar-links"]);
  }
  if (settings["text-align-start"]) {
    scripts.push(registeredStyleScripts["text-align-start"]);
  }
  if (settings["change-background-color"]) {
    scripts.push(registeredStyleScripts["change-background-color"]);
  }
  if (settings["simplify-floating-buttons"]) {
    scripts.push(registeredStyleScripts["simplify-floating-buttons"]);
  }
  if (settings["customize-font"] && settings["font-family"] && settings["font-family"] !== "font-custom") {
    const fontScript = registeredStyleScripts[settings["font-family"]];
    if (fontScript) {
      scripts.push(fontScript);
    }
  }

  return scripts;
}

async function applyStyleRegistrations(settings) {
  const existingScripts = await chrome.scripting.getRegisteredContentScripts({
    ids: managedStyleScriptIds,
  });

  if (existingScripts.length > 0) {
    await chrome.scripting.unregisterContentScripts({
      ids: existingScripts.map((script) => script.id),
    });
  }

  const desiredScripts = getDesiredScripts(settings);
  if (desiredScripts.length > 0) {
    await chrome.scripting.registerContentScripts(desiredScripts);
  }
}

function queueStyleSync(settingsPromise) {
  styleSync = styleSync
    .catch(() => {})
    .then(async () => {
      const settings = await settingsPromise;
      await applyStyleRegistrations(settings);
    });

  return styleSync;
}

async function syncStyles() {
  return queueStyleSync(chrome.storage.sync.get(STYLE_SETTING_KEYS));
}

async function initializeDefaults() {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
  const defaults = {};

  Object.keys(DEFAULT_SETTINGS).forEach((key) => {
    if (typeof stored[key] === "undefined") {
      defaults[key] = DEFAULT_SETTINGS[key];
    }
  });

  if (Object.keys(defaults).length > 0) {
    await chrome.storage.sync.set(defaults);
    return { ...stored, ...defaults };
  }

  return stored;
}

chrome.runtime.onInstalled.addListener(() => {
  void initializeDefaults().then((settings) => queueStyleSync(Promise.resolve(settings)));
});

chrome.runtime.onStartup.addListener(() => {
  void syncStyles();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  const hasRelevantChange = STYLE_SETTING_KEYS.some((key) => Object.prototype.hasOwnProperty.call(changes, key));

  if (hasRelevantChange) {
    void syncStyles();
  }
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action !== "sync_styles") {
    return false;
  }

  syncStyles()
    .then(() => sendResponse({ ok: true }))
    .catch((error) => {
      console.error("Failed to sync styles.", error);
      sendResponse({ ok: false, error: error.message });
    });

  return true;
});
