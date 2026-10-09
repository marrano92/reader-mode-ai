// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountReader } from "../../src/content/overlay.js";

const article = {
  title: "The Title",
  byline: "By Jane Doe",
  date: "2026-01-05",
  content:
    '<p>hello <strong>world</strong></p><script>bad()</script><p onclick="evil()">click me</p>' +
    '<img src="chart.png" alt="chart"><video src="clip.mp4"></video>' +
    '<iframe src="https://www.youtube.com/embed/x"></iframe><a href="javascript:evil()">link</a>',
};

const t = (key) => key;

beforeEach(() => {
  document.getElementById("reader-mode-ai-root")?.remove();
  document.documentElement.style.overflow = "";
});

describe("mountReader", () => {
  it("renders title, byline and content in a shadow root", () => {
    const handle = mountReader(document, article, { t });
    const shadow = handle.el.shadowRoot;
    expect(shadow.querySelector("h1").textContent).toBe("The Title");
    expect(shadow.querySelector(".reader__byline").textContent).toContain("Jane Doe");
    expect(shadow.querySelector(".reader__byline").textContent).toContain("2026-01-05");
    expect(shadow.querySelector(".reader__content").textContent).toContain("hello world");
  });

  it("sanitizes scripts, event handlers and javascript: URLs but keeps media", () => {
    const handle = mountReader(document, article, { t });
    const content = handle.el.shadowRoot.querySelector(".reader__content");
    expect(content.querySelector("script")).toBeNull();
    expect(content.querySelector("[onclick]")).toBeNull();
    expect(content.querySelector("a").hasAttribute("href")).toBe(false);
    expect(content.querySelector("img").getAttribute("src")).toBe("chart.png");
    expect(content.querySelector("video")).not.toBeNull();
    expect(content.querySelector("iframe")).not.toBeNull();
  });

  it("locks page scroll while open and restores it on close", () => {
    const onClose = vi.fn();
    const handle = mountReader(document, article, { t, onClose });
    expect(document.documentElement.style.overflow).toBe("hidden");
    handle.close();
    expect(document.documentElement.style.overflow).toBe("");
    expect(onClose).toHaveBeenCalledOnce();
    expect(document.getElementById("reader-mode-ai-root")).toBeNull();
  });

  it("applies typography settings through the stylesheet", () => {
    const handle = mountReader(document, article, { t, settings: { theme: "dark", fontFamily: "sans", fontSize: 22 } });
    const styleOf = () => handle.el.shadowRoot.querySelector("style").textContent;
    expect(styleOf()).toContain("#1f2023");
    expect(styleOf()).toContain("22px");
    handle.setSettings({ theme: "sepia", fontFamily: "serif", fontSize: 18 });
    expect(styleOf()).toContain("#f6ecd9");
    expect(styleOf()).toContain("18px");
    handle.close();
  });
});
