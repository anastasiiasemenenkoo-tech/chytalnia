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

export const API_BASE: string =
  (Constants.expoConfig?.extra?.apiUrl as string | null | undefined) ??
  (__DEV__ ? "http://localhost:3000" : PRODUCTION);

export type Shelf = "WANT_TO_READ" | "READING" | "READ" | "ABANDONED";

export const SHELVES: Shelf[] = ["READING", "WANT_TO_READ", "READ", "ABANDONED"];

/** Ukrainian shelf names, mirroring `src/lib/shelf-labels.ts` on the server. */
export const SHELF_LABELS: Record<Shelf, string> = {
  READING: "Читаю",
  WANT_TO_READ: "Хочу прочитати",
  READ: "Прочитано",
  ABANDONED: "Покинуто",
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
