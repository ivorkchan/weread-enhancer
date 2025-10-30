const readerRules = {
  "text-align-start": "rules/text-align-start.css",
  "change-background-color": "rules/change-background-color.css",
  "simplify-floating-buttons": "rules/simplify-floating-buttons.css",
};

const fontIdMap = {
  "font-kaiti": "rules/font-kaiti.css",
  "font-songti": "rules/font-songti.css",
  "font-heiti": "rules/font-heiti.css",
};

const placeholderRegex = /__([\w-]+\.(?:woff2|ttf))__/gi;

async function setStylesheet(styleId, path) {
  if (!path) {
    return;
  }
  removeStylesheet(styleId); // Remove previous version if it exists

  const styleElement = document.createElement("style");
  styleElement.id = styleId;

  try {
    const cssUrl = chrome.runtime.getURL(path);
    let cssText = await (await fetch(cssUrl)).text();

    // Replace font placeholders with actual URLs
    if (path.includes("font-")) {
      cssText = cssText.replace(placeholderRegex, (match, fontFile) => {
        return chrome.runtime.getURL(`fonts/${fontFile}`);
      });
    }

    styleElement.textContent = cssText;
    document.head.appendChild(styleElement);
  } catch (error) {
    console.error(`Failed to load and apply stylesheet: ${path}`, error);
  }
}

function removeStylesheet(styleId) {
  const styleElement = document.getElementById(styleId);
  if (styleElement) {
    styleElement.remove();
  }
}

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
  removeStylesheet("weread-enhancer-font-custom");
  if (!safeName) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.id = "weread-enhancer-font-custom";
  styleElement.textContent = `.wr_various_font_provider_wrapper * { font-family: "${safeName}", serif; }`;
  document.head.appendChild(styleElement);
}

function toggleStylesheet(rule, apply) {
  const path = readerRules[rule];
  if (!path) {
    return;
  }
  const styleId = `weread-enhancer-${rule}`;
  if (apply) {
    setStylesheet(styleId, path);
  } else {
    removeStylesheet(styleId);
  }
}

function applyFont(fontValue, customFontName) {
  if (fontValue === "font-custom") {
    // Disable packaged font styles first
    Object.values(fontIdMap).forEach((path) => {
      const styleId = `weread-enhancer-font-${path}`;
      removeStylesheet(styleId);
    });
    applyCustomFont(customFontName);
    return;
  }
  removeStylesheet("weread-enhancer-font-custom");
  const fontCssPath = fontIdMap[fontValue];
  if (!fontCssPath) {
    return;
  }
  Object.values(fontIdMap).forEach((path) => {
    const styleId = `weread-enhancer-font-${path}`;
    if (path !== fontCssPath) {
      removeStylesheet(styleId);
    }
  });
  const styleId = `weread-enhancer-font-${fontCssPath}`;
  setStylesheet(styleId, fontCssPath);
}

function removeAllFonts() {
  Object.values(fontIdMap).forEach((path) => {
    const styleId = `weread-enhancer-font-${path}`;
    removeStylesheet(styleId);
  });
  removeStylesheet("weread-enhancer-font-custom");
}

// Apply styles on initial load
chrome.storage.sync.get(
  Object.keys(readerRules).concat([
    "customize-font",
    "font-family",
    "custom-font-name",
  ]),
  (result) => {
    // Handle font family
    if (result["customize-font"] && result["font-family"]) {
      applyFont(result["font-family"], result["custom-font-name"] || "");
    }

    // Handle other toggles
    Object.keys(readerRules).forEach((rule) => {
      if (result[rule]) {
        toggleStylesheet(rule, true);
      }
    });
  },
);

// Non-font changes are instant, font changes require a reload
chrome.runtime.onMessage.addListener((request) => {
  if (
    request.action === "toggle_css" &&
    Object.prototype.hasOwnProperty.call(readerRules, request.rule)
  ) {
    toggleStylesheet(request.rule, request.apply);
  }
});
