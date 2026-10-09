// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { translateArticle } from "../../src/translate/pipeline.js";

function makeRoot(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div;
}

const ARTICLE_HTML = `
  <h2>Title here</h2>
  <p>intro text</p>
  <figure><img src="x.png"><figcaption>caption text</figcaption></figure>
  <p>body <em>text</em> <img src="y.png"> tail</p>`;

describe("translateArticle", () => {
  it("replaces text in place and never touches media", async () => {
    const root = makeRoot(ARTICLE_HTML);
    const img = root.querySelector("img");
    const client = vi.fn(async (texts) => texts.map((text) => `[IT]${text}`));
    const progress = [];

    const stats = await translateArticle({
      root,
      targetLang: "IT",
      client,
      onProgress: (fraction) => progress.push(fraction),
    });

    expect(stats).toMatchObject({ segments: 5, requests: 1 });
    expect(client).toHaveBeenCalledOnce();
    expect(root.querySelector("h2").textContent).toBe("[IT]Title here");
    expect(root.querySelector("figcaption").textContent).toBe("[IT]caption text");
    const body = root.querySelectorAll("p")[1];
    expect(body.textContent).toBe("[IT]body text [IT] tail");
    expect(body.querySelector("em")).not.toBeNull(); // inline markup preserved
    expect(root.querySelectorAll("p")[0].textContent).toBe("[IT]intro text");

    // Media keeps node identity and attributes (decision D3).
    expect(root.querySelector("img")).toBe(img);
    expect(img.getAttribute("src")).toBe("x.png");
    expect(progress[0]).toBe(0);
    expect(progress.at(-1)).toBe(1);
  });

  it("translates the title root alongside the content", async () => {
    const title = document.createElement("h1");
    title.textContent = "The Title";
    const root = makeRoot("<p>intro text</p>");
    const client = async (texts) => texts.map((text) => `[IT]${text}`);
    const stats = await translateArticle({ roots: [title, root], targetLang: "IT", client });
    expect(stats.segments).toBe(2);
    expect(title.textContent).toBe("[IT]The Title");
    expect(root.querySelector("p").textContent).toBe("[IT]intro text");
  });

  it("splits work into multiple requests when chunks are small", async () => {
    const root = makeRoot(`<p>${"a".repeat(30)}</p><p>${"b".repeat(30)}</p><p>${"c".repeat(30)}</p>`);
    const client = vi.fn(async (texts) => texts.map((text) => text.toUpperCase()));
    const stats = await translateArticle({ root, targetLang: "IT", client, chunkChars: 40 });
    expect(stats.requests).toBe(3);
    expect(client).toHaveBeenCalledTimes(3);
  });

  it("keeps earlier chunks when a later one fails", async () => {
    const root = makeRoot(`<p>${"a".repeat(30)}</p><p>${"b".repeat(30)}</p>`);
    let call = 0;
    const client = async (texts) => {
      call += 1;
      if (call === 2) throw new Error("boom");
      return texts.map((text) => `[IT]${text}`);
    };
    await expect(translateArticle({ root, targetLang: "IT", client, chunkChars: 20 })).rejects.toThrow("boom");
    expect(root.querySelectorAll("p")[0].textContent).toContain("[IT]");
    expect(root.querySelectorAll("p")[1].textContent).not.toContain("[IT]");
  });

  it("stops between chunks when aborted", async () => {
    const root = makeRoot(`<p>${"a".repeat(30)}</p><p>${"b".repeat(30)}</p>`);
    const controller = new AbortController();
    let call = 0;
    const client = async (texts) => {
      call += 1;
      if (call === 1) controller.abort();
      return texts.map((text) => `[IT]${text}`);
    };
    await expect(
      translateArticle({ root, targetLang: "IT", client, chunkChars: 20, signal: controller.signal }),
    ).rejects.toMatchObject({ name: "AbortError" });
    expect(root.querySelectorAll("p")[0].textContent).toContain("[IT]");
    expect(root.querySelectorAll("p")[1].textContent).not.toContain("[IT]");
  });

  it("returns early on an empty root", async () => {
    const client = vi.fn();
    const stats = await translateArticle({ root: makeRoot("<div></div>"), targetLang: "IT", client });
    expect(stats).toMatchObject({ segments: 0, requests: 0, chars: 0 });
    expect(client).not.toHaveBeenCalled();
  });
});
