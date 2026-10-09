// Playwright fixtures: persistent Chromium context with the built extension
// loaded from dist/, plus the local stub server.
import { chromium, expect, test as base } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { startStubServer } from "./stub-server.mjs";

const distDir = path.resolve("dist");

export const test = base.extend({
  servers: async ({}, use) => {
    const server = await startStubServer();
    await use(server);
    await server.close();
  },
  context: async ({}, use) => {
    const userDataDir = mkdtempSync(path.join(tmpdir(), "reader-mode-ai-e2e-"));
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      channel: "chromium",
      args: [`--disable-extensions-except=${distDir}`, `--load-extension=${distDir}`],
    });
    await use(context);
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  },
  extensionId: async ({ context }, use) => {
    const sw = await getServiceWorker(context);
    await use(new URL(sw.url()).host);
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
    await page.close();
  },
});

export async function getServiceWorker(context) {
  const [existing] = context.serviceWorkers();
  if (existing) return existing;
  return context.waitForEvent("serviceworker", { timeout: 15_000 });
}

// Same code path as the toolbar button and the Alt+R command.
export async function toggleReader(context) {
  const sw = await getServiceWorker(context);
  await sw.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    await chrome.tabs.sendMessage(tab.id, { type: "toggle-reader" });
  });
}

export { expect };
