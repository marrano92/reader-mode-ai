import { describe, expect, it, vi } from "vitest";
import { createDeepLTranslator, DEFAULT_DEEPL_ENDPOINT } from "../../src/translators/deepl.js";
import { TranslationError } from "../../src/translators/base.js";

const ENDPOINT = "https://api.example.test/v2/translate";
const KEY = "k-test-secret";

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function makeTranslator(fetchImpl) {
  return createDeepLTranslator({ apiKey: KEY, endpointUrl: ENDPOINT, fetchFn: fetchImpl, sleep: async () => {} });
}

describe("createDeepLTranslator", () => {
  it("posts texts as HTML and returns translations in order", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse({ translations: [{ text: "<strong>Ciao</strong>" }, { text: "Mondo" }] }),
    );
    const translator = makeTranslator(fetchFn);
    const result = await translator.translateTexts(["<strong>Hello</strong>", "World"], "IT");
    expect(result).toEqual(["<strong>Ciao</strong>", "Mondo"]);

    expect(fetchFn).toHaveBeenCalledOnce();
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init.headers.Authorization).toBe(`DeepL-Auth-Key ${KEY}`);
    const params = new URLSearchParams(init.body);
    expect(params.getAll("text")).toEqual(["<strong>Hello</strong>", "World"]);
    expect(params.get("target_lang")).toBe("IT");
    expect(params.get("tag_handling")).toBe("html");
    expect(params.get("preserve_formatting")).toBe("1");
  });

  it("uses the Free endpoint by default", () => {
    expect(DEFAULT_DEEPL_ENDPOINT).toBe("https://api-free.deepl.com/v2/translate");
  });

  it("rejects with a clear code when the key is missing", async () => {
    const translator = createDeepLTranslator({ apiKey: "", endpointUrl: ENDPOINT, fetchFn: vi.fn() });
    await expect(translator.translateTexts(["hi"], "IT")).rejects.toMatchObject({
      name: "TranslationError",
      message: "missing_api_key",
    });
    expect(translator.id).toBe("deepl");
  });

  it("maps upstream errors to safe codes without leaking the key", async () => {
    const translator = makeTranslator(async () => jsonResponse({ message: "forbidden" }, 401));
    const error = await translator.translateTexts(["hi"], "IT").catch((err) => err);
    expect(error).toBeInstanceOf(TranslationError);
    expect(error.status).toBe(401);
    expect(error.retryable).toBe(false);
    expect(error.message).toBe("upstream_error_401");
    expect(error.message).not.toContain(KEY);
  });

  it("rejects malformed responses", async () => {
    const translator = makeTranslator(async () => jsonResponse({ translations: [{ text: "only one" }] }));
    await expect(translator.translateTexts(["a", "b"], "IT")).rejects.toMatchObject({
      message: "bad_response_shape",
    });
  });
});
