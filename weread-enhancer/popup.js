document.addEventListener("DOMContentLoaded", () => {
  const recommendationCheckbox = document.getElementById(
    "hide-recommendations",
  );
  const accountDetailsCheckbox = document.getElementById(
    "hide-account-details",
  );
  const navbarLinksCheckbox = document.getElementById("hide-navbar-links");
  const textAlignCheckbox = document.getElementById("text-align-start");
  const customizeFontCheckbox = document.getElementById("customize-font");
  const fontSelect = document.getElementById("font-select");
  const customFontInput = document.getElementById("custom-font-input");
  const customFontContainer = document.getElementById("custom-font-container");
  const changeBackgroundColorCheckbox = document.getElementById(
    "change-background-color",
  );
  const simplifyFloatingButtonsCheckbox = document.getElementById(
    "simplify-floating-buttons",
  );

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
    fontSelect.disabled = !customizeFontCheckbox.checked;
    const showCustom =
      customizeFontCheckbox.checked && fontSelect.value === "font-custom";
    customFontContainer.style.display = showCustom ? "flex" : "none";
    customFontInput.disabled = !showCustom;
  });

  // Add change listeners
  for (const key in controls) {
    if (controls[key]) {
      controls[key].addEventListener("change", (event) => {
        const value =
          event.target.type === "checkbox"
            ? event.target.checked
            : event.target.value;
        chrome.storage.sync.set({ [key]: value });

        if (key === "customize-font") {
          fontSelect.disabled = !value;
          const showCustom = value && fontSelect.value === "font-custom";
          customFontContainer.style.display = showCustom ? "flex" : "none";
          customFontInput.disabled = !showCustom;
        }

        if (key === "font-family") {
          const showCustom =
            customizeFontCheckbox.checked && fontSelect.value === "font-custom";
          customFontContainer.style.display = showCustom ? "flex" : "none";
          customFontInput.disabled = !showCustom;
        }

        // Send message to active tab to update CSS or reload
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (
            !activeTab ||
            !activeTab.id ||
            !activeTab.url.includes("weread.qq.com")
          ) {
            return;
          }

          const isReaderPage = activeTab.url.includes("/web/reader/");
          let needsReload = [
            "text-align-start",
            "customize-font",
            "custom-font-name",
          ].includes(key);
          if (key === "font-family") {
            needsReload = fontSelect.value !== "font-custom";
          }

          if (isReaderPage && needsReload) {
            chrome.tabs.reload(activeTab.id);
          } else {
            // For non-reloading changes, send a message
            chrome.tabs.sendMessage(activeTab.id, {
              action: "toggle_css",
              rule: key,
              apply: value,
            });
          }
        });
      });
    }
  }
});
