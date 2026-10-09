// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildToolbar } from "../../src/content/toolbar-ui.js";
import { FONT_SIZE_MAX } from "../../src/shared/settings.js";

const t = (key) => key;

function setup(settings = { theme: "white", fontFamily: "serif", fontSize: 20, targetLang: "IT" }) {
  const handlers = {
    onSettingChange: vi.fn(),
    onTranslate: vi.fn(),
    onCancelTranslate: vi.fn(),
    onClose: vi.fn(),
  };
  const toolbar = buildToolbar({ doc: document, settings, t, handlers });
  document.body.innerHTML = "";
  document.body.append(toolbar.el);
  return { toolbar, handlers };
}

describe("buildToolbar", () => {
  it("reflects the current settings in the controls", () => {
    const { toolbar } = setup({ theme: "dark", fontFamily: "sans", fontSize: 22, targetLang: "DE" });
    expect(toolbar.el.querySelector("[data-role='theme']").value).toBe("dark");
    expect(toolbar.el.querySelector("[data-role='font']").value).toBe("sans");
    expect(toolbar.el.querySelector("[data-role='lang']").value).toBe("DE");
  });

  it("reports theme and font changes", () => {
    const { toolbar, handlers } = setup();
    const theme = toolbar.el.querySelector("[data-role='theme']");
    theme.value = "sepia";
    theme.dispatchEvent(new Event("change"));
    expect(handlers.onSettingChange).toHaveBeenCalledWith({ theme: "sepia" });

    const font = toolbar.el.querySelector("[data-role='font']");
    font.value = "sans";
    font.dispatchEvent(new Event("change"));
    expect(handlers.onSettingChange).toHaveBeenCalledWith({ fontFamily: "sans" });
  });

  it("steps the font size and clamps at the limits", () => {
    const { toolbar, handlers } = setup({ theme: "white", fontFamily: "serif", fontSize: FONT_SIZE_MAX, targetLang: "IT" });
    toolbar.el.querySelector("[data-role='size-up']").click();
    expect(handlers.onSettingChange).not.toHaveBeenCalled();
    toolbar.el.querySelector("[data-role='size-down']").click();
    expect(handlers.onSettingChange).toHaveBeenCalledWith({ fontSize: FONT_SIZE_MAX - 1 });
  });

  it("translates into the selected language", () => {
    const { toolbar, handlers } = setup();
    const lang = toolbar.el.querySelector("[data-role='lang']");
    lang.value = "DE";
    toolbar.el.querySelector("[data-role='translate']").click();
    expect(handlers.onTranslate).toHaveBeenCalledWith("DE");
  });

  it("wires cancel and close buttons", () => {
    const { toolbar, handlers } = setup();
    toolbar.el.querySelector("[data-role='cancel']").click();
    toolbar.el.querySelector("[data-role='close']").click();
    expect(handlers.onCancelTranslate).toHaveBeenCalledOnce();
    expect(handlers.onClose).toHaveBeenCalledOnce();
  });

  it("toggles busy state and progress feedback", () => {
    const { toolbar } = setup();
    const translate = toolbar.el.querySelector("[data-role='translate']");
    const cancel = toolbar.el.querySelector("[data-role='cancel']");
    toolbar.setBusy(true);
    expect(translate.disabled).toBe(true);
    expect(cancel.hidden).toBe(false);
    toolbar.setProgress(0.5);
    expect(toolbar.el.querySelector("[data-role='progress']").textContent).toBe("50%");
    toolbar.setBusy(false);
    expect(translate.disabled).toBe(false);
    expect(cancel.hidden).toBe(true);
    expect(toolbar.el.querySelector("[data-role='progress']").textContent).toBe("");
  });

  it("shows the character count on the translate button", () => {
    const { toolbar } = setup();
    const translate = toolbar.el.querySelector("[data-role='translate']");
    toolbar.setCharCount(1234);
    expect(translate.textContent).toContain("translate");
    expect(translate.textContent).toContain("1");
    expect(translate.textContent).toContain("234");
  });
});
