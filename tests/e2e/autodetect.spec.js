import { expect, test } from "./fixtures.js";

test("marks article pages as readable for the badge", async ({ page, servers }) => {
  await page.goto(`${servers.baseUrl}/article-clean.html`);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.readerModeAiReady))
    .toBe("true");
});

test("leaves listing pages unmarked", async ({ page, servers }) => {
  await page.goto(`${servers.baseUrl}/listing.html`);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dataset.readerModeAiReady))
    .toBe("false");
});
