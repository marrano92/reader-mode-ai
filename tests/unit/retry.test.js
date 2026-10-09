import { describe, expect, it, vi } from "vitest";
import { requestWithRetry, TranslationError } from "../../src/translators/base.js";

function response(status) {
  return { ok: status >= 200 && status < 300, status };
}

describe("requestWithRetry", () => {
  it("retries after 429 with exponential backoff", async () => {
    const sleep = vi.fn(async () => {});
    const calls = [];
    const doFetch = vi.fn(async () => {
      calls.push(calls.length);
      return calls.length < 3 ? response(429) : response(200);
    });
    const result = await requestWithRetry(doFetch, { sleep });
    expect(result.status).toBe(200);
    expect(doFetch).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([400, 800]);
  });

  it("retries server errors too", async () => {
    const sleep = vi.fn(async () => {});
    let call = 0;
    const doFetch = async () => (++call === 1 ? response(503) : response(200));
    await expect(requestWithRetry(doFetch, { sleep })).resolves.toMatchObject({ status: 200 });
    expect(sleep).toHaveBeenCalledOnce();
  });

  it("gives up after exhausting retries", async () => {
    const sleep = vi.fn(async () => {});
    const doFetch = vi.fn(async () => response(429));
    const error = await requestWithRetry(doFetch, { sleep, retries: 2 }).catch((err) => err);
    expect(error).toBeInstanceOf(TranslationError);
    expect(error.message).toBe("upstream_error_429");
    expect(error.retryable).toBe(true);
    expect(doFetch).toHaveBeenCalledTimes(3); // 1 try + 2 retries
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable errors", async () => {
    const sleep = vi.fn(async () => {});
    const doFetch = vi.fn(async () => response(401));
    const error = await requestWithRetry(doFetch, { sleep }).catch((err) => err);
    expect(error.message).toBe("upstream_error_401");
    expect(doFetch).toHaveBeenCalledOnce();
    expect(sleep).not.toHaveBeenCalled();
  });

  it("wraps network failures as retryable", async () => {
    const sleep = vi.fn(async () => {});
    let call = 0;
    const doFetch = async () => {
      if (++call === 1) throw new Error("net down");
      return response(200);
    };
    await expect(requestWithRetry(doFetch, { sleep })).resolves.toMatchObject({ status: 200 });
  });

  it("stops immediately when the signal is aborted", async () => {
    const sleep = vi.fn(async () => {});
    const doFetch = vi.fn(async () => response(429));
    const error = await requestWithRetry(doFetch, { sleep, signal: { aborted: true } }).catch((err) => err);
    expect(error.message).toBe("upstream_error_429");
    expect(doFetch).toHaveBeenCalledOnce();
    expect(sleep).not.toHaveBeenCalled();
  });
});
