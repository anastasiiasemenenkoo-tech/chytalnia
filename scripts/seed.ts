/**
 * A known reader with a known library, so checking the app does not start
 * with ten minutes of signing up and importing.
 *
 * Every session used to begin by creating a throwaway account, importing a
 * CSV through the browser and deleting it all afterwards — eight to twelve
 * steps before a single thing could be looked at. This replaces that with
 * `npm run seed` and one sign-in.
 *
 * Run `npm run seed:clean` to take the reader and the books away again.
 *
 * It writes to whatever `DATABASE_URL` points at, and in this project that
 * is the same Neon database production uses. Nothing here touches anybody
 * else's rows: the reader is keyed by one address and the books by an
 * `olid` prefix of their own.
 */
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/db";

const EMAIL = "seed@chytalnia.local";
const NAME = "Тестова Читачка";
/**
 * A second reader, because half the app is about other people and none of it
 * can be looked at alone. Without her `/readers` is two empty boxes and
 * `/duels` is an empty state — the two pages nobody could check.
 */
const FRIEND_EMAIL = "seed-friend@chytalnia.local";
const FRIEND_NAME = "Оксана Сусідка";
const CLUB_NAME = "Клуб тестової читальні";
/** Marks every book this script owns, so cleaning up is exact. */
const OLID_PREFIX = "seed:";

type Seeded = {
  title: string;
  author: string;
  /** An Open Library cover id, or null for a book with no picture. */
  cover: number | null;
  pages: number;
  shelf: "READ" | "READING" | "WANT_TO_READ" | "ABANDONED";
  /** `YYYY-MM-DD`, read as UTC. */
  added: string;
  finished?: string;
  rating?: number;
  review?: string;
  notes?: string;
  pagesRead?: number;
};

/**
 * Spread across the year on purpose: the months chart on /year is only
 * worth looking at when some months are busy and one is empty.
 */
const LIBRARY: Seeded[] = [
  { title: "Anxious People", author: "Fredrik Backman", cover: 10534939, pages: 341, shelf: "READ", added: "2026-01-02", finished: "2026-01-14", rating: 5, review: "Книжка про пограбування банку, яка не про пограбування банку.", notes: "Перечитати взимку." },
  { title: "Beartown", author: "Fredrik Backman", cover: null, pages: 418, shelf: "READ", added: "2026-01-20", finished: "2026-02-08", rating: 5 },
  { title: "A Man Called Ove", author: "Fredrik Backman", cover: null, pages: 337, shelf: "READ", added: "2026-02-10", finished: "2026-02-25", rating: 4 },
  { title: "Беззбройний", author: "Артем Чех", cover: null, pages: 208, shelf: "READ", added: "2026-02-26", finished: "2026-03-03", rating: 4 },
  { title: "Інтернат", author: "Сергій Жадан", cover: null, pages: 336, shelf: "READ", added: "2026-03-20", finished: "2026-03-28", rating: 5, review: "Три дні, за які не можна сховатися." },
  { title: "Ворошиловград", author: "Сергій Жадан", cover: null, pages: 442, shelf: "READ", added: "2026-04-01", finished: "2026-04-15", rating: 4 },
  // No cover id: the one that used to be here rendered somebody else's book
  // entirely, and test data that lies is worse than test data with a gap.
  { title: "The Hobbit", author: "J.R.R. Tolkien", cover: null, pages: 366, shelf: "READ", added: "2026-05-08", finished: "2026-05-21", rating: 4 },
  { title: "Dune", author: "Frank Herbert", cover: null, pages: 658, shelf: "READ", added: "2026-05-25", finished: "2026-06-30", rating: 5, notes: "Найтовща цього року." },
  { title: "Piranesi", author: "Susanna Clarke", cover: null, pages: 245, shelf: "READ", added: "2026-08-06", finished: "2026-08-18", rating: 5 },
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", cover: null, pages: 303, shelf: "READ", added: "2026-08-25", finished: "2026-09-09", rating: 3 },
  { title: "Never Let Me Go", author: "Kazuo Ishiguro", cover: null, pages: 288, shelf: "READ", added: "2026-09-12", finished: "2026-09-27", rating: 4 },
  { title: "The Remains of the Day", author: "Kazuo Ishiguro", cover: null, pages: 258, shelf: "READ", added: "2026-09-30", finished: "2026-10-12", rating: 5 },
  { title: "Тигролови", author: "Іван Багряний", cover: null, pages: 356, shelf: "READ", added: "2026-10-31", finished: "2026-11-05", rating: 4 },
  // Last year, so /year has something to compare against.
  { title: "Project Hail Mary", author: "Andy Weir", cover: null, pages: 476, shelf: "READ", added: "2025-03-20", finished: "2025-04-02", rating: 5 },
  { title: "Circe", author: "Madeline Miller", cover: null, pages: 393, shelf: "READ", added: "2025-08-30", finished: "2025-09-14", rating: 4 },
  // In progress, with a half-filled progress bar.
  { title: "Місто", author: "Валер'ян Підмогильний", cover: null, pages: 464, shelf: "READING", added: "2026-11-06", pagesRead: 210 },
  { title: "The Dispossessed", author: "Ursula K. Le Guin", cover: null, pages: 387, shelf: "READING", added: "2026-11-15", pagesRead: 54 },
  // Waiting, and one put down.
  { title: "Man's Search for Meaning", author: "Viktor E. Frankl", cover: 8513458, pages: 165, shelf: "WANT_TO_READ", added: "2026-06-02" },
  { title: "Кохання під час холери", author: "Габрієль Гарсія Маркес", cover: null, pages: 348, shelf: "WANT_TO_READ", added: "2026-10-01" },
  { title: "Ulysses", author: "James Joyce", cover: null, pages: 730, shelf: "ABANDONED", added: "2026-02-01", notes: "Колись. Не цього року." },
];

const utc = (date: string) => new Date(`${date}T00:00:00.000Z`);

async function clean() {
  const readers = await prisma.user.findMany({
    where: { email: { in: [EMAIL, FRIEND_EMAIL] } },
    select: { id: true },
  });
  const ids = readers.map((r) => r.id);

  if (ids.length > 0) {
    // Clubs first: `BookClub.owner` is a required relation with no
    // `onDelete`, so Postgres refuses to delete a reader who still owns one.
    // Everything else — shelves, memberships, duels, follows — cascades off
    // the reader.
    await prisma.bookClub.deleteMany({ where: { ownerId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  const books = await prisma.book.deleteMany({
    where: { olid: { startsWith: OLID_PREFIX } },
  });
  console.log(
    ids.length > 0
      ? `Прибрано: читачок — ${ids.length}, книжок — ${books.count}.`
      : `Тестових читачок не було. Книжок прибрано: ${books.count}.`,
  );
}

async function seed() {
  const password = process.env.SEED_PASSWORD;
  if (!password) {
    console.error(
      "SEED_PASSWORD не задано. Додай рядок SEED_PASSWORD=... у .env — " +
        "це пароль тестової читачки, і в репозиторій він не потрапляє.",
    );
    process.exit(1);
  }

  // Start from nothing every time, so the library is the same on the tenth
  // run as on the first and nothing accumulates.
  await clean();

  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      name: NAME,
      hashedPassword: await bcrypt.hash(password, 10),
      yearlyGoal: 15,
    },
    select: { id: true },
  });

  await prisma.book.createMany({
    data: LIBRARY.map((book, i) => ({
      olid: `${OLID_PREFIX}${i + 1}`,
      title: book.title,
      author: book.author,
      coverUrl: book.cover
        ? `https://covers.openlibrary.org/b/id/${book.cover}-M.jpg`
        : null,
    })),
  });

  const books = await prisma.book.findMany({
    where: { olid: { startsWith: OLID_PREFIX } },
    select: { id: true, olid: true },
  });
  const idByOlid = new Map(books.map((b) => [b.olid, b.id]));

  await prisma.userBook.createMany({
    data: LIBRARY.map((book, i) => ({
      userId: user.id,
      bookId: idByOlid.get(`${OLID_PREFIX}${i + 1}`)!,
      shelf: book.shelf,
      addedAt: utc(book.added),
      finishedAt: book.finished ? utc(book.finished) : null,
      totalPages: book.pages,
      pagesRead: book.pagesRead ?? null,
      progressUpdated: book.pagesRead ? new Date() : null,
      rating: book.rating ?? null,
      ratedAt: book.rating ? utc(book.finished ?? book.added) : null,
      review: book.review ?? null,
      reviewUpdatedAt: book.review ? utc(book.finished ?? book.added) : null,
      notes: book.notes ?? null,
      notesUpdatedAt: book.notes ? new Date() : null,
    })),
  });

  await seedCompany(user.id, idByOlid, await bcrypt.hash(password, 10));

  console.log(`Готово. Читачка ${EMAIL}, книжок: ${LIBRARY.length}.`);
  console.log(`Поруч: ${FRIEND_NAME} (${FRIEND_EMAIL}), клуб і чотири дуелі.`);
  console.log("Пароль — той, що в SEED_PASSWORD у .env, в обох.");
}

/**
 * The other reader, and everything that needs two people to exist: a mutual
 * follow (so the "friend" badge has somewhere to show), a shelf of finished
 * books (so `/readers` has a feed), a club they are both in, and one duel in
 * each of the four states `/duels` lays out — waiting on me, waiting on her,
 * running, and settled.
 */
async function seedCompany(
  meId: string,
  idByOlid: Map<string, string>,
  hashedPassword: string,
) {
  const book = (n: number) => idByOlid.get(`${OLID_PREFIX}${n}`)!;

  const her = await prisma.user.create({
    data: {
      email: FRIEND_EMAIL,
      name: FRIEND_NAME,
      hashedPassword,
      yearlyGoal: 20,
    },
    select: { id: true },
  });

  // Her own shelf: finished recently, so the feed is in a readable order and
  // the dates are not all the same day.
  const hers: Array<{ n: number; finished: string; rating: number }> = [
    { n: 7, finished: "2026-11-21", rating: 5 },
    { n: 5, finished: "2026-11-14", rating: 4 },
    { n: 9, finished: "2026-11-02", rating: 5 },
    { n: 13, finished: "2026-10-18", rating: 3 },
  ];
  await prisma.userBook.createMany({
    data: hers.map((h) => ({
      userId: her.id,
      bookId: book(h.n),
      shelf: "READ" as const,
      addedAt: utc(h.finished),
      finishedAt: utc(h.finished),
      rating: h.rating,
      ratedAt: utc(h.finished),
    })),
  });
  // One in progress, so the club's progress bar has two readers on it.
  await prisma.userBook.create({
    data: {
      userId: her.id,
      bookId: book(16),
      shelf: "READING",
      addedAt: utc("2026-11-10"),
      totalPages: 464,
      pagesRead: 300,
      progressUpdated: new Date(),
    },
  });

  // Both ways, so the pair reads as mutual and the badge appears.
  await prisma.follow.createMany({
    data: [
      { followerId: meId, followingId: her.id },
      { followerId: her.id, followingId: meId },
    ],
  });

  const club = await prisma.bookClub.create({
    data: {
      name: CLUB_NAME,
      description:
        "Клуб, який існує тільки для того, щоб було на що дивитися під час перевірки.",
      ownerId: meId,
      currentlyReadingBookId: book(16),
      memberships: {
        create: [
          { userId: meId, role: "OWNER" },
          { userId: her.id, role: "MEMBER" },
        ],
      },
      readingHistory: {
        create: [
          { bookId: book(16), startDate: utc("2026-11-06") },
          {
            bookId: book(7),
            startDate: utc("2026-09-01"),
            endedAt: utc("2026-10-20"),
          },
        ],
      },
    },
    select: { id: true },
  });

  await prisma.readingDuel.createMany({
    data: [
      // Waiting on me to answer.
      {
        clubId: club.id,
        bookId: book(16),
        challengerId: her.id,
        opponentId: meId,
        status: "PENDING",
      },
      // Waiting on her.
      {
        clubId: club.id,
        bookId: book(17),
        challengerId: meId,
        opponentId: her.id,
        status: "PENDING",
      },
      // Running.
      {
        clubId: club.id,
        bookId: book(18),
        challengerId: meId,
        opponentId: her.id,
        status: "ACTIVE",
        respondedAt: utc("2026-11-12"),
      },
      // Settled, and I lost it — a page that only ever shows wins is a page
      // whose losing state nobody has looked at.
      {
        clubId: club.id,
        bookId: book(7),
        challengerId: meId,
        opponentId: her.id,
        status: "FINISHED",
        respondedAt: utc("2026-10-02"),
        winnerId: her.id,
        wonAt: utc("2026-10-20"),
      },
    ],
  });
}

const main = process.argv.includes("--clean") ? clean : seed;

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
