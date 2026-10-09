// Reader toolbar: appearance controls, translation controls and close.
import { FONT_SIZE_MAX, FONT_SIZE_MIN, TARGET_LANGUAGES } from "../shared/settings.js";

export const LANGUAGE_LABELS = {
  EN: "English",
  IT: "Italiano",
  ES: "Español",
  FR: "Français",
  DE: "Deutsch",
};

export function buildToolbar({ doc, settings = {}, t = defaultT, handlers = {} }) {
  const el = doc.createElement("div");
  el.className = "reader__toolbar";

  const themeSelect = select(doc, [
    ["white", t("themeWhite")],
    ["sepia", t("themeSepia")],
    ["gray", t("themeGray")],
    ["dark", t("themeDark")],
  ]);
  themeSelect.dataset.role = "theme";

  const fontSelect = select(doc, [
    ["serif", t("fontSerif")],
    ["sans", t("fontSans")],
  ]);
  fontSelect.dataset.role = "font";

  const sizeDown = button(doc, "A−", t("sizeDown"));
  sizeDown.dataset.role = "size-down";
  const sizeUp = button(doc, "A+", t("sizeUp"));
  sizeUp.dataset.role = "size-up";

  const langSelect = select(
    doc,
    TARGET_LANGUAGES.map((code) => [code, LANGUAGE_LABELS[code] ?? code]),
  );
  langSelect.dataset.role = "lang";

  const translateButton = button(doc, t("translate"), t("translate"));
  translateButton.dataset.role = "translate";
  const cancelButton = button(doc, t("cancel"), t("cancel"));
  cancelButton.dataset.role = "cancel";
  cancelButton.hidden = true;

  const progress = doc.createElement("span");
  progress.className = "reader__progress";
  progress.dataset.role = "progress";

  const closeButton = button(doc, "\u00d7", t("closeReader"));
  closeButton.dataset.role = "close";

  el.append(
    themeSelect,
    fontSelect,
    sizeDown,
    sizeUp,
    langSelect,
    translateButton,
    cancelButton,
    progress,
    closeButton,
  );

  let charCount = 0;

  themeSelect.addEventListener("change", () => handlers.onSettingChange?.({ theme: themeSelect.value }));
  fontSelect.addEventListener("change", () => handlers.onSettingChange?.({ fontFamily: fontSelect.value }));
  sizeDown.addEventListener("click", () => changeSize(-1));
  sizeUp.addEventListener("click", () => changeSize(1));
  translateButton.addEventListener("click", () => handlers.onTranslate?.(langSelect.value));
  cancelButton.addEventListener("click", () => handlers.onCancelTranslate?.());
  closeButton.addEventListener("click", () => handlers.onClose?.());

  function changeSize(delta) {
    const current = Number(settings.fontSize) || DEFAULT_FONT_SIZE;
    const next = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, current + delta));
    if (next !== current) handlers.onSettingChange?.({ fontSize: next });
  }

  function renderLabel() {
    translateButton.textContent =
      charCount > 0 ? `${t("translate")} (${charCount.toLocaleString()})` : t("translate");
  }

  const api = {
    el,
    setSettings(next = {}) {
      Object.assign(settings, next);
      themeSelect.value = settings.theme ?? "white";
      fontSelect.value = settings.fontFamily ?? "serif";
      langSelect.value = settings.targetLang ?? "IT";
    },
    setBusy(busy) {
      translateButton.disabled = busy;
      cancelButton.hidden = !busy;
      if (!busy) progress.textContent = "";
    },
    setProgress(fraction) {
      progress.textContent =
        fraction === null || fraction === undefined ? "" : `${Math.round(fraction * 100)}%`;
    },
    setNotice(text) {
      progress.textContent = text;
    },
    setCharCount(count) {
      charCount = Number(count) || 0;
      renderLabel();
    },
  };
  api.setSettings(settings);
  renderLabel();
  return api;
}

const DEFAULT_FONT_SIZE = 20;

function select(doc, options) {
  const el = doc.createElement("select");
  for (const [value, label] of options) {
    const option = doc.createElement("option");
    option.value = value;
    option.textContent = label;
    el.append(option);
  }
  return el;
}

function button(doc, text, label) {
  const el = doc.createElement("button");
  el.type = "button";
  el.textContent = text;
  el.setAttribute("aria-label", label);
  return el;
}

function defaultT(key) {
  return globalThis.chrome?.i18n?.getMessage?.(key) || key;
}
