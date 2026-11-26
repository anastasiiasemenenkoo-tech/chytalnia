import { createContext, useContext, type ReactNode } from "react";

import { useSession } from "@/lib/session";

type SessionValue = ReturnType<typeof useSession>;

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Lives in the root layout, so the session is restored once per launch
 * rather than once per screen — two screens each calling `useSession` would
 * each hit `/api/mobile/me` and each hold their own idea of who is signed in.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSessionContext used outside SessionProvider");
  }
  return value;
}
