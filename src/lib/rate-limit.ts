export type RateLimitOk = { ok: true };
export type RateLimitDenied = { ok: false; retryAfterMs: number };
export type RateLimitResult = RateLimitOk | RateLimitDenied;

type RateLimiterOptions = {
  /** Max successful checks per key inside the window. */
  limit: number;
  /** Sliding window length in milliseconds. */
  windowMs: number;
};

/**
 * In-memory sliding-window limiter (per server instance).
 * Good enough to blunt submit spam on Preview/Hobby; swap for Redis if needed.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const hits = new Map<string, number[]>();

  return {
    check(key: string, now = Date.now()): RateLimitResult {
      const windowStart = now - options.windowMs;
      const prior = (hits.get(key) ?? []).filter((t) => t > windowStart);

      if (prior.length >= options.limit) {
        const oldest = prior[0] ?? now;
        hits.set(key, prior);
        return {
          ok: false,
          retryAfterMs: Math.max(0, oldest + options.windowMs - now),
        };
      }

      prior.push(now);
      hits.set(key, prior);
      return { ok: true };
    },

    reset() {
      hits.clear();
    },
  };
}

/** Application submit: 5 attempts / 10 minutes / Clerk user. */
export const submitApplicationLimiter = createRateLimiter({
  limit: 5,
  windowMs: 10 * 60 * 1000,
});
