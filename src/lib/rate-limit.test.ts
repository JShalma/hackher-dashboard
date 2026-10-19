import { describe, expect, it } from "vitest";

import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit inside the window", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const key = "submit:user_1";
    const t0 = 1_000_000;

    expect(limiter.check(key, t0).ok).toBe(true);
    expect(limiter.check(key, t0 + 1).ok).toBe(true);
    expect(limiter.check(key, t0 + 2).ok).toBe(true);

    const denied = limiter.check(key, t0 + 3);
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("isolates keys so one user cannot drain another", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    const t0 = 2_000_000;

    expect(limiter.check("submit:a", t0).ok).toBe(true);
    expect(limiter.check("submit:a", t0 + 1).ok).toBe(false);
    expect(limiter.check("submit:b", t0 + 2).ok).toBe(true);
  });

  it("allows more attempts after the window slides", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });
    const key = "submit:user_2";
    const t0 = 3_000_000;

    expect(limiter.check(key, t0).ok).toBe(true);
    expect(limiter.check(key, t0 + 500).ok).toBe(false);
    expect(limiter.check(key, t0 + 1_001).ok).toBe(true);
  });
});
