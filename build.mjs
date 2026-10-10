// Build script: bundles the JS entry points declared in the manifest with esbuild,
// then copies the manifest and any static resources into the output directory.
// Usage: node build.mjs [outputDir]   (default: dist/)
import { build } from "esbuild";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(root, "src");
const outDir = path.resolve(root, process.argv[2] ?? "dist");

const manifest = JSON.parse(await readFile(path.join(srcDir, "manifest.json"), "utf8"));
// Single source of truth for the version: package.json (bump with `npm version`).
const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
manifest.version = pkg.version;

// JS entry points from the manifest; each output path mirrors its manifest path.
const entries = new Map();
entries.set(manifest.background.service_worker, manifest.background.service_worker);
for (const cs of manifest.content_scripts ?? []) {
  for (const file of cs.js ?? []) entries.set(file, file);
}
for (const file of ["options/options.js"]) {
  if (existsSync(path.join(srcDir, file))) entries.set(file, file);
}

// Static assets first, so bundled entry points can overwrite their sources.
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
for (const dir of ["_locales", "options", "icons"]) {
  const from = path.join(srcDir, dir);
  if (existsSync(from)) {
    await cp(from, path.join(outDir, dir), { recursive: true });
  }
}

for (const [entry, out] of entries) {
  await build({
    entryPoints: [path.join(srcDir, entry)],
    outfile: path.join(outDir, out),
    bundle: true,
    format: "iife",
    target: "chrome110",
    logLevel: "warning",
  });
}

console.log(`Build complete: ${outDir}`);
