function sanitizeFontName(input) {
  if (!input || typeof input !== "string") {
    return "";
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.replace(/"/g, '\\"');
}

function applyCustomFont(customFontName) {
  const safeName = sanitizeFontName(customFontName);
  const styleId = "weread-enhancer-font-custom";
  const existingStyle = document.getElementById(styleId);

  if (existingStyle) {
    existingStyle.remove();
  }

  if (!safeName) {
    return;
  }

  const styleElement = document.createElement("style");
  styleElement.id = styleId;
  styleElement.textContent = `.wr_various_font_provider_wrapper * { font-family: "${safeName}", serif; }`;
  const parent = document.head || document.documentElement;
  if (parent) {
    parent.appendChild(styleElement);
  }
}

chrome.storage.sync.get(["customize-font", "font-family", "custom-font-name"], (result) => {
  if (result["customize-font"] && result["font-family"] === "font-custom") {
    applyCustomFont(result["custom-font-name"] || "");
  }
});
