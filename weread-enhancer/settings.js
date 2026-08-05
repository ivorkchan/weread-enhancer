// Shared settings schema. Loaded by background.js via importScripts() and by popup.html via a script tag.

const DEFAULT_SETTINGS = {
  "hide-recommendations": true,
  "hide-account-details": true,
  "hide-navbar-links": true,
  "text-align-start": true,
  "font-family": "font-songti",
  "custom-font-name": "",
  "change-background-color": true,
  "simplify-floating-buttons": true,
};

const STYLE_SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);
