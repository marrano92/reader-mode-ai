import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockChrome } from "../helpers/mock-chrome.js";
import {
  DEFAULT_SETTINGS,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  getSecret,
  getSettings,
  sanitizeSecret,
  sanitizeSettings,
  setSecret,
  updateSettings,
} from "../../src/shared/settings.js";

beforeEach(() => {
  vi.stubGlobal("chrome", createMockChrome());
});

describe("sanitizeSettings", () => {
  it("falls back to defaults for invalid values", () => {
    expect(sanitizeSettings({ theme: "rainbow", fontFamily: "mono", fontSize: "abc", targetLang: "XX" })).toEqual(
      DEFAULT_SETTINGS,
    );
    expect(sanitizeSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("clamps the font size", () => {
    expect(sanitizeSettings({ fontSize: 100 }).fontSize).toBe(FONT_SIZE_MAX);
    expect(sanitizeSettings({ fontSize: 10 }).fontSize).toBe(FONT_SIZE_MIN);
    expect(sanitizeSettings({ fontSize: 19.6 }).fontSize).toBe(20);
  });

  it("keeps valid values", () => {
    expect(sanitizeSettings({ theme: "sepia", fontFamily: "sans", fontSize: 24, targetLang: "DE" })).toEqual({
      theme: "sepia",
      fontFamily: "sans",
      fontSize: 24,
      targetLang: "DE",
    });
  });
});

describe("sanitizeSecret", () => {
  it("trims the key and validates the endpoint", () => {
    expect(sanitizeSecret({ deeplKey: "  k-1  " }).deeplKey).toBe("k-1");
    expect(sanitizeSecret({ endpointUrl: "javascript:alert(1)" }).endpointUrl).toBe("");
    expect(sanitizeSecret({ endpointUrl: "not a url" }).endpointUrl).toBe("");
    expect(sanitizeSecret({ endpointUrl: "http://127.0.0.1:9999/v2/translate" }).endpointUrl).toBe(
      "http://127.0.0.1:9999/v2/translate",
    );
    expect(sanitizeSecret({ endpointUrl: "https://api-free.deepl.com/v2/translate" }).endpointUrl).toBe(
      "https://api-free.deepl.com/v2/translate",
    );
  });
});

describe("getSettings / updateSettings", () => {
  it("returns defaults when storage is empty", async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("persists patches and merges them onto the current settings", async () => {
    await updateSettings({ theme: "sepia" });
    await updateSettings({ fontSize: 22 });
    expect(await getSettings()).toEqual({ ...DEFAULT_SETTINGS, theme: "sepia", fontSize: 22 });
    expect(chrome.storage.sync._dump().theme).toBe("sepia");
  });

  it("ignores invalid patches", async () => {
    const next = await updateSettings({ theme: "rainbow" });
    expect(next.theme).toBe(DEFAULT_SETTINGS.theme);
  });
});

describe("getSecret / setSecret", () => {
  it("keeps secrets out of the synced area", async () => {
    await setSecret({ deeplKey: " secret-key ", endpointUrl: "https://api-free.deepl.com/v2/translate" });
    const secret = await getSecret();
    expect(secret.deeplKey).toBe("secret-key");
    expect(chrome.storage.sync._dump().deeplKey).toBeUndefined();
    expect(chrome.storage.local._dump().deeplKey).toBe("secret-key");
  });
});
