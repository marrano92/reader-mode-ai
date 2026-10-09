// Packages dist/ into a store-ready zip. Usage: npm run zip
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");

if (!existsSync(path.join(distDir, "manifest.json"))) {
  console.error("dist/ is missing: run `npm run build` first.");
  process.exit(1);
}

const { version } = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const out = path.join(root, `reader-mode-ai-v${version}.zip`);
execFileSync("zip", ["-r", "-q", out, "."], { cwd: distDir });
console.log(`Created ${out}`);
