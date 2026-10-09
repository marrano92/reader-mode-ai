import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const manifestPath = path.join(root, "src", "manifest.json");

// The manifest is the single source of truth for entry points and permissions.
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

describe("manifest", () => {
  it("is a valid MV3 manifest", () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe("__MSG_extName__");
    expect(manifest.default_locale).toBe("en");
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("declares only the allowed permissions", () => {
    expect(manifest.permissions ?? []).toEqual(["storage"]);
  });

  it("declares entry points that exist in src/", () => {
    const entryPoints = [manifest.background?.service_worker];
    for (const cs of manifest.content_scripts ?? []) {
      entryPoints.push(...(cs.js ?? []));
    }
    expect(entryPoints.length).toBeGreaterThan(0);
    for (const entry of entryPoints) {
      expect(existsSync(path.join(root, "src", entry)), `missing src/${entry}`).toBe(true);
    }
  });

  it("declares the reader toggle command with a shortcut", () => {
    expect(manifest.commands?.["toggle-reader"]?.suggested_key?.default).toBe("Alt+R");
    expect(manifest.commands["toggle-reader"].description).toBeTruthy();
  });
});

describe("build", () => {
  let out;

  beforeAll(() => {
    out = mkdtempSync(path.join(tmpdir(), "reader-mode-ai-build-"));
    execFileSync("node", ["build.mjs", out], { cwd: root, timeout: 60_000 });
  }, 60_000);

  afterAll(() => {
    rmSync(out, { recursive: true, force: true });
  });

  it("emits every manifest entry point", () => {
    const entryPoints = [manifest.background.service_worker];
    for (const cs of manifest.content_scripts ?? []) {
      entryPoints.push(...(cs.js ?? []));
    }
    for (const entry of entryPoints) {
      expect(existsSync(path.join(out, entry)), `missing dist/${entry}`).toBe(true);
    }
  });

  it("copies the manifest unchanged", () => {
    const built = JSON.parse(readFileSync(path.join(out, "manifest.json"), "utf8"));
    expect(built).toEqual(manifest);
  });

  it("bundles the content script with its marker string", () => {
    const content = readFileSync(path.join(out, "content", "content.js"), "utf8");
    expect(content).toContain("reader-mode-ai");
  });
});
