import type { LegalDocument } from "@/content/legal-types";
import type { Locale } from "@/i18n";

/**
 * Art. 13 GDPR, written from this app's own schema rather than from a
 * template — every column named below is a column that exists, and every
 * processor named is one the app really talks to. A generated policy would
 * be half about analytics and cookie consent this app does not have, and
 * silent about the thing that actually matters here: that other signed-in
 * readers can see your shelves and reviews.
 *
 * Two things to keep true as the app changes: the list of data, and the list
 * of processors. If a column or a service is added, it belongs here in the
 * same commit.
 */
export const privacyPolicy: Record<Locale, LegalDocument> = {
  uk: {
    title: "Політика приватності",
    updated: "2026-11-22",
    lead: "Що Читальня зберігає про тебе, навіщо, скільки, і хто це бачить. Без загальних слів — за назвами того, що справді лежить у базі.",
    sections: [
      {
        id: "controller",
        heading: "Хто відповідає",
        blocks: [
          {
            kind: "text",
            text: "Відповідальна за обробку — особа, названа в Impressum. Там же адреса для звʼязку.",
          },
          {
            kind: "text",
            text: "Окремого спеціаліста із захисту даних немає, і за законом він не потрібен: проєкт веде одна людина.",
          },
        ],
      },
      {
        id: "what",
        heading: "Що зберігається",
        blocks: [
          {
            kind: "text",
            text: "Акаунт і все, що ти в ньому робиш:",
          },
          {
            kind: "pairs",
            pairs: [
              {
                term: "Адреса пошти",
                detail:
                  "Нею ти входиш, на неї приходить лист для скидання пароля. Без неї акаунта не буває.",
              },
              {
                term: "Імʼя",
                detail:
                  "Тільки щоб звертатися до тебе й підписувати твої коментарі в клубах. Будь-яке, яке захочеш.",
              },
              {
                term: "Пароль",
                detail:
                  "Сам пароль не зберігається ніде. У базі лежить лише його незворотний відбиток (bcrypt) — з нього пароль не відновити.",
              },
              {
                term: "Ідентифікатор Google",
                detail:
                  "Лише якщо ти входиш через Google: його внутрішній номер твого акаунта, щоб упізнавати тебе наступного разу. Ні доступу до пошти, ні до контактів, ні до чогось іншого в Google застосунок не має.",
              },
              {
                term: "Книжки й полиці",
                detail:
                  "Що на якій полиці, коли додано, коли прочитано, скільки сторінок, оцінки, відгуки й приватні нотатки.",
              },
              {
                term: "Клуби",
                detail:
                  "У яких клубах ти є, коли вступила, що написала в обговореннях, розклад читання, дуелі та їх результати.",
              },
              {
                term: "Читачі",
                detail: "За кими ти стежиш і хто стежить за тобою.",
              },
              {
                term: "Річна ціль",
                detail: "Число книг, яке ти собі поставила, якщо ставила.",
              },
            ],
          },
          {
            kind: "text",
            text: "Технічне, що зʼявляється саме:",
          },
          {
            kind: "pairs",
            pairs: [
              {
                term: "Твоя IP-адреса — до години",
                detail:
                  "Разом із адресою пошти вона потрібна, щоб обмежити кількість спроб входу й листів про скидання пароля. Інакше пароль можна підбирати без кінця. Рядки живуть не довше за годину, і прибираються.",
              },
              {
                term: "Одноразові токени",
                detail:
                  "Для скидання пароля й підтвердження нової адреси — у базі лежать тільки їхні відбитки, діють годину.",
              },
              {
                term: "Логи сервера",
                detail:
                  "Хостинг записує звичайне для вебсервера: час запиту, адресу сторінки, IP. Паролі й зміст листів туди не потрапляють.",
              },
            ],
          },
        ],
      },
      {
        id: "why",
        heading: "На якій підставі",
        blocks: [
          {
            kind: "text",
            text: "Усе, що стосується акаунта й читання, обробляється для виконання договору з тобою — ти створила акаунт, щоб застосунок робив те, для чого він є (ст. 6(1)(b) GDPR). Згоди для цього не питають, бо вона тут не є підставою.",
          },
          {
            kind: "text",
            text: "Обмеження спроб входу й логи сервера — законний інтерес у тому, щоб сервіс працював і не був зламаний (ст. 6(1)(f)).",
          },
          {
            kind: "text",
            text: "Публічне посилання на підсумок року створюється тільки тоді, коли ти сама натискаєш кнопку, і зникає, коли ти його вимикаєш.",
          },
        ],
      },
      {
        id: "visible",
        heading: "Що бачать інші читачі",
        blocks: [
          {
            kind: "text",
            text: "Це найважливіше в цьому тексті, тому прямо:",
          },
          {
            kind: "list",
            items: [
              "Твій профіль — імʼя, полиці, оцінки й відгуки — видно будь-кому, хто увійшов до Читальні.",
              "Коментарі в клубі видно учасникам клубу. Вступити до будь-якого клубу може будь-хто, хто увійшов: закритих клубів у застосунку немає.",
              "Публічне посилання на підсумок року відкриває його кожному, хто має це посилання, навіть без акаунта. Відгуків, нотаток і адреси там немає.",
            ],
          },
          {
            kind: "text",
            text: "А цього не бачить ніхто, крім тебе: твої приватні нотатки до книг і твоя адреса пошти. Ні в профілі, ні в клубі, ні на публічній сторінці року — вони не потрапляють навіть у дані, які браузер отримує з сервера.",
          },
        ],
      },
      {
        id: "processors",
        heading: "Кому передаються дані",
        blocks: [
          {
            kind: "text",
            text: "Застосунок нікому не продає й не передає дані для реклами. Але він працює не сам по собі — ось усі, хто торкається даних, і що саме вони бачать:",
          },
          {
            kind: "pairs",
            pairs: [
              {
                term: "Neon (база даних)",
                detail:
                  "Тут лежить усе перелічене вище. Сервери — Amazon Web Services, регіон us-east-2, штат Огайо, США.",
              },
              {
                term: "Vercel (хостинг)",
                detail:
                  "Виконує сам застосунок і веде логи запитів, у яких є IP.",
              },
              {
                term: "Resend (пошта)",
                detail:
                  "Бачить адресу отримувача й текст листа — тільки коли застосунок надсилає лист про скидання пароля або підтвердження нової адреси. Листів-розсилок застосунок не надсилає взагалі.",
              },
              {
                term: "Google",
                detail:
                  "Тільки якщо ти обираєш вхід через Google — тоді Google знає про цей вхід. Шрифти на сайті роздаються з власного сервера, тож до Google вони твою адресу не несуть.",
              },
              {
                term: "Open Library та Wikidata",
                detail:
                  "Коли ти шукаєш книгу, твій пошуковий запит іде до цих каталогів, щоб знайти її. Хто саме шукає, вони не отримують — ні імені, ні адреси, ні ідентифікатора.",
              },
            ],
          },
          {
            kind: "text",
            text: "Частина цих сервісів — у США, тож дані залишають Європейський Союз. Для такої передачі є механізми EU-US Data Privacy Framework і стандартні договірні положення.",
          },
          {
            kind: "todo",
            text: "Перевірити й назвати тут підставу передачі для кожного з сервісів у США (сертифікація за DPF або SCC), а також підписати з ними договори про обробку даних.",
          },
        ],
      },
      {
        id: "cookies",
        heading: "Cookie",
        blocks: [
          {
            kind: "text",
            text: "Банера про cookie тут немає, бо немає й cookie, на які потрібна згода. Жодної аналітики, жодної реклами, жодного стеження. Усього три речі зберігаються у твоєму браузері:",
          },
          {
            kind: "pairs",
            pairs: [
              {
                term: "Cookie сесії",
                detail:
                  "Тримає тебе в акаунті. JavaScript до неї доступу не має. Без неї увійти неможливо.",
              },
              {
                term: "Cookie мови",
                detail: "Запамʼятовує, українською чи англійською ти читаєш.",
              },
              {
                term: "Памʼять браузера",
                detail:
                  "Темна чи світла тема, і те, що підказку про додавання на екран «Додому» ти вже закрила. Ці дві речі не йдуть на сервер узагалі.",
              },
            ],
          },
        ],
      },
      {
        id: "how-long",
        heading: "Скільки зберігається",
        blocks: [
          {
            kind: "list",
            items: [
              "Акаунт і все, що в ньому — поки ти його не видалиш. Видалення в налаштуваннях прибирає все одразу: полиці, відгуки, нотатки, коментарі, дуелі, підписки.",
              "Якщо ти була власницею клубу з іншими учасниками, сам клуб залишається, а власність переходить до того, хто вступив найраніше. Порожній клуб видаляється разом з тобою.",
              "Одноразові токени — година.",
              "Рядки з IP для обмеження спроб — не довше за годину.",
              "Логи сервера — за правилами хостингу.",
            ],
          },
        ],
      },
      {
        id: "rights",
        heading: "Твої права",
        blocks: [
          {
            kind: "text",
            text: "За GDPR ти маєш право знати, що про тебе зберігається, отримати це копією, виправити, видалити, обмежити обробку й заперечити проти неї. Два з цих прав можна здійснити просто в застосунку, не питаючи нікого:",
          },
          {
            kind: "list",
            items: [
              "Налаштування → «Завантажити мої дані» віддають усе, що база про тебе знає, одним файлом.",
              "Налаштування → видалення акаунта прибирає все.",
            ],
          },
          {
            kind: "text",
            text: "Імʼя й адресу можна змінити там само. Для всього іншого напиши на адресу з Impressum.",
          },
          {
            kind: "text",
            text: "Якщо тобі здається, що з твоїми даними обійшлися неправильно, ти можеш скаржитися до наглядового органу із захисту даних — у тій федеральній землі, де працює відповідальна особа, або там, де живеш ти.",
          },
        ],
      },
      {
        id: "children",
        heading: "Діти",
        blocks: [
          {
            kind: "text",
            text: "Застосунок не призначений для дітей до 16 років, і віку він не перевіряє.",
          },
        ],
      },
      {
        id: "automated",
        heading: "Чого тут немає",
        blocks: [
          {
            kind: "list",
            items: [
              "Жодних автоматичних рішень про тебе й жодного профілювання.",
              "Жодної аналітики й жодних рекламних сервісів.",
              "Жодних листів-розсилок: пошта використовується тільки для скидання пароля й підтвердження адреси.",
            ],
          },
        ],
      },
    ],
  },
  en: {
    title: "Privacy policy",
    updated: "2026-11-22",
    lead: "What Chytal'nia stores about you, why, for how long, and who can see it — named after what is actually in the database rather than in general terms.",
    sections: [
      {
        id: "controller",
        heading: "Who is responsible",
        blocks: [
          {
            kind: "text",
            text: "The controller is the person named in the Impressum, where the contact address is too.",
          },
          {
            kind: "text",
            text: "There is no data protection officer, and the law does not require one: this is a project run by one person.",
          },
        ],
      },
      {
        id: "what",
        heading: "What is stored",
        blocks: [
          { kind: "text", text: "Your account and everything you do in it:" },
          {
            kind: "pairs",
            pairs: [
              {
                term: "Email address",
                detail:
                  "You sign in with it, and a password reset letter goes to it. There is no account without one.",
              },
              {
                term: "Name",
                detail:
                  "Only so the app can address you and sign your club comments. Whatever you like.",
              },
              {
                term: "Password",
                detail:
                  "The password itself is stored nowhere. The database holds an irreversible fingerprint of it (bcrypt), which it cannot be recovered from.",
              },
              {
                term: "Google id",
                detail:
                  "Only if you sign in with Google: Google's own number for your account, so you are recognised next time. The app has no access to your mail, your contacts or anything else there.",
              },
              {
                term: "Books and shelves",
                detail:
                  "What is on which shelf, when it was added, when it was finished, pages read, ratings, reviews and private notes.",
              },
              {
                term: "Clubs",
                detail:
                  "Which clubs you are in, when you joined, what you wrote in discussions, the reading schedule, duels and their results.",
              },
              {
                term: "Readers",
                detail: "Who you follow and who follows you.",
              },
              {
                term: "Yearly goal",
                detail: "The number of books you set yourself, if you set one.",
              },
            ],
          },
          { kind: "text", text: "Technical things that appear by themselves:" },
          {
            kind: "pairs",
            pairs: [
              {
                term: "Your IP address — for up to an hour",
                detail:
                  "Together with the email address, it is what limits how many sign-in attempts and password reset letters one caller can make. Without it a password could be guessed forever. The rows last no longer than an hour and are cleared.",
              },
              {
                term: "One-time tokens",
                detail:
                  "For resetting a password and confirming a new address — the database holds only their fingerprints, valid for an hour.",
              },
              {
                term: "Server logs",
                detail:
                  "The hosting records what any web server records: the time, the page, the IP. Passwords and the contents of letters do not go there.",
              },
            ],
          },
        ],
      },
      {
        id: "why",
        heading: "On what basis",
        blocks: [
          {
            kind: "text",
            text: "Everything to do with your account and your reading is processed to perform the contract with you — you made an account so the app would do what it is for (Art. 6(1)(b) GDPR). You are not asked to consent, because consent is not the basis here.",
          },
          {
            kind: "text",
            text: "Rate limiting and server logs rest on the legitimate interest in the service working and not being broken into (Art. 6(1)(f)).",
          },
          {
            kind: "text",
            text: "A public link to your year is created only when you press the button yourself, and stops working when you switch it off.",
          },
        ],
      },
      {
        id: "visible",
        heading: "What other readers can see",
        blocks: [
          {
            kind: "text",
            text: "This is the most important part of this document, so plainly:",
          },
          {
            kind: "list",
            items: [
              "Your profile — name, shelves, ratings and reviews — is visible to anyone signed in to Chytal'nia.",
              "Club comments are visible to that club's members. Anyone signed in can join any club: there are no private clubs in this app.",
              "A public year link opens your year to anyone holding it, with no account needed. It carries no review, no note and no address.",
            ],
          },
          {
            kind: "text",
            text: "And nobody but you sees these: your private notes on books, and your email address. Not on your profile, not in a club, not on the public year page — they are left out even of the data the browser receives from the server.",
          },
        ],
      },
      {
        id: "processors",
        heading: "Who else receives data",
        blocks: [
          {
            kind: "text",
            text: "Nothing is sold, and nothing is handed to anyone for advertising. But the app does not run on its own — here is everyone who touches the data and what they see:",
          },
          {
            kind: "pairs",
            pairs: [
              {
                term: "Neon (the database)",
                detail:
                  "Everything above lives here. The servers are Amazon Web Services, region us-east-2, Ohio, USA.",
              },
              {
                term: "Vercel (hosting)",
                detail: "Runs the app and keeps request logs, which hold IPs.",
              },
              {
                term: "Resend (email)",
                detail:
                  "Sees the recipient address and the letter — only when the app sends a password reset or an address confirmation. The app sends no newsletters at all.",
              },
              {
                term: "Google",
                detail:
                  "Only if you choose to sign in with Google, which then knows about that sign-in. The site's fonts are served from its own server, so they carry nothing to Google.",
              },
              {
                term: "Open Library and Wikidata",
                detail:
                  "When you search for a book, your search terms go to these catalogues to find it. They receive nothing about who is searching — no name, no address, no identifier.",
              },
            ],
          },
          {
            kind: "text",
            text: "Some of these are in the United States, so data leaves the European Union. The EU-US Data Privacy Framework and standard contractual clauses are the mechanisms for such a transfer.",
          },
          {
            kind: "todo",
            text: "Check and state here the transfer basis for each US service (DPF certification or SCCs), and sign a data processing agreement with each of them.",
          },
        ],
      },
      {
        id: "cookies",
        heading: "Cookies",
        blocks: [
          {
            kind: "text",
            text: "There is no cookie banner here because there are no cookies that would need consent. No analytics, no advertising, no tracking. Three things are kept in your browser:",
          },
          {
            kind: "pairs",
            pairs: [
              {
                term: "The session cookie",
                detail:
                  "Keeps you signed in. JavaScript cannot read it. Signing in is impossible without it.",
              },
              {
                term: "The language cookie",
                detail: "Remembers whether you read in Ukrainian or English.",
              },
              {
                term: "Browser storage",
                detail:
                  "Dark or light theme, and the fact that you have dismissed the home-screen hint. Neither ever reaches the server.",
              },
            ],
          },
        ],
      },
      {
        id: "how-long",
        heading: "For how long",
        blocks: [
          {
            kind: "list",
            items: [
              "Your account and everything in it — until you delete it. Deleting it in settings removes all of it at once: shelves, reviews, notes, comments, duels, follows.",
              "If you owned a club with other members in it, the club stays and passes to whoever joined earliest. An empty club is deleted along with you.",
              "One-time tokens — one hour.",
              "The rows holding an IP for rate limiting — no longer than an hour.",
              "Server logs — per the hosting provider's own retention.",
            ],
          },
        ],
      },
      {
        id: "rights",
        heading: "Your rights",
        blocks: [
          {
            kind: "text",
            text: "Under the GDPR you may know what is stored about you, receive a copy of it, correct it, delete it, restrict processing and object to it. Two of those you can exercise in the app itself, without asking anyone:",
          },
          {
            kind: "list",
            items: [
              "Settings → “Download my data” hands you everything the database knows about you in one file.",
              "Settings → delete account removes all of it.",
            ],
          },
          {
            kind: "text",
            text: "Your name and address can be changed in the same place. For anything else, write to the address in the Impressum.",
          },
          {
            kind: "text",
            text: "If you believe your data has been handled wrongly, you may complain to a data protection supervisory authority — in the state where the controller operates, or where you live.",
          },
        ],
      },
      {
        id: "children",
        heading: "Children",
        blocks: [
          {
            kind: "text",
            text: "This app is not meant for children under 16, and it does not check anyone's age.",
          },
        ],
      },
      {
        id: "automated",
        heading: "What is not here",
        blocks: [
          {
            kind: "list",
            items: [
              "No automated decisions about you, and no profiling.",
              "No analytics and no advertising services.",
              "No newsletters: email is used only for password resets and address confirmations.",
            ],
          },
        ],
      },
    ],
  },
};
