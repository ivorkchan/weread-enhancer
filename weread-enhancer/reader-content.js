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

function applyFont(fontValue) {
  const fontCssPath = fontIdMap[fontValue];
  if (!fontCssPath) {
    return;
  }
  // Disable all other font stylesheets
  Object.values(fontIdMap).forEach((path) => {
    const styleId = `weread-enhancer-font-${path}`;
    if (path !== fontCssPath) {
      removeStylesheet(styleId);
    }
  });
  // Enable the selected one
  const styleId = `weread-enhancer-font-${fontCssPath}`;
  setStylesheet(styleId, fontCssPath);
}

function removeAllFonts() {
  Object.values(fontIdMap).forEach((path) => {
    const styleId = `weread-enhancer-font-${path}`;
    removeStylesheet(styleId);
  });
}

// Apply styles on initial load
chrome.storage.sync.get(Object.keys(readerRules).concat(["customize-font", "font-family"]), (result) => {
  // Handle font family
  if (result["customize-font"] && result["font-family"]) {
    applyFont(result["font-family"]);
  }

  // Handle other toggles
  Object.keys(readerRules).forEach((rule) => {
    if (result[rule]) {
      toggleStylesheet(rule, true);
    }
  });
});

// Non-font changes are instant, font changes require a reload
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle_css" && Object.prototype.hasOwnProperty.call(readerRules, request.rule)) {
    toggleStylesheet(request.rule, request.apply);
  }
});
