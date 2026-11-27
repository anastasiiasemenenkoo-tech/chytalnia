import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import { ApiError, fetchMe, type Reader } from "@/lib/api";

/**
 * The bearer token, kept in the iOS keychain rather than in AsyncStorage.
 *
 * The token is a password equivalent — it is good for thirty days and names
 * the reader — so it belongs somewhere the operating system encrypts.
 * `expo-secure-store` is included in Expo Go, so this needs no development
 * build to try. Note that on iOS keychain entries survive a reinstall of the
 * same bundle id, which is why signing out deletes the keys explicitly
 * instead of trusting the app's own lifetime.
 */
const TOKEN_KEY = "chytalnia.token";

/**
 * The reader, cached beside the token.
 *
 * Not for secrecy — a name and an address are not secrets — but so the app
 * has something to open with. Without it the only way to know who is signed
 * in is to ask the server, and then a launch with no signal has nothing to
 * render but the login form.
 */
const READER_KEY = "chytalnia.reader";

export async function storeSession(token: string, reader: Reader) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(READER_KEY, JSON.stringify(reader));
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(READER_KEY);
}

async function readSession(): Promise<{ token: string; reader: Reader } | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (!token) return null;

  const raw = await SecureStore.getItemAsync(READER_KEY);
  if (!raw) return null;

  try {
    return { token, reader: JSON.parse(raw) as Reader };
  } catch {
    // Written by an older build, or truncated. The token may still be good,
    // but there is nothing to show beside it, so start over.
    return null;
  }
}

export type SessionState =
  /** Still reading the keychain — show nothing rather than a wrong screen. */
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; token: string; reader: Reader };

/**
 * Restores the session on launch and keeps it for the screens.
 *
 * A stored session opens the app immediately, and `/api/mobile/me` is then
 * asked whether it is still good — in that order, not the other way round.
 *
 * Only a 401 signs the reader out. The first version of this cleared the
 * token whenever that call threw, which reads as prudent and is not: a phone
 * in a tunnel, a laptop asleep, a dev server a second from ready all throw
 * the same way, and the reader came back to a login form with no explanation
 * and a thirty-day token in the bin. Being unreachable is not being
 * unauthorised, and the difference is a whole session.
 */
export function useSession() {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  const signIn = useCallback(async (token: string, reader: Reader) => {
    await storeSession(token, reader);
    setState({ status: "signedIn", token, reader });
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setState({ status: "signedOut" });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await readSession();
      if (!stored) {
        if (!cancelled) setState({ status: "signedOut" });
        return;
      }

      // Open on what we already know.
      if (!cancelled) setState({ status: "signedIn", ...stored });

      try {
        const { reader } = await fetchMe(stored.token);
        if (!cancelled) {
          setState({ status: "signedIn", token: stored.token, reader });
          await SecureStore.setItemAsync(READER_KEY, JSON.stringify(reader));
        }
      } catch (e) {
        // Expired or revoked: the token is genuinely no good any more.
        if (e instanceof ApiError && e.status === 401) {
          await clearSession();
          if (!cancelled) setState({ status: "signedOut" });
        }
        // Anything else — no signal, server down, a 500 — leaves the session
        // alone. The screens show their own error and a pull to refresh.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { state, signIn, signOut };
}
