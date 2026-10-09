import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockChrome } from "../helpers/mock-chrome.js";
import {
  articleKey,
  forgetTranslatedArticle,
  getTranslatedArticle,
  rememberTranslatedArticle,
} from "../../src/shared/articles.js";

beforeEach(() => {
  vi.stubGlobal("chrome", createMockChrome());
});

describe("articleKey", () => {
  it("ignores the fragment", () => {
    expect(articleKey("https://example.com/a?x=1#part")).toBe("https://example.com/a?x=1");
    expect(articleKey("https://example.com/a?x=1")).toBe(articleKey("https://example.com/a?x=1#other"));
  });
});

describe("translated article memory", () => {
  it("round-trips a remembered article", async () => {
    await rememberTranslatedArticle("https://example.com/a", "IT");
    expect(await getTranslatedArticle("https://example.com/a")).toMatchObject({ targetLang: "IT" });
  });

  it("returns null for unknown articles", async () => {
    expect(await getTranslatedArticle("https://example.com/never-seen")).toBeNull();
  });

  it("keeps the last language used for an article", async () => {
    await rememberTranslatedArticle("https://example.com/a", "IT");
    await rememberTranslatedArticle("https://example.com/a", "DE");
    expect(await getTranslatedArticle("https://example.com/a")).toMatchObject({ targetLang: "DE" });
  });

  it("forgets an article", async () => {
    await rememberTranslatedArticle("https://example.com/a", "IT");
    await forgetTranslatedArticle("https://example.com/a");
    expect(await getTranslatedArticle("https://example.com/a")).toBeNull();
  });

  it("evicts the oldest articles beyond the cap", async () => {
    for (let i = 0; i < 501; i += 1) {
      await rememberTranslatedArticle(`https://example.com/a${i}`, "IT");
    }
    expect(await getTranslatedArticle("https://example.com/a0")).toBeNull();
    expect(await getTranslatedArticle("https://example.com/a500")).toMatchObject({ targetLang: "IT" });
  });
});
