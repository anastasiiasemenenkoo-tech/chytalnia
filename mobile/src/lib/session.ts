import { useCallback, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import { fetchMe, type Reader } from "@/lib/api";

/**
 * The bearer token, kept in the iOS keychain rather than in AsyncStorage.
 *
 * The token is a password equivalent — it is good for thirty days and names
 * the reader — so it belongs somewhere the operating system encrypts.
 * `expo-secure-store` is included in Expo Go, so this needs no development
 * build to try. Note that on iOS keychain entries survive a reinstall of the
 * same bundle id, which is why signing out deletes the key explicitly
 * instead of trusting the app's own lifetime.
 */
const TOKEN_KEY = "chytalnia.token";

export async function storeToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function readToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export type SessionState =
  /** Still reading the keychain — show nothing rather than a wrong screen. */
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; token: string; reader: Reader };

/**
 * Restores the session on launch and keeps it for the screens.
 *
 * A stored token is not trusted on sight: `/api/mobile/me` is called once to
 * see whether it is still valid. A thirty-day token outlives a deleted
 * account and a rotated `AUTH_SECRET`, and the alternative is an app that
 * shows an empty shelf and no explanation.
 */
export function useSession() {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  const signIn = useCallback(async (token: string, reader: Reader) => {
    await storeToken(token);
    setState({ status: "signedIn", token, reader });
  }, []);

  const signOut = useCallback(async () => {
    await clearToken();
    setState({ status: "signedOut" });
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await readToken();
      if (!token) {
        if (!cancelled) setState({ status: "signedOut" });
        return;
      }

      try {
        const { reader } = await fetchMe(token);
        if (!cancelled) setState({ status: "signedIn", token, reader });
      } catch {
        // Expired, revoked, or unreachable. Either way there is nothing to
        // show behind it, so throw the token away and ask again.
        await clearToken();
        if (!cancelled) setState({ status: "signedOut" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { state, signIn, signOut };
}
