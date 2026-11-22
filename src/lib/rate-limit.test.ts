import { beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
const executeRaw = vi.fn();
const headerBag = new Map<string, string>();

vi.mock("@/lib/db", () => ({
  prisma: { $queryRaw: queryRaw, $executeRaw: executeRaw },
}));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (k: string) => headerBag.get(k) ?? null }),
}));

const { callerAddress, consume, limits, peek, MINUTE, HOUR } = await import(
  "@/lib/rate-limit"
);

const inAnHour = () => new Date(Date.now() + HOUR);
const anHourAgo = () => new Date(Date.now() - HOUR);

const oneLimit = [
  { bucket: "signin:email", subject: "a@b.com", max: 3, windowMs: 15 * MINUTE },
];

describe("peek — what is already on the record", () => {
  beforeEach(() => {
    queryRaw.mockReset();
    executeRaw.mockReset();
  });

  it("allows a caller nobody has seen", async () => {
    queryRaw.mockResolvedValue([]);
    expect(await peek(oneLimit)).toEqual({ ok: true });
  });

  it("allows a caller under the ceiling", async () => {
    queryRaw.mockResolvedValue([{ count: 2, windowEnd: inAnHour() }]);
    expect(await peek(oneLimit)).toEqual({ ok: true });
  });

  it("refuses the attempt that would be one too many", async () => {
    queryRaw.mockResolvedValue([{ count: 3, windowEnd: inAnHour() }]);
    const verdict = await peek(oneLimit);
    expect(verdict.ok).toBe(false);
  });

  it("ignores a window that has already run out", async () => {
    // The row is still there — it is swept later, not on read — so a window
    // in the past has to read as no window at all, or a caller who hit the
    // limit once is locked out until the housekeeping runs.
    queryRaw.mockResolvedValue([{ count: 99, windowEnd: anHourAgo() }]);
    expect(await peek(oneLimit)).toEqual({ ok: true });
  });

  it("refuses when any one of several limits is spent", async () => {
    queryRaw
      .mockResolvedValueOnce([{ count: 0, windowEnd: inAnHour() }])
      .mockResolvedValueOnce([{ count: 30, windowEnd: inAnHour() }]);
    const verdict = await peek(limits.signIn("a@b.com", "1.2.3.4"));
    expect(verdict.ok).toBe(false);
  });
});

describe("consume — counting the attempt", () => {
  beforeEach(() => {
    queryRaw.mockReset();
    executeRaw.mockReset();
  });

  it("allows the attempt that reaches the ceiling exactly", async () => {
    // max: 3 means three attempts are allowed, so the third is fine.
    queryRaw.mockResolvedValue([{ count: 3, windowEnd: inAnHour() }]);
    expect(await consume(oneLimit)).toEqual({ ok: true });
  });

  it("refuses the one after that", async () => {
    queryRaw.mockResolvedValue([{ count: 4, windowEnd: inAnHour() }]);
    const verdict = await consume(oneLimit);
    expect(verdict.ok).toBe(false);
  });

  it("says how long to wait, rounded up and never zero", async () => {
    queryRaw.mockResolvedValue([
      { count: 4, windowEnd: new Date(Date.now() + 61_000) },
    ]);
    const verdict = await consume(oneLimit);
    if (verdict.ok) throw new Error("expected a refusal");
    expect(verdict.retryAfterMinutes).toBe(2);

    queryRaw.mockResolvedValue([
      { count: 4, windowEnd: new Date(Date.now() + 1_000) },
    ]);
    const soon = await consume(oneLimit);
    if (soon.ok) throw new Error("expected a refusal");
    // "Try again in 0 minutes" next to a door that will not open reads as a
    // broken app.
    expect(soon.retryAfterMinutes).toBe(1);
  });

  it("counts against every limit, not only the first to fail", async () => {
    queryRaw.mockResolvedValue([{ count: 1, windowEnd: inAnHour() }]);
    await consume(limits.signIn("a@b.com", "1.2.3.4"));
    expect(queryRaw).toHaveBeenCalledTimes(2);
  });
});

describe("when the counting itself breaks", () => {
  beforeEach(() => {
    queryRaw.mockReset();
    executeRaw.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("lets the caller through rather than closing the door", async () => {
    // The table not existing yet — a deploy that landed before its
    // migration — must not be an outage of the sign-in form.
    queryRaw.mockRejectedValue(new Error('relation "RateLimit" does not exist'));

    expect(await peek(oneLimit)).toEqual({ ok: true });
    expect(await consume(oneLimit)).toEqual({ ok: true });
    expect(console.error).toHaveBeenCalled();
  });
});

describe("callerAddress", () => {
  beforeEach(() => headerBag.clear());

  it("takes the address the platform saw, not the one the client sent", async () => {
    // Proxies append, so the first entry is Vercel's and anything a client
    // puts in the header of its own lands after it.
    headerBag.set("x-forwarded-for", "203.0.113.5, 10.0.0.1, 127.0.0.1");
    expect(await callerAddress()).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip", async () => {
    headerBag.set("x-real-ip", "203.0.113.9");
    expect(await callerAddress()).toBe("203.0.113.9");
  });

  it("puts callers with no address in one bucket, not one each", async () => {
    expect(await callerAddress()).toBe("unknown");
  });
});

describe("the policy", () => {
  it("limits a sign-in by both the account and the machine", () => {
    const pair = limits.signIn("A@B.com", "1.2.3.4");
    expect(pair).toHaveLength(2);
    expect(pair.map((l) => l.bucket)).toEqual(["signin:email", "signin:addr"]);
  });

  it("keeps the letter-sending ceilings low", () => {
    for (const limit of limits.passwordReset("a@b.com", "1.2.3.4")) {
      expect(limit.max).toBeLessThanOrEqual(10);
      expect(limit.windowMs).toBeGreaterThanOrEqual(HOUR);
    }
  });
});
