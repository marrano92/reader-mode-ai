// Persisted settings: appearance and language in chrome.storage.sync,
// secrets (API key, custom endpoint) in chrome.storage.local and never synced.
export const TARGET_LANGUAGES = ["EN", "IT", "ES", "FR", "DE"];
export const DEFAULT_SETTINGS = { theme: "white", fontFamily: "serif", fontSize: 20, targetLang: "IT" };
export const DEFAULT_SECRET = { deeplKey: "", endpointUrl: "" };

export const FONT_SIZE_MIN = 14;
export const FONT_SIZE_MAX = 32;

const THEMES = ["white", "sepia", "gray", "dark"];
const FONTS = ["serif", "sans"];

export function sanitizeSettings(candidate = {}) {
  return {
    theme: THEMES.includes(candidate.theme) ? candidate.theme : DEFAULT_SETTINGS.theme,
    fontFamily: FONTS.includes(candidate.fontFamily) ? candidate.fontFamily : DEFAULT_SETTINGS.fontFamily,
    fontSize: clampFontSize(candidate.fontSize),
    targetLang: TARGET_LANGUAGES.includes(candidate.targetLang)
      ? candidate.targetLang
      : DEFAULT_SETTINGS.targetLang,
  };
}

export function sanitizeSecret(candidate = {}) {
  return {
    deeplKey: typeof candidate.deeplKey === "string" ? candidate.deeplKey.trim() : DEFAULT_SECRET.deeplKey,
    endpointUrl: normalizeEndpoint(candidate.endpointUrl),
  };
}

export async function getSettings() {
  return sanitizeSettings(await chrome.storage.sync.get(DEFAULT_SETTINGS));
}

export async function updateSettings(patch = {}) {
  const next = sanitizeSettings({ ...(await getSettings()), ...patch });
  await chrome.storage.sync.set(next);
  return next;
}

export async function getSecret() {
  return sanitizeSecret(await chrome.storage.local.get(DEFAULT_SECRET));
}

export async function setSecret(patch = {}) {
  const next = sanitizeSecret({ ...(await getSecret()), ...patch });
  await chrome.storage.local.set(next);
  return next;
}

function clampFontSize(value) {
  const size = Number(value);
  if (!Number.isFinite(size)) return DEFAULT_SETTINGS.fontSize;
  return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(size)));
}

// The endpoint override is only for tests and self-hosted proxies: http(s) only.
function normalizeEndpoint(value) {
  if (typeof value !== "string" || !value.trim()) return DEFAULT_SECRET.endpointUrl;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : DEFAULT_SECRET.endpointUrl;
  } catch {
    return DEFAULT_SECRET.endpointUrl;
  }
}
