import type { Metadata } from "next";

import { LegalDocumentView } from "@/components/legal/legal-document";
import { privacyPolicy } from "@/content/privacy";
import { getDictionary, getLocale } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return { title: privacyPolicy[locale].title };
}

export default async function PrivacyPage() {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);

  return (
    <LegalDocumentView
      doc={privacyPolicy[locale]}
      locale={locale}
      brand={dict.brand}
      backLabel={dict.legal.back}
      todoLabel={dict.legal.todo}
    />
  );
}
