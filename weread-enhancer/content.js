const rules = {
  "hide-recommendations": "rules/hide-recommendations.css",
  "hide-account-details": "rules/hide-account-details.css",
  "hide-navbar-links": "rules/hide-navbar-links.css",
};

function toggleStylesheet(rule, apply) {
  const linkId = `weread-enhancer-${rule}`;
  let linkElement = document.getElementById(linkId);

  if (apply) {
    if (!linkElement) {
      linkElement = document.createElement("link");
      linkElement.id = linkId;
      linkElement.rel = "stylesheet";
      linkElement.type = "text/css";
      linkElement.href = chrome.runtime.getURL(rules[rule]);
      document.head.appendChild(linkElement);
    }
  } else {
    if (linkElement) {
      linkElement.remove();
    }
  }
}

// Apply styles on initial load
chrome.storage.sync.get(Object.keys(rules), (result) => {
  for (const rule in rules) {
    if (result[rule]) {
      toggleStylesheet(rule, true);
    }
  }
});

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle_css") {
    toggleStylesheet(request.rule, request.apply);
  }
});
