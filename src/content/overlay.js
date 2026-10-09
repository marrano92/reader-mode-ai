// Renders the reader as a shadow-DOM overlay so page styles cannot leak in.
import { readerCSS } from "./reader.css.js";
import { buildToolbar } from "./toolbar-ui.js";

const HOST_ID = "reader-mode-ai-root";
const STRIP_SELECTOR = "script, style, link, meta, base, noscript";

export function mountReader(doc, article, options = {}) {
  const {
    settings = {},
    t = defaultT,
    onClose,
    onSettingChange,
    onTranslate,
    onCancelTranslate,
  } = options;

  const host = doc.createElement("div");
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: "open" });

  const style = doc.createElement("style");
  const current = { ...settings };

  const toolbar = buildToolbar({
    doc,
    settings: current,
    t,
    handlers: {
      onClose: () => handle.close(),
      onSettingChange: (patch) => applySettings(patch),
      onTranslate: (targetLang) => runTranslation(targetLang),
      onCancelTranslate: () => abortController?.abort(),
    },
  });

  const header = doc.createElement("header");
  header.className = "reader__header";
  const titleEl = doc.createElement("h1");
  titleEl.textContent = article.title ?? "";
  const bylineEl = doc.createElement("p");
  bylineEl.className = "reader__byline";
  bylineEl.textContent = [article.byline, article.date].filter(Boolean).join(" — ");
  header.append(titleEl, bylineEl);

  const contentEl = doc.createElement("article");
  contentEl.className = "reader__content";
  contentEl.appendChild(sanitizeContent(doc, article.content));

  const inner = doc.createElement("div");
  inner.className = "reader__inner";
  inner.append(toolbar.el, header, contentEl);

  const page = doc.createElement("main");
  page.className = "reader";
  page.append(inner);
  shadow.append(style, page);
  doc.documentElement.appendChild(host);
  const previousOverflow = doc.documentElement.style.overflow;
  doc.documentElement.style.overflow = "hidden";

  let abortController = null;
  let closing = false;

  async function applySettings(patch) {
    const next = onSettingChange ? await onSettingChange(patch) : { ...current, ...patch };
    handle.setSettings(next ?? { ...current, ...patch });
  }

  async function runTranslation(targetLang) {
    if (!onTranslate) return;
    abortController = new AbortController();
    toolbar.setBusy(true);
    toolbar.setProgress(0);
    try {
      await onTranslate(targetLang, {
        roots: [titleEl, contentEl],
        signal: abortController.signal,
        onProgress: (fraction) => toolbar.setProgress(fraction),
      });
      toolbar.setProgress(null);
    } catch (err) {
      toolbar.setProgress(null);
      if (err?.name !== "AbortError") toolbar.setNotice(t("translateFailed"));
    } finally {
      toolbar.setBusy(false);
      abortController = null;
    }
  }

  const handle = {
    el: host,
    getArticleRoot: () => contentEl,
    getTranslatableRoots: () => [titleEl, contentEl],
    translate: (targetLang) => runTranslation(targetLang),
    setCharCount: (count) => toolbar.setCharCount(count),
    setSettings(next = {}) {
      Object.assign(current, next);
      style.textContent = readerCSS(current);
      toolbar.setSettings(current);
    },
    async close() {
      if (closing) return;
      closing = true;
      abortController?.abort();
      // Free the id and notify right away: the reader is inactive from now on,
      // so a quick re-open cannot collide with the exit animation.
      host.removeAttribute("id");
      onClose?.();
      await animateOut(doc, page);
      host.remove();
      // A newer overlay may have locked scrolling meanwhile: leave it alone.
      if (!doc.getElementById(HOST_ID)) doc.documentElement.style.overflow = previousOverflow;
    },
  };
  handle.setSettings(current);
  animateIn(doc, { page, toolbar: toolbar.el, header, content: contentEl });
  return handle;
}

// The extracted content keeps media (decision D3) but drops active content.
function sanitizeContent(doc, html) {
  const template = doc.createElement("template");
  template.innerHTML = html ?? "";
  const fragment = template.content;
  for (const el of fragment.querySelectorAll(STRIP_SELECTOR)) el.remove();
  for (const el of fragment.querySelectorAll("*")) {
    for (const attr of [...el.attributes]) {
      if (/^on/i.test(attr.name)) el.removeAttribute(attr.name);
      if (/^(href|src)$/i.test(attr.name) && /^\s*javascript:/i.test(attr.value)) {
        el.removeAttribute(attr.name);
      }
    }
  }
  return fragment;
}

function defaultT(key) {
  return globalThis.chrome?.i18n?.getMessage?.(key) || key;
}

// Apple-like transition: the reader fades in over the page while its parts rise
// into place with a staggered, soft ease-out; the exit is a quick fade and dip.
const ENTER_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const EXIT_EASING = "cubic-bezier(0.4, 0, 1, 1)";

function prefersReducedMotion(doc) {
  return doc.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function animateIn(doc, parts) {
  if (prefersReducedMotion(doc) || typeof parts.page.animate !== "function") return;
  parts.page.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, easing: ENTER_EASING });
  const stages = [
    [parts.toolbar, 0],
    [parts.header, 60],
    [parts.content, 110],
  ];
  for (const [el, delay] of stages) {
    el.animate(
      [
        { opacity: 0, transform: "translateY(16px) scale(0.985)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      { duration: 380, delay, easing: ENTER_EASING, fill: "backwards" },
    );
  }
}

async function animateOut(doc, page) {
  if (prefersReducedMotion(doc) || typeof page.animate !== "function") return;
  const animation = page.animate(
    [
      { opacity: 1, transform: "scale(1) translateY(0)" },
      { opacity: 0, transform: "scale(0.98) translateY(8px)" },
    ],
    { duration: 220, easing: EXIT_EASING, fill: "forwards" },
  );
  await animation.finished?.catch(() => {});
}
