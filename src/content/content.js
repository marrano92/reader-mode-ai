// Content script entry: reader toggle, translation wiring and page messaging.
import { extractArticle, isProbablyReaderable } from "./extract.js";
import { mountReader } from "./overlay.js";
import { collectSegments } from "../translate/chunker.js";
import { translateArticle } from "../translate/pipeline.js";
import { getSettings, updateSettings } from "../shared/settings.js";
import { TranslationError } from "../translators/base.js";

let reader = null;

async function openReader() {
  if (reader) return;
  const article = extractArticle(document);
  if (!article) {
    showToast(t("noArticle") || "Reader Mode AI: no article found on this page.");
    return;
  }
  const settings = await getSettings();
  reader = mountReader(document, article, {
    settings,
    onClose: () => {
      reader = null;
    },
    onSettingChange: (patch) => updateSettings(patch),
    onTranslate: (targetLang, { root, signal, onProgress }) =>
      translateArticle({ root, targetLang, signal, onProgress, client: translateTexts }),
  });
  reader.setCharCount(countTranslatableChars(reader.getArticleRoot()));
}

function closeReader() {
  reader?.close();
  reader = null;
}

function toggleReader() {
  if (reader) closeReader();
  else openReader();
}

// The button label shows the cost in characters before translating.
function countTranslatableChars(root) {
  return collectSegments(root).reduce((n, segment) => n + segment.html.length, 0);
}

async function translateTexts(texts, targetLang) {
  const response = await chrome.runtime.sendMessage({ type: "translate", texts, targetLang });
  if (!response?.ok) throw new TranslationError(response?.error ?? "translation_failed");
  return response.translations;
}

// Auto-detection: a readable page lights up the toolbar badge.
function announceReadability() {
  const readable = isProbablyReaderable(document);
  document.documentElement.dataset.readerModeAiReady = String(readable);
  chrome.runtime.sendMessage({ type: "set-badge", readerable: readable }).catch(() => {});
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "toggle-reader") toggleReader();
});

function t(key) {
  return globalThis.chrome?.i18n?.getMessage?.(key) || "";
}

function showToast(text) {
  const toast = document.createElement("div");
  toast.textContent = text;
  toast.style.cssText =
    "position:fixed;inset:auto 1rem 1rem auto;z-index:2147483647;background:#1f2023;color:#fff;" +
    "padding:.6em 1em;border-radius:8px;font:14px/1.4 sans-serif;";
  document.documentElement.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

announceReadability();
