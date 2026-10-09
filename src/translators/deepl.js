// DeepL API adapter (Free tier by default). Provider-agnostic interface:
// translateTexts(texts, targetLang) -> translated texts in the same order.
// Texts are HTML fragments; tag_handling keeps inline markup intact.
import { requestWithRetry, TranslationError } from "./base.js";

export const DEFAULT_DEEPL_ENDPOINT = "https://api-free.deepl.com/v2/translate";

export function createDeepLTranslator({
  apiKey,
  endpointUrl = DEFAULT_DEEPL_ENDPOINT,
  fetchFn = globalThis.fetch,
  sleep,
} = {}) {
  return {
    id: "deepl",
    async translateTexts(texts, targetLang, { signal } = {}) {
      if (!apiKey) throw new TranslationError("missing_api_key");
      if (!Array.isArray(texts) || texts.length === 0) return [];

      const body = new URLSearchParams();
      for (const text of texts) body.append("text", text);
      body.append("target_lang", targetLang);
      body.append("tag_handling", "html");
      body.append("preserve_formatting", "1");

      const response = await requestWithRetry(
        (sig) =>
          fetchFn(endpointUrl, {
            method: "POST",
            headers: {
              Authorization: `DeepL-Auth-Key ${apiKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
            signal: sig,
          }),
        { sleep, signal },
      );

      const data = await response.json();
      const translations = (data?.translations ?? []).map((entry) => entry.text);
      if (translations.length !== texts.length) throw new TranslationError("bad_response_shape");
      return translations;
    },
  };
}
