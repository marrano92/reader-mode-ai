// Reader styles for the shadow DOM: Safari-like typography and color themes.
export const THEMES = {
  white: { bg: "#fdfdfd", fg: "#1f2023", muted: "#8a8a8e", line: "#e6e6ea" },
  sepia: { bg: "#f6ecd9", fg: "#5b4636", muted: "#9c8a74", line: "#e3d5bc" },
  gray: { bg: "#8e9299", fg: "#f6f6f8", muted: "#d3d5da", line: "#7f848c" },
  dark: { bg: "#1f2023", fg: "#e5e5e7", muted: "#98989d", line: "#3a3a3f" },
};

export const FONTS = {
  serif: `"New York", "Iowan Old Style", Georgia, "Times New Roman", serif`,
  sans: `-apple-system, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif`,
};

export const DEFAULT_TYPOGRAPHY = { theme: "white", fontFamily: "serif", fontSize: 20 };

export function readerCSS(settings = {}) {
  const theme = THEMES[settings.theme] ?? THEMES[DEFAULT_TYPOGRAPHY.theme];
  const font = FONTS[settings.fontFamily] ?? FONTS[DEFAULT_TYPOGRAPHY.fontFamily];
  const size = Number.isFinite(settings.fontSize) ? settings.fontSize : DEFAULT_TYPOGRAPHY.fontSize;

  return `
:host { all: initial; }
* { box-sizing: border-box; }
.reader {
  position: fixed; inset: 0; z-index: 2147483647;
  overflow-y: auto;
  background: ${theme.bg}; color: ${theme.fg};
  font-family: ${font}; font-size: ${size}px; line-height: 1.5;
}
.reader__inner { max-width: 36em; margin: 0 auto; padding: 1.25em 1.25em 6em; }
.reader__toolbar {
  position: sticky; top: 0; z-index: 1;
  display: flex; flex-wrap: wrap; gap: 0.5em; align-items: center;
  padding: 0.6em 0; margin-bottom: 2em;
  background: ${theme.bg}; border-bottom: 1px solid ${theme.line};
  font-size: 0.85em;
}
.reader__toolbar select, .reader__toolbar button {
  font: inherit; color: ${theme.fg}; background: transparent;
  border: 1px solid ${theme.line}; border-radius: 6px;
  padding: 0.25em 0.6em; cursor: pointer;
}
.reader__toolbar button[disabled] { opacity: 0.5; cursor: default; }
.reader__progress { color: ${theme.muted}; margin-left: auto; }
.reader__header { margin-bottom: 2em; }
.reader__header h1 { font-size: 2em; line-height: 1.2; font-weight: 700; margin: 0 0 0.4em; }
.reader__byline { color: ${theme.muted}; font-size: 0.95em; margin: 0; }
.reader__content p, .reader__content ul, .reader__content ol,
.reader__content blockquote, .reader__content figure, .reader__content pre { margin: 1em 0; }
.reader__content h2, .reader__content h3 { line-height: 1.25; margin: 1.6em 0 0.6em; }
.reader__content img, .reader__content video, .reader__content iframe { max-width: 100%; height: auto; }
.reader__content figure { margin: 1.5em 0; text-align: center; }
.reader__content figcaption { color: ${theme.muted}; font-size: 0.9em; margin-top: 0.5em; }
.reader__content blockquote { border-left: 3px solid ${theme.line}; padding-left: 1em; color: ${theme.muted}; }
.reader__content a { color: inherit; }
.reader__content hr { border: 0; border-top: 1px solid ${theme.line}; }
`;
}
