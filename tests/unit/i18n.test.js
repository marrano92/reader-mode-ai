import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

function loadJSON(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), "utf8"));
}

describe("localization", () => {
  const en = loadJSON("src/_locales/en/messages.json");
  const it = loadJSON("src/_locales/it/messages.json");

  it("defines the same keys in every locale", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(it).sort());
  });

  it("has a non-empty message for every key", () => {
    for (const [key, entry] of Object.entries(en)) {
      expect(typeof entry.message, `en/${key}`).toBe("string");
      expect(entry.message.length, `en/${key}`).toBeGreaterThan(0);
      expect(it[key].message.length, `it/${key}`).toBeGreaterThan(0);
    }
  });

  it("covers every __MSG_ key referenced by the manifest", () => {
    const manifest = readFileSync(path.join(root, "src", "manifest.json"), "utf8");
    const referenced = [...manifest.matchAll(/__MSG_(\w+)__/g)].map((match) => match[1]);
    expect(referenced.length).toBeGreaterThan(0);
    for (const key of referenced) {
      expect(en[key], `missing en/${key}`).toBeTruthy();
      expect(it[key], `missing it/${key}`).toBeTruthy();
    }
  });
});
