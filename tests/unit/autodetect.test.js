// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockChrome } from "../helpers/mock-chrome.js";

// The content script runs its auto-detection at import time.
async function loadContentScript() {
  vi.resetModules();
  await import("../../src/content/content.js");
}

function domOf(html) {
  document.documentElement.innerHTML = html;
}

beforeEach(() => {
  vi.stubGlobal("chrome", createMockChrome());
  chrome.runtime.sendMessage = vi.fn(async () => ({ ok: true }));
  domOf("<head></head><body></body>");
});

describe("content script auto-detection", () => {
  it("marks article pages as readable and notifies the background", async () => {
    domOf(`<body><article><h1>Title</h1>${"<p>Long prose paragraph with plenty of text. ".repeat(8)}</article></body>`);
    await loadContentScript();
    expect(document.documentElement.dataset.readerModeAiReady).toBe("true");
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: "set-badge", readerable: true });
  });

  it("leaves listing pages unmarked", async () => {
    domOf(`<body><h2>Product</h2><div>short blurb</div></body>`);
    await loadContentScript();
    expect(document.documentElement.dataset.readerModeAiReady).toBe("false");
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: "set-badge", readerable: false });
  });
});
