import { describe, expect, it } from "vitest";

import { rankCandidates } from "@/lib/wikidata";

/** The shape `wbgetentities` returns, cut down to what the ranking reads. */
function entity(label: string, claims: { P31?: string[]; P106?: string[] }) {
  const toClaims = (ids: string[]) =>
    ids.map((id) => ({ mainsnak: { datavalue: { value: { id } } } }));
  return {
    labels: { en: { value: label } },
    claims: {
      ...(claims.P31 ? { P31: toClaims(claims.P31) } : {}),
      ...(claims.P106 ? { P106: toClaims(claims.P106) } : {}),
    },
  };
}

const HUMAN = "Q5";
const WRITER = "Q36180";
const BOXER = "Q11338576";
const CITY = "Q1093829";
const NOVEL = "Q8261";

describe("rankCandidates", () => {
  it("puts the writer ahead of the other humans", () => {
    // Wikidata's own order for «Бакман» is a town, then a boxer, then a
    // disambiguation page, and only fourth the novelist. Grouping by
    // `instance of` alone cannot separate the boxer from the novelist.
    const ids = ["Q1", "Q2", "Q3"];
    const tiers = rankCandidates(ids, {
      Q1: entity("Buckman", { P31: [CITY] }),
      Q2: entity("Arkadiy Bakman", { P31: [HUMAN], P106: [BOXER] }),
      Q3: entity("Fredrik Backman", { P31: [HUMAN], P106: [WRITER] }),
    });

    expect(tiers.writers).toEqual(["Fredrik Backman"]);
    expect(tiers.people).toEqual(["Arkadiy Bakman"]);
    expect(tiers.rest).toEqual(["Buckman"]);
  });

  it("counts a book as a top candidate, not only a person", () => {
    const tiers = rankCandidates(["Q1"], {
      Q1: entity("A Man Called Ove", { P31: [NOVEL] }),
    });
    expect(tiers.writers).toEqual(["A Man Called Ove"]);
  });

  it("keeps Wikidata's order inside a tier", () => {
    const tiers = rankCandidates(["Q1", "Q2"], {
      Q1: entity("First Writer", { P31: [HUMAN], P106: [WRITER] }),
      Q2: entity("Second Writer", { P31: [HUMAN], P106: [WRITER] }),
    });
    expect(tiers.writers).toEqual(["First Writer", "Second Writer"]);
  });

  it("drops a candidate with no English label", () => {
    // There is nothing to take to an English-language catalogue.
    const tiers = rankCandidates(["Q1", "Q2"], {
      Q1: { labels: {}, claims: {} },
      Q2: entity("Has A Name", { P31: [HUMAN], P106: [WRITER] }),
    });
    expect(tiers.writers).toEqual(["Has A Name"]);
    expect(tiers.people).toEqual([]);
    expect(tiers.rest).toEqual([]);
  });

  it("files something with no claims at all under the last tier", () => {
    const tiers = rankCandidates(["Q1"], { Q1: entity("Mystery", {}) });
    expect(tiers.rest).toEqual(["Mystery"]);
  });
});
