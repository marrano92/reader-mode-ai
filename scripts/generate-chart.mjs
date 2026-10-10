// Renders the chart image used by the demo news fixture. Usage: npm run generate-chart
import { chromium } from "@playwright/test";
import path from "node:path";

const values = [
  ["N. America", 82],
  ["Europe", 64],
  ["Asia", 95],
  ["LatAm", 71],
  ["MEA", 88],
];

const bars = values
  .map(([label, value], i) => {
    const x = 86 + i * 128;
    const height = value * 2.9;
    const y = 356 - height;
    return `
      <rect x="${x}" y="${y}" width="72" height="${height}" fill="#4f46e5" opacity="${0.55 + i * 0.1}"/>
      <text x="${x + 36}" y="${y - 10}" text-anchor="middle" font-family="Helvetica" font-size="15" font-weight="bold" fill="#1b1b1b">${value}</text>
      <text x="${x + 36}" y="382" text-anchor="middle" font-family="Helvetica" font-size="13" fill="#6b6b6b">${label}</text>`;
  })
  .join("");

const svg = `
<svg width="720" height="420" xmlns="http://www.w3.org/2000/svg">
  <rect width="720" height="420" fill="#ffffff"/>
  <text x="32" y="42" font-family="Helvetica" font-size="21" font-weight="bold" fill="#1b1b1b">Quarterly index by region</text>
  <text x="32" y="66" font-family="Helvetica" font-size="13" fill="#6b6b6b">Order volume, rebased (2025 Q1 = 50)</text>
  <line x1="54" y1="356" x2="688" y2="356" stroke="#d9d9d9" stroke-width="1"/>
  <line x1="54" y1="238" x2="688" y2="238" stroke="#ececec" stroke-width="1"/>
  <line x1="54" y1="120" x2="688" y2="120" stroke="#ececec" stroke-width="1"/>
  ${bars}
</svg>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 720, height: 420 } });
  await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({ path: path.resolve("tests", "fixtures", "chart.png") });
  console.log("tests/fixtures/chart.png (720x420)");
} finally {
  await browser.close();
}
