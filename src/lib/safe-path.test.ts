import { describe, expect, it } from "vitest";

import { safePath } from "@/lib/safe-path";

describe("safePath", () => {
  it("keeps a page inside this app", () => {
    expect(safePath("/clubs/abc123")).toBe("/clubs/abc123");
    expect(safePath("/clubs/abc123/join")).toBe("/clubs/abc123/join");
    expect(safePath("/books?shelf=READ")).toBe("/books?shelf=READ");
  });

  it("refuses another origin dressed as a path", () => {
    // The one that matters: the browser reads this as a protocol-relative
    // URL and leaves the site, while the string looks like a path.
    expect(safePath("//evil.example/phish")).toBeNull();
    expect(safePath("/\\evil.example")).toBeNull();
    expect(safePath("/clubs\\..\\..")).toBeNull();
  });

  it("refuses anything that isn't a path at all", () => {
    expect(safePath("https://evil.example")).toBeNull();
    expect(safePath("javascript:alert(1)")).toBeNull();
    expect(safePath("clubs/abc")).toBeNull();
    expect(safePath("")).toBeNull();
    expect(safePath(undefined)).toBeNull();
    expect(safePath(null)).toBeNull();
    expect(safePath(42)).toBeNull();
  });

  it("refuses the API, which is not a page to land on", () => {
    expect(safePath("/api/auth/signout")).toBeNull();
  });
});
