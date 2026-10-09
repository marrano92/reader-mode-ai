import { expect, test, toggleReader } from "./fixtures.js";

test("reader settings apply and persist across reopen", async ({ page, servers, context }) => {
  await page.goto(`${servers.baseUrl}/article-clean.html`);
  await toggleReader(context);
  const overlay = page.locator("#reader-mode-ai-root");
  await expect(overlay).toHaveCount(1);

  await overlay.locator("[data-role='theme']").selectOption("sepia");
  await overlay.locator("[data-role='font']").selectOption("sans");
  await overlay.locator("[data-role='size-up']").click();

  const styleText = () => overlay.evaluate((el) => el.shadowRoot.querySelector("style").textContent);
  await expect
    .poll(async () => {
      const css = await styleText();
      return css.includes("#f6ecd9") && css.includes("21px");
    })
    .toBe(true);

  await overlay.locator("[data-role='close']").click();
  await expect(overlay).toHaveCount(0);

  await toggleReader(context);
  await expect(overlay).toHaveCount(1);
  await expect(overlay.locator("[data-role='theme']")).toHaveValue("sepia");
  expect(await styleText()).toContain("#f6ecd9");
});

test("default translation language comes from the options page", async ({ page, servers, context, extensionId }) => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options/options.html`);
  await options.locator("[data-role='target-lang']").selectOption("DE");
  await expect(options.locator("[data-role='status']")).toContainText("Saved");
  await options.close();

  await page.goto(`${servers.baseUrl}/article-clean.html`);
  await toggleReader(context);
  await expect(page.locator("#reader-mode-ai-root [data-role='lang']")).toHaveValue("DE");
});
