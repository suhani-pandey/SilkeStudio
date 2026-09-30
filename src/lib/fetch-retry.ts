/**
 * fetch() with retries, for sending confirmations.
 *
 * Retries only failures that can clear up on their own: the network dropping, a request timing
 * out, the provider having a bad moment (5xx) or asking us to slow down (429). A 4xx such as a
 * rejected number is permanent, so it isn't retried.
 *
 * The customer is waiting on the booking screen while this runs, so the whole thing is held to a
 * time budget rather than retrying indefinitely.
 */
export interface RetryOptions {
  attempts?: number;
  timeoutMs?: number;
  /** Wait before each retry; the last value repeats if there are more retries than entries. */
  backoffMs?: number[];
  /** Give up once this much time has gone, even with attempts left. */
  budgetMs?: number;
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  { attempts = 3, timeoutMs = 3000, backoffMs = [300, 900], budgetMs = 6000 }: RetryOptions = {},
): Promise<Response> {
  const started = Date.now();
  let lastError: unknown;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      const wait = backoffMs[Math.min(attempt - 1, backoffMs.length - 1)] ?? 0;
      if (Date.now() - started + wait >= budgetMs) break;
      await sleep(wait);
    }

    try {
      const remaining = budgetMs - (Date.now() - started);
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(Math.max(1, Math.min(timeoutMs, remaining))),
      });
      if (!isRetryableStatus(response.status)) return response;
      lastResponse = response;
    } catch (error) {
      lastError = error;
    }
  }

  // Whether attempts or time ran out, a server that answered is reported as it answered, so the
  // caller can log its body. Only a request that never got a response at all throws.
  if (lastResponse) return lastResponse;
  throw lastError ?? new Error("Request failed");
}
