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
    setCharCount: (count) => toolbar.setCharCount(count),
    setSettings(next = {}) {
      Object.assign(current, next);
      style.textContent = readerCSS(current);
      toolbar.setSettings(current);
    },
    close() {
      abortController?.abort();
      host.remove();
      doc.documentElement.style.overflow = previousOverflow;
      onClose?.();
    },
  };
  handle.setSettings(current);
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
