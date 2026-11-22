/**
 * The two documents the law wants on a site run from Germany, as data rather
 * than as markup — so both locales can be held side by side and checked
 * against each other, and so a renderer can lay them out once.
 */
export type LegalBlock =
  | { kind: "text"; text: string }
  | { kind: "list"; items: string[] }
  /** A term and what it means — used for the lists of data and of processors. */
  | { kind: "pairs"; pairs: Array<{ term: string; detail: string }> }
  /** Something the reader has to fill in or act on before publishing. */
  | { kind: "todo"; text: string };

export type LegalSection = {
  /** Stable across locales: the test for drift compares these. */
  id: string;
  heading: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  title: string;
  /** Plain ISO date; rendered in the reader's own locale. */
  updated: string;
  lead: string;
  sections: LegalSection[];
};
