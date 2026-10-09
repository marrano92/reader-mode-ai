// Background service worker: translation with cache, badge, and the wiring for
// the toolbar button and the Alt+R command. One translate request per chunk:
// no long-lived state, so MV3 worker termination cannot break a translation.
import { makeCache } from "../shared/cache.js";
import { getSecret } from "../shared/settings.js";
import { TranslationError } from "../translators/base.js";
import { createDeepLTranslator, DEFAULT_DEEPL_ENDPOINT } from "../translators/deepl.js";

const cache = makeCache({ storage: chrome.storage.local });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(
    (response) => sendResponse(response),
    (err) => sendResponse({ ok: false, error: sanitizeError(err) }),
  );
  return true; // async response
});

chrome.action.onClicked.addListener((tab) => sendToggle(tab));

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "toggle-reader") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  sendToggle(tab);
});

async function handleMessage(message, sender) {
  switch (message?.type) {
    case "echo":
      return { ok: true, payload: message.payload ?? null };
    case "translate":
      return translateHandler(message);
    case "set-badge":
      return badgeHandler(message, sender);
    default:
      return { ok: false, error: "unknown_message_type" };
  }
}

async function translateHandler({ texts, targetLang }) {
  if (!Array.isArray(texts) || texts.length === 0) return { ok: false, error: "bad_request" };

  const translations = new Array(texts.length);
  const cached = await cache.getMany(texts, targetLang);
  const missing = [];
  texts.forEach((text, index) => {
    if (cached.has(index)) translations[index] = cached.get(index);
    else missing.push(index);
  });

  if (missing.length) {
    const { deeplKey, endpointUrl } = await getSecret();
    const translator = createDeepLTranslator({
      apiKey: deeplKey,
      endpointUrl: endpointUrl || DEFAULT_DEEPL_ENDPOINT,
    });
    const fresh = await translator.translateTexts(
      missing.map((index) => texts[index]),
      targetLang,
    );
    missing.forEach((index, n) => {
      translations[index] = fresh[n];
    });
    await cache.setMany(
      missing.map((index) => texts[index]),
      fresh,
      targetLang,
    );
  }

  return { ok: true, translations };
}

async function badgeHandler({ readerable }, sender) {
  const tabId = sender?.tab?.id;
  if (typeof tabId === "number") {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#5b6ee1" });
    await chrome.action.setBadgeText({ tabId, text: readerable ? "R" : "" });
  }
  return { ok: true };
}

function sendToggle(tab) {
  if (typeof tab?.id === "number") {
    chrome.tabs.sendMessage(tab.id, { type: "toggle-reader" }).catch(() => {});
  }
}

// Never leak secrets: errors become stable, user-safe codes.
function sanitizeError(err) {
  return err instanceof TranslationError ? err.message : "internal_error";
}
