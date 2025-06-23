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
  };

  // Load saved settings
  chrome.storage.sync.get(Object.keys(controls), (result) => {
    for (const key in controls) {
      if (controls[key]) {
        if (controls[key].type === "checkbox") {
          controls[key].checked = !!result[key];
        } else {
          controls[key].value = result[key] || "font-songti";
        }
      }
    }
    // Disable font select if customize-font is not checked
    fontSelect.disabled = !customizeFontCheckbox.checked;
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

        // Disable font select if customize-font is not checked
        if (key === "customize-font") {
          fontSelect.disabled = !value;
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
          const needsReload = [
            "text-align-start",
            "customize-font",
            "font-family",
          ].includes(key);

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
