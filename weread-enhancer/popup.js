document.addEventListener("DOMContentLoaded", () => {
  const generalReloadKeys = new Set(["hide-recommendations", "hide-account-details", "hide-navbar-links"]);
  const readerReloadKeys = new Set([
    "text-align-start",
    "customize-font",
    "font-family",
    "custom-font-name",
    "change-background-color",
    "simplify-floating-buttons",
  ]);

  const recommendationCheckbox = document.getElementById("hide-recommendations");
  const accountDetailsCheckbox = document.getElementById("hide-account-details");
  const navbarLinksCheckbox = document.getElementById("hide-navbar-links");
  const textAlignCheckbox = document.getElementById("text-align-start");
  const customizeFontCheckbox = document.getElementById("customize-font");
  const fontSelect = document.getElementById("font-select");
  const customFontInput = document.getElementById("custom-font-input");
  const customFontContainer = document.getElementById("custom-font-container");
  const changeBackgroundColorCheckbox = document.getElementById("change-background-color");
  const simplifyFloatingButtonsCheckbox = document.getElementById("simplify-floating-buttons");

  function updateCustomFontControls() {
    fontSelect.disabled = !customizeFontCheckbox.checked;
    const showCustom = customizeFontCheckbox.checked && fontSelect.value === "font-custom";
    customFontContainer.style.display = showCustom ? "flex" : "none";
    customFontInput.disabled = !showCustom;
  }

  const controls = {
    "hide-recommendations": recommendationCheckbox,
    "hide-account-details": accountDetailsCheckbox,
    "hide-navbar-links": navbarLinksCheckbox,
    "text-align-start": textAlignCheckbox,
    "customize-font": customizeFontCheckbox,
    "font-family": fontSelect,
    "change-background-color": changeBackgroundColorCheckbox,
    "simplify-floating-buttons": simplifyFloatingButtonsCheckbox,
    "custom-font-name": customFontInput,
  };

  // Load saved settings
  chrome.storage.sync.get(Object.keys(controls), (result) => {
    for (const key in controls) {
      if (controls[key]) {
        if (controls[key].type === "checkbox") {
          controls[key].checked = !!result[key];
        } else {
          if (key === "font-family") {
            controls[key].value = result[key] || "font-songti";
          } else if (key === "custom-font-name") {
            controls[key].value = result[key] || "";
          }
        }
      }
    }
    updateCustomFontControls();
  });

  // Add change listeners
  for (const key in controls) {
    if (controls[key]) {
      controls[key].addEventListener("change", (event) => {
        const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
        chrome.storage.sync.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            return;
          }

          if (key === "customize-font" || key === "font-family") {
            updateCustomFontControls();
          }

          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab || !activeTab.id || !activeTab.url.includes("weread.qq.com")) {
              return;
            }

            const isReaderPage = activeTab.url.includes("/web/reader/");
            const shouldReload = generalReloadKeys.has(key) || (isReaderPage && readerReloadKeys.has(key));

            if (shouldReload) {
              chrome.runtime.sendMessage({ action: "sync_styles" }, () => {
                chrome.tabs.reload(activeTab.id);
              });
              return;
            }
          });
        });
      });
    }
  }
});
