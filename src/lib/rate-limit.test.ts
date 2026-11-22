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

/**
 * What the queries now return: a count and the seconds Postgres says are
 * left. No timestamp crosses the driver, which is the point — the first
 * version compared a zone-less `windowEnd` against this process's clock, so
 * on a machine an hour off UTC every live window read as expired and nobody
 * was ever refused.
 */
const live = (count: number, retry_seconds = 3600) => [{ count, retry_seconds }];

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
    queryRaw.mockResolvedValue(live(2));
    expect(await peek(oneLimit)).toEqual({ ok: true });
  });

  it("refuses the attempt that would be one too many", async () => {
    queryRaw.mockResolvedValue(live(3));
    const verdict = await peek(oneLimit);
    expect(verdict.ok).toBe(false);
  });

  it("asks the database which windows are still live", async () => {
    // An expired row is still in the table — it is swept later, not on read
    // — so the query itself filters on `windowEnd > now()`, and no row means
    // no live window. Decided by one clock, the database's.
    const [sql] = queryRaw.mock.calls[0] ?? [[]];
    queryRaw.mockResolvedValue([]);
    await peek(oneLimit);
    const text = (queryRaw.mock.calls.at(-1)?.[0] as string[]).join("?");
    expect(text).toContain('"windowEnd" > now()');
    void sql;
  });

  it("refuses when any one of several limits is spent", async () => {
    queryRaw.mockResolvedValueOnce(live(0)).mockResolvedValueOnce(live(30));
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
    queryRaw.mockResolvedValue(live(3));
    expect(await consume(oneLimit)).toEqual({ ok: true });
  });

  it("refuses the one after that", async () => {
    queryRaw.mockResolvedValue(live(4));
    const verdict = await consume(oneLimit);
    expect(verdict.ok).toBe(false);
  });

  it("says how long to wait, rounded up and never zero", async () => {
    queryRaw.mockResolvedValue(live(4, 61));
    const verdict = await consume(oneLimit);
    if (verdict.ok) throw new Error("expected a refusal");
    expect(verdict.retryAfterMinutes).toBe(2);
    expect(verdict.retryAfterMs).toBe(61_000);

    queryRaw.mockResolvedValue(live(4, 1));
    const soon = await consume(oneLimit);
    if (soon.ok) throw new Error("expected a refusal");
    // "Try again in 0 minutes" next to a door that will not open reads as a
    // broken app.
    expect(soon.retryAfterMinutes).toBe(1);
  });

  it("counts against every limit, not only the first to fail", async () => {
    queryRaw.mockResolvedValue(live(1));
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
