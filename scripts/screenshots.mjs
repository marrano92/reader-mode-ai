// Captures README/store screenshots of the reader using the built extension.
// Run `npm run build` first: `npm run screenshots`
import { chromium } from "@playwright/test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { startStubServer } from "../tests/e2e/stub-server.mjs";

const distDir = path.resolve("dist");
const assetsDir = path.resolve("docs", "assets");
const THEMES = ["white", "sepia", "gray", "dark"];

const servers = await startStubServer();
const userDataDir = mkdtempSync(path.join(tmpdir(), "reader-mode-ai-shots-"));
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: true,
  channel: "chromium",
  viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${distDir}`, `--load-extension=${distDir}`],
});

try {
  const page = await context.newPage();
  await page.goto(`${servers.baseUrl}/article-media.html`);
  mkdirSync(assetsDir, { recursive: true });

  // "Before" shot: the original page, noise included.
  await page.screenshot({ path: path.join(assetsDir, "before-page.png") });

  // Same code path as the toolbar button and the Alt+R command.
  const worker = await (async () => {
    const [existing] = context.serviceWorkers();
    return existing ?? context.waitForEvent("serviceworker");
  })();
  await worker.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    await chrome.tabs.sendMessage(tab.id, { type: "toggle-reader" });
  });
  await page.waitForSelector("#reader-mode-ai-root .reader");

  for (const theme of THEMES) {
    await page.locator("#reader-mode-ai-root [data-role='theme']").selectOption(theme);
    await page.waitForTimeout(400); // let the theme transition settle
    await page.screenshot({ path: path.join(assetsDir, `reader-${theme}.png`) });
  }
  console.log(`Screenshots written to ${assetsDir}`);
} finally {
  await context.close();
  await servers.close();
  rmSync(userDataDir, { recursive: true, force: true });
}
