import type { Metadata } from "next";

import { LegalDocumentView } from "@/components/legal/legal-document";
import { impressum } from "@/content/impressum";
import { getDictionary, getLocale } from "@/i18n";

export const metadata: Metadata = {
  // The German word in both locales on purpose: it is what a German reader —
  // and a German authority — looks for.
  title: "Impressum",
};

export default async function ImpressumPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const doc = impressum[locale];

  return (
    <LegalDocumentView
      doc={doc}
      locale={locale}
      brand={dict.brand}
      backLabel={dict.legal.back}
      todoLabel={dict.legal.todo}
    />
  );
}
