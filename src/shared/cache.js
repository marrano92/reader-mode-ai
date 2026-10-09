// Translation cache keyed by text hash and target language. Translations are
// stored in chrome.storage.local so re-reading an article costs zero API calls.
const STORAGE_KEY = "translationCache";
const DEFAULT_MAX_ENTRIES = 2000;

export function hashText(text) {
  // FNV-1a 64-bit: stable, dependency-free and good enough for cache keys.
  let hash = 0xcbf29ce484222325n;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= BigInt(text.charCodeAt(i));
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash.toString(16);
}

export function cacheKey(text, targetLang) {
  return `${hashText(text)}:${targetLang}`;
}

export function makeCache({ storage, maxEntries = DEFAULT_MAX_ENTRIES }) {
  async function readAll() {
    const stored = await storage.get(STORAGE_KEY);
    return stored[STORAGE_KEY] ?? {};
  }

  return {
    async getMany(texts, targetLang) {
      const all = await readAll();
      const found = new Map();
      texts.forEach((text, index) => {
        const entry = all[cacheKey(text, targetLang)];
        if (entry) found.set(index, entry.translation);
      });
      return found;
    },
    async setMany(texts, translations, targetLang) {
      const all = await readAll();
      const now = Date.now();
      texts.forEach((text, index) => {
        all[cacheKey(text, targetLang)] = { translation: translations[index], ts: now };
      });
      const entries = Object.entries(all);
      if (entries.length > maxEntries) {
        entries.sort((a, b) => a[1].ts - b[1].ts);
        for (const [key] of entries.slice(0, entries.length - maxEntries)) delete all[key];
      }
      await storage.set({ [STORAGE_KEY]: all });
    },
  };
}
