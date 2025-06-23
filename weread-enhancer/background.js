chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(
    [
      "hide-recommendations",
      "hide-account-details",
      "hide-navbar-links",
      "text-align-start",
      "customize-font",
      "font-family",
      "change-background-color",
      "simplify-floating-buttons",
    ],
    (items) => {
      const defaults = {};
      if (typeof items["hide-recommendations"] === "undefined") {
        defaults["hide-recommendations"] = true;
      }
      if (typeof items["hide-account-details"] === "undefined") {
        defaults["hide-account-details"] = true;
      }
      if (typeof items["hide-navbar-links"] === "undefined") {
        defaults["hide-navbar-links"] = true;
      }
      if (typeof items["text-align-start"] === "undefined") {
        defaults["text-align-start"] = true;
      }
      if (typeof items["customize-font"] === "undefined") {
        defaults["customize-font"] = true;
      }
      if (typeof items["font-family"] === "undefined") {
        defaults["font-family"] = "font-songti";
      }
      if (typeof items["change-background-color"] === "undefined") {
        defaults["change-background-color"] = true;
      }
      if (typeof items["simplify-floating-buttons"] === "undefined") {
        defaults["simplify-floating-buttons"] = true;
      }
      if (Object.keys(defaults).length > 0) {
        chrome.storage.sync.set(defaults);
      }
    },
  );
});
