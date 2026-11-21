import { interpolate } from "@/i18n/interpolate";

export type PluralForms = {
  one: string;
  few: string;
  many: string;
  other: string;
};

/**
 * Pick the right plural form for a count and fill in `{count}`.
 *
 * Ukrainian needs three forms (1 книга / 2 книги / 5 книг), English two,
 * so the dictionaries carry all four Intl.PluralRules categories and this
 * picks whichever the locale actually asks for.
 *
 * Takes the locale as an argument rather than reading it, so it works in
 * client components too.
 */
export function plural(
  forms: PluralForms,
  count: number,
  locale: "uk" | "en",
  /**
   * What to print in place of the number, when it should not be printed
   * bare — «7 186 сторінок» rather than «7186 сторінок». The form is still
   * chosen by the real count.
   */
  display?: string,
) {
  const rule = new Intl.PluralRules(locale === "uk" ? "uk-UA" : "en-US").select(
    count,
  );
  const form = forms[rule as keyof PluralForms] ?? forms.other;
  return interpolate(form, { count: display ?? count });
}
