// Remembers which articles were translated and into which language, so
// reopening them re-applies the cached translation automatically instead of
// asking the user (or DeepL) again. Translations themselves live in the
// segment cache (src/shared/cache.js); this map only links article -> language.
const STORAGE_KEY = "translatedArticles";
const DEFAULT_MAX_ENTRIES = 500;

export function articleKey(url) {
  try {
    return new URL(url).href.split("#")[0];
  } catch {
    return String(url);
  }
}

export async function getTranslatedArticle(url) {
  const all = await readAll();
  return all[articleKey(url)] ?? null;
}

export async function rememberTranslatedArticle(url, targetLang) {
  const all = await readAll();
  all[articleKey(url)] = { targetLang, ts: Date.now() };
  await writeAll(all);
}

export async function forgetTranslatedArticle(url) {
  const all = await readAll();
  delete all[articleKey(url)];
  await writeAll(all);
}

async function readAll() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return stored[STORAGE_KEY] ?? {};
}

async function writeAll(all) {
  const entries = Object.entries(all);
  if (entries.length > DEFAULT_MAX_ENTRIES) {
    entries.sort((a, b) => a[1].ts - b[1].ts);
    for (const [key] of entries.slice(0, entries.length - DEFAULT_MAX_ENTRIES)) delete all[key];
  }
  await chrome.storage.local.set({ [STORAGE_KEY]: all });
}
