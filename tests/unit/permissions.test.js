import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const manifest = JSON.parse(readFileSync(path.join(root, "src", "manifest.json"), "utf8"));

// The extension must never request more than this agreed allowlist.
const ALLOWED_PERMISSIONS = ["storage", "activeTab", "scripting"];
const ALLOWED_HOST_PERMISSIONS = ["https://api-free.deepl.com/*", "https://api.deepl.com/*"];

describe("manifest permissions", () => {
  it("requests no permission outside the allowlist", () => {
    for (const permission of manifest.permissions ?? []) {
      expect(ALLOWED_PERMISSIONS, `unexpected permission: ${permission}`).toContain(permission);
    }
  });

  it("limits host access to the DeepL API endpoints", () => {
    expect([...(manifest.host_permissions ?? [])].sort()).toEqual([...ALLOWED_HOST_PERMISSIONS].sort());
  });

  it("keeps content scripts on <all_urls> and nothing wider", () => {
    for (const cs of manifest.content_scripts ?? []) {
      expect(cs.matches).toEqual(["<all_urls>"]);
    }
  });

  it("has no remotely hosted code", () => {
    const serialized = JSON.stringify(manifest);
    expect(serialized).not.toContain('"http://');
    expect(serialized).not.toMatch(/content_security_policy.*https?:/);
  });
});
