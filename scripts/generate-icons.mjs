// Generates the extension icon set by rendering an SVG with headless Chromium.
// Placeholder-quality assets: replace the SVG below for a final design.
// Usage: npm run generate-icons
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const outDir = path.resolve("src", "icons");
const SIZES = [16, 32, 48, 128];

// Rounded square, indigo gradient, four text lines and a spark for the AI bit.
const svg = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/>
      <stop offset="1" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#g)"/>
  <rect x="28" y="32" width="72" height="11" rx="5.5" fill="#ffffff"/>
  <rect x="28" y="52" width="72" height="11" rx="5.5" fill="#ffffff" opacity="0.85"/>
  <rect x="28" y="72" width="48" height="11" rx="5.5" fill="#ffffff" opacity="0.7"/>
  <rect x="28" y="92" width="52" height="11" rx="5.5" fill="#ffffff" opacity="0.55"/>
  <path d="M102 84 C 103.5 93 107 96.5 116 98 C 107 99.5 103.5 103 102 112 C 100.5 103 97 99.5 88 98 C 97 96.5 100.5 93 102 84 Z" fill="#ffffff"/>
</svg>`;

const browser = await chromium.launch();
try {
  mkdirSync(outDir, { recursive: true });
  for (const size of SIZES) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<html><body style="margin:0">${svg(size)}</body></html>`);
    await page.screenshot({ path: path.join(outDir, `icon-${size}.png`) });
    await page.close();
    console.log(`icon-${size}.png`);
  }
} finally {
  await browser.close();
}
