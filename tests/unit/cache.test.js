import { describe, expect, it } from "vitest";
import { createMockChrome } from "../helpers/mock-chrome.js";
import { cacheKey, hashText, makeCache } from "../../src/shared/cache.js";

function makeTestCache(maxEntries) {
  const chrome = createMockChrome();
  return { cache: makeCache({ storage: chrome.storage.local, maxEntries }), storage: chrome.storage.local };
}

describe("hashText / cacheKey", () => {
  it("is stable and differs by language", () => {
    expect(hashText("hello")).toBe(hashText("hello"));
    expect(hashText("hello")).not.toBe(hashText("hello!"));
    expect(cacheKey("hello", "IT")).not.toBe(cacheKey("hello", "DE"));
  });
});

describe("makeCache", () => {
  it("round-trips translations", async () => {
    const { cache } = makeTestCache();
    await cache.setMany(["one", "two"], ["uno", "due"], "IT");
    const found = await cache.getMany(["one", "two", "three"], "IT");
    expect(found.get(0)).toBe("uno");
    expect(found.get(1)).toBe("due");
    expect(found.has(2)).toBe(false);
  });

  it("misses on a different target language", async () => {
    const { cache } = makeTestCache();
    await cache.setMany(["one"], ["uno"], "IT");
    expect((await cache.getMany(["one"], "DE")).size).toBe(0);
  });

  it("evicts the oldest entries beyond the limit", async () => {
    const { cache } = makeTestCache(2);
    await cache.setMany(["a"], ["A"], "IT");
    await cache.setMany(["b"], ["B"], "IT");
    await cache.setMany(["c"], ["C"], "IT");
    const found = await cache.getMany(["a", "b", "c"], "IT");
    expect(found.has(0)).toBe(false); // "a" evicted
    expect(found.get(1)).toBe("B");
    expect(found.get(2)).toBe("C");
  });
});
