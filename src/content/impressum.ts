import type { LegalDocument } from "@/content/legal-types";
import type { Locale } from "@/i18n";

/**
 * § 5 DDG — the page a site run from Germany has to have, with a name and an
 * address a letter can actually reach. It is also the item most likely to
 * draw an Abmahnung, which is why it exists before the app has users.
 *
 * The heading stays the German word in both locales on purpose: that is the
 * word a German reader (and a German authority) looks for, and translating it
 * would make the page harder to recognise, not easier.
 *
 * The name stays in its Latin spelling in both locales: it is a legal
 * identifier, the one a letter would be addressed to, not a word to
 * translate.
 *
 * **One blank is left, and it is load-bearing: the house number.** § 5 wants
 * a *ladungsfähige* address — one a court summons could be delivered to —
 * and a street without a number is not one. It is marked rather than guessed
 * at, because an Impressum with an invented address is worse than an
 * Impressum that admits it is unfinished.
 */
const OPERATOR_NAME = "Anastasiia Semenenko";
const OPERATOR_EMAIL = "chytalnia.space@gmail.com";
/** Street, postcode and town as given; the number is still missing. */
const OPERATOR_STREET = "Karl-Marx-Straße";
const OPERATOR_TOWN = "02681 Wilthen";

export const impressum: Record<Locale, LegalDocument> = {
  uk: {
    title: "Impressum",
    updated: "2026-11-23",
    lead: "Відомості про того, хто відповідає за цей сайт, за § 5 DDG.",
    sections: [
      {
        id: "operator",
        heading: "Відповідальна особа",
        blocks: [
          {
            kind: "pairs",
            pairs: [
              { term: "Імʼя", detail: OPERATOR_NAME },
              {
                term: "Адреса",
                detail: `${OPERATOR_STREET}, ${OPERATOR_TOWN}, Німеччина`,
              },
              { term: "Електронна пошта", detail: OPERATOR_EMAIL },
            ],
          },
          {
            kind: "todo",
            text: `Додати номер будинку до адреси: «${OPERATOR_STREET} __, ${OPERATOR_TOWN}». Без номера адреса не є ladungsfähig — саме цього вимагає § 5 DDG.`,
          },
          {
            kind: "text",
            text: "Читальня — особистий проєкт, не підприємство. Реєстру, податкового номера й реєстраційного суду тут немає, бо немає й самої компанії.",
          },
        ],
      },
      {
        id: "responsible-content",
        heading: "Відповідальність за зміст",
        blocks: [
          {
            kind: "text",
            text: "За зміст цього сайту відповідає особа, названа вище. Книжки, відгуки й нотатки створюють самі читачі — за них відповідають вони.",
          },
        ],
      },
      {
        id: "links",
        heading: "Посилання на інші сайти",
        blocks: [
          {
            kind: "text",
            text: "Сайт містить посилання на сторонні ресурси — каталог Open Library, посилання на зустрічі, які додають власники клубів, і два благодійні проєкти на намальованій полиці. За їхній зміст відповідають їхні власники; на момент додавання посилання нічого протиправного на них не було.",
          },
        ],
      },
      {
        id: "privacy-pointer",
        heading: "Захист даних",
        blocks: [
          {
            kind: "text",
            text: "Що саме застосунок зберігає, навіщо й кому передає — у політиці приватності.",
          },
        ],
      },
    ],
  },
  en: {
    title: "Impressum",
    updated: "2026-11-23",
    lead: "Who is responsible for this site, as § 5 DDG requires.",
    sections: [
      {
        id: "operator",
        heading: "Responsible person",
        blocks: [
          {
            kind: "pairs",
            pairs: [
              { term: "Name", detail: OPERATOR_NAME },
              {
                term: "Address",
                detail: `${OPERATOR_STREET}, ${OPERATOR_TOWN}, Germany`,
              },
              { term: "Contact email", detail: OPERATOR_EMAIL },
            ],
          },
          {
            kind: "todo",
            text: `Add the house number to the address: "${OPERATOR_STREET} __, ${OPERATOR_TOWN}". Without it the address is not one a summons could be delivered to, which is what § 5 DDG asks for.`,
          },
          {
            kind: "text",
            text: "Chytal'nia is a personal project, not a company. There is no register entry, VAT number or registering court, because there is no company to have one.",
          },
        ],
      },
      {
        id: "responsible-content",
        heading: "Responsibility for content",
        blocks: [
          {
            kind: "text",
            text: "The person named above is responsible for this site's own content. Books, reviews and notes are written by readers themselves, who are responsible for those.",
          },
        ],
      },
      {
        id: "links",
        heading: "Links to other sites",
        blocks: [
          {
            kind: "text",
            text: "This site links to places it does not run — the Open Library catalogue, meeting links added by club owners, and two charities on the drawn shelf. Their owners are responsible for what is on them; nothing unlawful was there when the links were added.",
          },
        ],
      },
      {
        id: "privacy-pointer",
        heading: "Data protection",
        blocks: [
          {
            kind: "text",
            text: "What this app stores, why, and who else receives it is set out in the privacy policy.",
          },
        ],
      },
    ],
  },
};
