// Minimal chrome.* mock for unit tests: in-memory storage and no-op messaging.
export function createMockChrome(initial = {}) {
  const makeArea = (data) => {
    const store = { ...data };
    return {
      async get(keys) {
        const result = {};
        const wantsDefault = keys && typeof keys === "object" && !Array.isArray(keys);
        const list = Array.isArray(keys) ? keys : typeof keys === "string" ? [keys] : Object.keys(keys ?? {});
        for (const key of list) {
          if (key in store) result[key] = store[key];
          else if (wantsDefault) result[key] = keys[key];
        }
        return result;
      },
      async set(items) {
        Object.assign(store, items);
      },
      async remove(keys) {
        for (const key of [].concat(keys)) delete store[key];
      },
      // Test helper: inspect the stored data.
      _dump() {
        return { ...store };
      },
    };
  };

  return {
    storage: {
      sync: makeArea(initial.sync),
      local: makeArea(initial.local),
    },
    runtime: {
      sendMessage: async () => ({ ok: true }),
      onMessage: { addListener() {} },
    },
    i18n: { getMessage: (key) => key },
  };
}
