<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Checking your work without ten minutes of setup

`npm run seed` creates one known reader with a full library — books on all
four shelves, a year's worth of finish dates, ratings, reviews, notes and
two part-read books. Sign in as `seed@chytalnia.local`; the password is
`SEED_PASSWORD` in `.env`. Running it again resets the library to exactly
the same state, and `npm run seed:clean` takes it away.

It writes to whatever `DATABASE_URL` points at, and here that is the same
Neon database production uses. The reader and its books are keyed by one
address and an `olid` prefix of their own, so nothing else is touched.

`npm test` runs the unit tests. They cover the pure parts — reading a
Goodreads row, a year's arithmetic, the Wikidata ranking — which is where
every bug so far has actually lived. They take milliseconds; the browser
takes minutes. Reach for them first, and keep the browser for what only the
running app can show.
