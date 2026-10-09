import { expect, test, toggleReader } from "./fixtures.js";

async function configureProvider(context, extensionId, translateUrl) {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options/options.html`);
  await options.locator("[data-role='api-key']").fill("e2e-test-key");
  await options.locator("[data-role='endpoint-url']").fill(translateUrl);
  await options.locator("[data-role='endpoint-url']").dispatchEvent("change");
  await expect(options.locator("[data-role='status']")).toContainText("Saved");
  await options.close();
}

test("translates in place keeping media, then serves the translation from cache", async ({
  page,
  servers,
  context,
  extensionId,
}) => {
  await configureProvider(context, extensionId, servers.translateUrl);
  await page.goto(`${servers.baseUrl}/article-media.html`);
  await toggleReader(context);
  const overlay = page.locator("#reader-mode-ai-root");
  await expect(overlay).toHaveCount(1);

  await overlay.locator("[data-role='translate']").click();
  await expect(overlay.locator(".reader__content p").first()).toContainText("TR:", { timeout: 15_000 });

  // Media survives the full text replacement with its attributes intact.
  await expect(overlay.locator(".reader__content img")).toHaveCount(1);
  expect(await overlay.locator(".reader__content img").getAttribute("src")).toContain("chart.png");
  await expect(overlay.locator(".reader__content video")).toHaveCount(1);
  await expect(overlay.locator(".reader__content iframe")).toHaveCount(1);
  await expect(overlay.locator(".reader__content figcaption")).toContainText("TR:");
  await expect(overlay.locator("h1")).toContainText("TR:");
  expect(servers.stats.translateCalls).toBeGreaterThan(0);

  // Reopening the reader re-applies the cached translation automatically:
  // no click on Translate and zero API calls.
  const callsAfterFirst = servers.stats.translateCalls;
  await overlay.locator("[data-role='close']").click();
  await toggleReader(context);
  await expect(overlay).toHaveCount(1);
  await expect(overlay.locator(".reader__content p").first()).toContainText("TR:", { timeout: 15_000 });
  await expect(overlay.locator("h1")).toContainText("TR:");
  expect(servers.stats.translateCalls).toBe(callsAfterFirst);
});
