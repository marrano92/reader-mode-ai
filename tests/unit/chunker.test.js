// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { collectSegments, replaceSegmentHtml, splitIntoChunks } from "../../src/translate/chunker.js";

function makeRoot(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container;
}

describe("collectSegments", () => {
  it("splits blocks around media and never exposes media to translation", () => {
    const root = makeRoot(`
      <p>before <strong>bold</strong> <img src="x.png"> after</p>
      <h2>Head <em>line</em></h2>
      <p><video src="v.mp4"></video></p>`);
    const segments = collectSegments(root);
    expect(segments.map((s) => s.html)).toEqual([
      "before <strong>bold</strong> ",
      " after",
      "Head <em>line</em>",
    ]);
    for (const segment of segments) {
      expect(segment.html).not.toContain("<img");
      expect(segment.html).not.toContain("<video");
    }
    expect(root.querySelector("img")).not.toBeNull();
    expect(root.querySelector("video")).not.toBeNull();
  });

  it("keeps nested blocks separate without duplicating text", () => {
    const root = makeRoot(`<blockquote><p>inner quote</p>plain tail</blockquote>`);
    const segments = collectSegments(root);
    expect(segments.map((s) => s.html).sort()).toEqual([" inner quote", "plain tail"].map((h) => h.trim()).sort());
    expect(segments).toHaveLength(2);
  });

  it("ignores empty and whitespace-only runs", () => {
    const root = makeRoot(`<p>   </p><p><span>kept</span></p>`);
    const segments = collectSegments(root);
    expect(segments.map((s) => s.html)).toEqual(["<span>kept</span>"]);
  });

  it("escapes text nodes so markup survives the round trip", () => {
    const root = makeRoot(`<p>a &lt; b &amp; c</p>`);
    const segments = collectSegments(root);
    expect(segments).toHaveLength(1);
    expect(segments[0].html).toBe("a &lt; b &amp; c");
  });
});

describe("splitIntoChunks", () => {
  it("groups segments under the character limit preserving order", () => {
    const segments = ["aaaa", "bbbb", "cc", "dddd"].map((html) => ({ html, nodes: [] }));
    const chunks = splitIntoChunks(segments, 7);
    expect(chunks.map((c) => c.texts)).toEqual([["aaaa"], ["bbbb", "cc"], ["dddd"]]);
  });

  it("keeps an oversized segment in its own chunk", () => {
    const segments = [{ html: "x".repeat(50), nodes: [] }, { html: "y", nodes: [] }];
    const chunks = splitIntoChunks(segments, 10);
    expect(chunks.map((c) => c.texts.length)).toEqual([1, 1]);
  });
});

describe("replaceSegmentHtml", () => {
  it("replaces only the segment nodes and keeps siblings", () => {
    const root = makeRoot(`<p>keep <strong>us</strong> <img src="m.png"> tail</p><p>next</p>`);
    const p = root.querySelector("p");
    const img = p.querySelector("img");
    // Segments are collected from the root: the second run is the text after the image.
    const segment = collectSegments(root)[1];
    expect(segment.html).toBe(" tail");
    replaceSegmentHtml(segment, " coda");
    expect(p.innerHTML).toContain("coda");
    expect(p.textContent).toContain("keep us");
    expect(p.querySelector("img")).toBe(img);
    expect(root.querySelectorAll("p")).toHaveLength(2);
  });
});
