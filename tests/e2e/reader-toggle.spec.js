import { expect, test, toggleReader } from "./fixtures.js";

test("toggles the reader overlay and restores the page", async ({ page, servers, context }) => {
  await page.goto(`${servers.baseUrl}/article-clean.html`);

  await toggleReader(context);
  const overlay = page.locator("#reader-mode-ai-root");
  await expect(overlay).toHaveCount(1);
  const title = await overlay.evaluate((el) => el.shadowRoot.querySelector("h1").textContent);
  expect(title).toContain("Clean Article");

  await toggleReader(context);
  await expect(overlay).toHaveCount(0);
  const originalTitle = await page.evaluate(() => document.querySelector("article h1").textContent);
  expect(originalTitle).toContain("Clean Article");
});

test("shows a toast when the page has no article", async ({ page, servers, context }) => {
  await page.goto(`${servers.baseUrl}/listing.html`);
  await toggleReader(context);
  await expect(page.locator("#reader-mode-ai-root")).toHaveCount(0);
  await expect(page.getByText("no article")).toBeVisible();
});
