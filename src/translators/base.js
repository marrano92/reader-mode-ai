// Shared translation plumbing: typed errors and retry with exponential backoff.
// Error messages are stable codes: they never echo secrets back to the UI.
export class TranslationError extends Error {
  constructor(message, { status = 0, retryable = false } = {}) {
    super(message);
    this.name = "TranslationError";
    this.status = status;
    this.retryable = retryable;
  }
}

export async function requestWithRetry(doFetch, { retries = 3, backoffMs = 400, sleep = defaultSleep, signal } = {}) {
  let attempt = 0;
  for (;;) {
    try {
      const response = await doFetch(signal);
      if (response.status === 429 || response.status >= 500) {
        throw new TranslationError(`upstream_error_${response.status}`, {
          status: response.status,
          retryable: true,
        });
      }
      if (!response.ok) {
        throw new TranslationError(`upstream_error_${response.status}`, { status: response.status });
      }
      return response;
    } catch (err) {
      const wrapped =
        err instanceof TranslationError ? err : new TranslationError("network_error", { retryable: true });
      const canRetry = wrapped.retryable && attempt < retries && !signal?.aborted;
      if (!canRetry) throw wrapped;
      await sleep(backoffMs * 2 ** attempt, signal);
      attempt += 1;
    }
  }
}

export function defaultSleep(ms, signal) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener?.("abort", () => {
      clearTimeout(timer);
      resolve();
    }, { once: true });
  });
}
