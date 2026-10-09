import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { extractArticle, fallbackExtract, isProbablyReaderable } from "../../src/content/extract.js";

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "fixtures");

function loadFixture(name) {
  const html = readFileSync(path.join(fixturesDir, name), "utf8");
  return new JSDOM(html, { url: `https://example.com/${name}` }).window.document;
}

describe("extractArticle", () => {
  it("extracts title, byline and date from a clean article", () => {
    const article = extractArticle(loadFixture("article-clean.html"));
    expect(article).not.toBeNull();
    expect(article.title).toContain("Clean Article");
    expect(article.byline).toContain("Jane Doe");
    expect(article.date).toContain("2026-01-05");
  });

  it("keeps the prose and strips nav, ads and footer", () => {
    const article = extractArticle(loadFixture("article-clean.html"));
    expect(article.content).toContain("First opening paragraph");
    expect(article.content).not.toContain("buy now");
    expect(article.content).not.toContain("Cookie policy");
    expect(article.content).not.toContain("Weather");
  });

  it("keeps images, videos and embeds in media-heavy articles", () => {
    const article = extractArticle(loadFixture("article-media.html"));
    expect(article).not.toBeNull();
    expect(article.content).toContain("<img");
    expect(article.content).toContain("<video");
    expect(article.content).toContain("<iframe");
    expect(article.content).toContain("A fine chart of results");
  });

  it("survives noisy pages and strips ads and comments", () => {
    const article = extractArticle(loadFixture("article-noisy.html"));
    expect(article).not.toBeNull();
    expect(article.content).toContain("Noisy paragraph one");
    expect(article.content).not.toContain("buy now");
    expect(article.content).not.toContain("User comments spam");
  });

  it("returns null for listing pages without an article", () => {
    expect(extractArticle(loadFixture("listing.html"))).toBeNull();
  });

  it("does not throw on malformed markup", () => {
    const doc = new JSDOM("<html><body><div><p>unclosed <em>text").window.document;
    expect(() => extractArticle(doc)).not.toThrow();
    expect(extractArticle(doc)).toBeNull();
  });
});

describe("fallbackExtract", () => {
  it("extracts the main column without Readability", () => {
    const article = fallbackExtract(loadFixture("article-noisy.html"));
    expect(article).not.toBeNull();
    expect(article.content).toContain("Noisy paragraph one");
    expect(article.content).not.toContain("Sidebar link one");
  });

  it("returns null when there is no prose", () => {
    expect(fallbackExtract(loadFixture("listing.html"))).toBeNull();
  });
});

describe("isProbablyReaderable", () => {
  it("flags articles and not listings", () => {
    expect(isProbablyReaderable(loadFixture("article-clean.html"))).toBe(true);
    expect(isProbablyReaderable(loadFixture("listing.html"))).toBe(false);
  });
});
