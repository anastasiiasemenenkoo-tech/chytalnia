import { describe, expect, it } from "vitest";

import { impressum } from "@/content/impressum";
import type { LegalDocument } from "@/content/legal-types";
import { privacyPolicy } from "@/content/privacy";

/**
 * These two documents are the ones a reader is told to rely on, so the two
 * locales have to say the same things. The Ukrainian one is what gets
 * written first and the English one is what gets forgotten — this is what
 * notices that.
 */
const documents: Array<[string, Record<"uk" | "en", LegalDocument>]> = [
  ["impressum", impressum],
  ["privacy policy", privacyPolicy],
];

describe.each(documents)("%s", (_name, doc) => {
  it("has the same sections in both locales, in the same order", () => {
    expect(doc.en.sections.map((s) => s.id)).toEqual(
      doc.uk.sections.map((s) => s.id),
    );
  });

  it("has the same kinds of block in each section", () => {
    for (const [i, uk] of doc.uk.sections.entries()) {
      const en = doc.en.sections[i];
      expect(en.blocks.map((b) => b.kind), `section ${uk.id}`).toEqual(
        uk.blocks.map((b) => b.kind),
      );
    }
  });

  it("leaves nothing empty", () => {
    for (const locale of ["uk", "en"] as const) {
      const d = doc[locale];
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.lead.length).toBeGreaterThan(0);
      expect(d.sections.length).toBeGreaterThan(0);
      for (const section of d.sections) {
        expect(section.heading.length, `${locale} ${section.id}`).toBeGreaterThan(0);
        expect(section.blocks.length, `${locale} ${section.id}`).toBeGreaterThan(0);
        for (const block of section.blocks) {
          if (block.kind === "text" || block.kind === "todo") {
            expect(block.text.length).toBeGreaterThan(0);
          } else if (block.kind === "list") {
            expect(block.items.length).toBeGreaterThan(0);
            for (const item of block.items) expect(item.length).toBeGreaterThan(0);
          } else {
            expect(block.pairs.length).toBeGreaterThan(0);
            for (const pair of block.pairs) {
              expect(pair.term.length).toBeGreaterThan(0);
              expect(pair.detail.length).toBeGreaterThan(0);
            }
          }
        }
      }
    }
  });

  it("carries a date that parses", () => {
    for (const locale of ["uk", "en"] as const) {
      expect(Number.isNaN(new Date(doc[locale].updated).getTime())).toBe(false);
    }
  });
});

describe("the privacy policy", () => {
  it("names every service that receives data", () => {
    // If a processor is added to the app and not to this list, the policy is
    // wrong in the way that actually matters.
    const text = JSON.stringify(privacyPolicy).toLowerCase();
    for (const service of [
      "neon",
      "vercel",
      "resend",
      "google",
      "open library",
      "wikidata",
    ]) {
      expect(text, service).toContain(service);
    }
  });

  it("says where the data physically is", () => {
    const text = JSON.stringify(privacyPolicy);
    expect(text).toContain("us-east-2");
  });

  it("tells readers what others can see about them", () => {
    for (const locale of ["uk", "en"] as const) {
      expect(
        privacyPolicy[locale].sections.map((s) => s.id),
      ).toContain("visible");
    }
  });
});

describe("the impressum", () => {
  // This page used to assert the opposite — that its blanks were still
  // marked — while the name and address were missing. They are filled in
  // now, so the test turns around: the page must stay finished.
  it("has nothing left to fill in", () => {
    for (const locale of ["uk", "en"] as const) {
      const todos = impressum[locale].sections
        .flatMap((s) => s.blocks)
        .filter((b) => b.kind === "todo");
      expect(todos, `${locale} impressum`).toEqual([]);
    }
  });

  it("gives an address a summons could be delivered to", () => {
    // § 5 DDG wants a *ladungsfähige* address, and a street with no house
    // number is not one. Checking for a digit is crude, and it is exactly
    // the mistake that was live for a day.
    for (const locale of ["uk", "en"] as const) {
      const address = impressum[locale].sections
        .flatMap((s) => s.blocks)
        .flatMap((b) => (b.kind === "pairs" ? b.pairs : []))
        .find((pair) => /адрес|address/i.test(pair.term));

      expect(address, `${locale} impressum has no address row`).toBeDefined();

      // The **street** part, before the first comma. Looking for a digit
      // anywhere in the address is the obvious check and a useless one: the
      // postcode is five digits, so it passes while the house number is
      // missing. That version was written, run against the bug, and passed.
      const street = address!.detail.split(",")[0];
      expect(street, "the street has no house number").toMatch(/\d/);
    }
  });

  it("names a person and a way to reach them", () => {
    for (const locale of ["uk", "en"] as const) {
      const pairs = impressum[locale].sections
        .flatMap((s) => s.blocks)
        .flatMap((b) => (b.kind === "pairs" ? b.pairs : []));

      expect(pairs.length).toBeGreaterThanOrEqual(3);
      expect(pairs.some((p) => p.detail.includes("@"))).toBe(true);
      for (const pair of pairs) {
        // The placeholder that used to stand in for all of these.
        expect(pair.detail).not.toBe("…");
      }
    }
  });
});
