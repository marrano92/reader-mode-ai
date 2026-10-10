// Generates the optional store promo tiles (440x280 and 1400x560) by rendering
// an HTML composition with headless Chromium. Usage: npm run generate-promo
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const assetsDir = path.resolve("docs", "assets");
const icon = `data:image/png;base64,${readFileSync(path.resolve("src", "icons", "icon-128.png")).toString("base64")}`;
const shot = `data:image/png;base64,${readFileSync(path.join(assetsDir, "reader-sepia.png")).toString("base64")}`;

const html = (w, h) => `
<html><body style="margin:0">
<div style="width:${w}px;height:${h}px;display:flex;overflow:hidden;
  background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);
  font-family:-apple-system,'Helvetica Neue',system-ui,sans-serif;color:#fff">
  <div style="flex:1.15;display:flex;flex-direction:column;justify-content:center;gap:${h * 0.05}px;padding:0 ${w * 0.06}px">
    <div style="display:flex;align-items:center;gap:${w * 0.035}px">
      <img src="${icon}" style="width:${h * 0.2}px;height:${h * 0.2}px;border-radius:${h * 0.045}px">
      <div style="font-size:${h * 0.095}px;font-weight:700;letter-spacing:-1px;white-space:nowrap">Reader Mode AI</div>
    </div>
    <div style="font-size:${h * 0.072}px;opacity:0.95;line-height:1.35">Read &amp; translate the web,<br>distraction-free.</div>
    <div style="font-size:${h * 0.045}px;opacity:0.75;white-space:nowrap">Elegant reader mode · DeepL translation · Open source</div>
  </div>
  <div style="width:44%;background-image:url(${shot});background-size:cover;background-position:left top;
    box-shadow:inset ${w * 0.06}px 0 ${w * 0.06}px -${w * 0.03}px rgba(79,70,229,0.9)"></div>
</div>
</body></html>`;

const browser = await chromium.launch();
try {
  for (const [name, w, h] of [
    ["promo-small.png", 440, 280],
    ["promo-featured.png", 1400, 560],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.setContent(html(w, h));
    await page.screenshot({ path: path.join(assetsDir, name) });
    await page.close();
    console.log(`${name} (${w}x${h})`);
  }
} finally {
  await browser.close();
}
