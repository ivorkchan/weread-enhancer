const FONT_SETTING_DEFAULTS = {
  "font-family": "font-songti",
  "custom-font-name": "",
};

const CUSTOM_FONT_STYLE_ID = "weread-enhancer-font-custom";

function sanitizeFontName(input) {
  if (typeof input !== "string") {
    return "";
  }

  return input.trim().replace(/\\/g, "").replace(/"/g, '\\"');
}

function setCustomFont(fontName) {
  const safeName = sanitizeFontName(fontName);
  const existingStyle = document.getElementById(CUSTOM_FONT_STYLE_ID);

  if (existingStyle) {
    existingStyle.remove();
  }

  if (!safeName) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = CUSTOM_FONT_STYLE_ID;
  styleElement.textContent = `.wr_various_font_provider_wrapper * { font-family: "WeReadEnhancerLatin", "${safeName}", serif; }`;
  (document.head || document.documentElement).appendChild(styleElement);
}

function applyFontSettings(settings) {
  const enabled = settings["font-family"] === "font-custom";
  setCustomFont(enabled ? settings["custom-font-name"] : "");
}

chrome.storage.sync.get(FONT_SETTING_DEFAULTS).then(applyFontSettings);

// Re-apply on change so custom font edits take effect without a page reload.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }

  if (Object.keys(FONT_SETTING_DEFAULTS).some((key) => Object.prototype.hasOwnProperty.call(changes, key))) {
    void chrome.storage.sync.get(FONT_SETTING_DEFAULTS).then(applyFontSettings);
  }
});
