// In-reader translation pipeline: segments -> chunks -> provider -> in-place
// replacement. Full text replacement (decision D3): only text runs are swapped,
// media nodes keep their identity and position. Cancellation takes effect
// between chunks, so the current request always completes cleanly.
import { collectSegments, replaceSegmentHtml, splitIntoChunks } from "./chunker.js";

const DEFAULT_CHUNK_CHARS = 2000;

export async function translateArticle({
  root,
  targetLang,
  client,
  onProgress = () => {},
  signal,
  chunkChars = DEFAULT_CHUNK_CHARS,
}) {
  const segments = collectSegments(root);
  const totalChars = segments.reduce((n, segment) => n + segment.html.length, 0);
  const stats = { segments: segments.length, requests: 0, chars: totalChars };
  if (!totalChars) return stats;

  let done = 0;
  onProgress(0, totalChars);

  for (const chunk of splitIntoChunks(segments, chunkChars)) {
    throwIfAborted(signal);
    const translations = await client(chunk.texts, targetLang, { signal });
    if (!Array.isArray(translations) || translations.length !== chunk.texts.length) {
      throw new Error("bad_response_shape");
    }
    chunk.segments.forEach((segment, index) => replaceSegmentHtml(segment, translations[index]));
    stats.requests += 1;
    done += chunk.texts.reduce((n, text) => n + text.length, 0);
    onProgress(Math.min(1, done / totalChars), totalChars);
  }
  return stats;
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw new DOMException("translation aborted", "AbortError");
}
