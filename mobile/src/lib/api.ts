import Constants from "expo-constants";

/**
 * The one place that knows where the server is.
 *
 * In the simulator `localhost` is the Mac the dev server runs on, so no port
 * forwarding and no LAN address are needed. On a real device it has to be
 * either the Mac's LAN address or the deployed app, which is what `apiUrl`
 * in `app.json` -> `extra` is for: set it there and this stops guessing.
 */
const PRODUCTION = "https://dashboard-course-tau.vercel.app";

/**
 * Only a non-empty string counts as a configured address.
 *
 * `??` is not enough here, and the way it failed is worth writing down.
 * `extra: { apiUrl: null }` in app.json does not reach the app as `null`:
 * Expo builds the manifest and hands it over as `{}`, an empty object. An
 * empty object is not nullish, so `?? fallback` kept it, and interpolating
 * it into a template string produced "[object Object]". Every request then
 * went to a *relative* URL, which React Native resolves against the
 * bundle's origin — so the app quietly asked Metro on :8081 for
 * `/api/mobile/auth/login` and showed the reader a 404 nothing could
 * explain. Checking the type is what makes a wrong config loud instead.
 */
const configured = Constants.expoConfig?.extra?.apiUrl;

export const API_BASE: string =
  typeof configured === "string" && configured.length > 0
    ? configured
    : __DEV__
      ? "http://localhost:3000"
      : PRODUCTION;

export type Shelf = "WANT_TO_READ" | "READING" | "READ" | "ABANDONED";

export const SHELVES: Shelf[] = ["READING", "WANT_TO_READ", "READ", "ABANDONED"];

/**
 * Shelf names, taken from the web app's own dictionary
 * (`src/i18n/dictionaries/uk.ts`, the `shelves` block) rather than invented
 * here. Two surfaces of one product calling the same shelf different names
 * is the kind of difference nobody reports and everybody notices.
 */
export const SHELF_LABELS: Record<Shelf, string> = {
  READING: "Читаю зараз",
  WANT_TO_READ: "Хочу прочитати",
  READ: "Прочитане",
  ABANDONED: "Недочитано",
};

export type Reader = {
  id: string;
  email: string;
  name: string | null;
  yearlyGoal: number | null;
};

export type ShelfBook = {
  id: string;
  shelf: Shelf;
  addedAt: string;
  finishedAt: string | null;
  pagesRead: number | null;
  totalPages: number | null;
  rating: number | null;
  book: {
    id: string;
    olid: string;
    title: string;
    author: string;
    coverUrl: string | null;
  };
};

/**
 * A failed call, carrying the server's own error key.
 *
 * The server answers with keys rather than sentences (`invalidCredentials`,
 * `tooManyAttempts`) precisely so the wording lives in the client — which
 * means the screens here own the Ukrainian, and the API stays free to be
 * called by something else later.
 */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly retryAfterMinutes?: number,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

async function call<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = init;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...rest.headers,
      },
    });
  } catch {
    // No response at all: the phone is offline, or the dev server is not
    // running. Worth its own code, because "wrong password" and "cannot
    // reach the server" need very different advice on screen.
    throw new ApiError("network", 0);
  }

  const body = (await response.json().catch(() => null)) as
    | (Partial<T> & { error?: string; retryAfterMinutes?: number })
    | null;

  if (!response.ok) {
    throw new ApiError(
      body?.error ?? "unknown",
      response.status,
      body?.retryAfterMinutes,
    );
  }

  return body as T;
}

/**
 * One book with everything on the record — including `review` and `notes`,
 * which the shelf list does not carry. Only `/api/mobile/books/[id]`
 * returns this shape.
 */
export type BookDetail = ShelfBook & {
  progressUpdated: string | null;
  ratedAt: string | null;
  review: string | null;
  reviewUpdatedAt: string | null;
  notes: string | null;
  notesUpdatedAt: string | null;
};

export function login(email: string, password: string) {
  return call<{ token: string; reader: Reader }>("/api/mobile/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe(token: string) {
  return call<{ reader: Reader; shelves: Partial<Record<Shelf, number>> }>(
    "/api/mobile/me",
    { token },
  );
}

export function fetchBooks(token: string, shelf?: Shelf) {
  const query = shelf ? `?shelf=${shelf}` : "";
  return call<{ books: ShelfBook[] }>(`/api/mobile/books${query}`, { token });
}

export function fetchBook(token: string, id: string) {
  return call<{ book: BookDetail }>(
    `/api/mobile/books/${encodeURIComponent(id)}`,
    { token },
  );
}
