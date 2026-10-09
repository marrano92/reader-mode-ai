// Content script entry: reader toggle and page messaging.
import { extractArticle } from "./extract.js";
import { mountReader } from "./overlay.js";
import { getSettings, updateSettings } from "../shared/settings.js";

let reader = null;

async function openReader() {
  if (reader) return;
  const article = extractArticle(document);
  if (!article) {
    showToast("Reader Mode AI: no article found on this page.");
    return;
  }
  const settings = await getSettings();
  reader = mountReader(document, article, {
    settings,
    onClose: () => {
      reader = null;
    },
    onSettingChange: (patch) => updateSettings(patch),
  });
}

function closeReader() {
  reader?.close();
  reader = null;
}

function toggleReader() {
  if (reader) closeReader();
  else openReader();
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "toggle-reader") toggleReader();
});

function showToast(text) {
  const toast = document.createElement("div");
  toast.textContent = text;
  toast.style.cssText =
    "position:fixed;inset:auto 1rem 1rem auto;z-index:2147483647;background:#1f2023;color:#fff;" +
    "padding:.6em 1em;border-radius:8px;font:14px/1.4 sans-serif;";
  document.documentElement.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
