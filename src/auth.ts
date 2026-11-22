import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";
import { resolveGoogleSignIn } from "@/lib/google-identity";
import { LoginSchema } from "@/lib/validators";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        // Named columns, not the whole row. A `findUnique` with no `select`
        // asks for every column in the schema, so the moment a column is
        // added to `User` and its migration has not run yet, **password
        // sign-in** stops working — not just whatever the new column was
        // for. That is how `googleSub` announced itself.
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            hashedPassword: true,
          },
        });
        // Accounts created via Google have no password to check against.
        if (!user || !user.hashedPassword) return null;

        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name ?? null };
      },
    }),
    Google,
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Who the Google caller is, decided before a session exists.
     *
     * This runs here rather than in `jwt` for two reasons: it is the only
     * callback given Google's `profile`, so `email_verified` can be read at
     * all, and it is the only one that can turn somebody away — a returned
     * string becomes the redirect, so a refusal lands on the login page with
     * something to read instead of Auth.js's own English error screen.
     *
     * Both of those need Prisma, which is why none of this can live in
     * `auth.config.ts`: that config is what `src/proxy.ts` runs, in the edge
     * runtime.
     */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const outcome = await resolveGoogleSignIn(prisma, {
        sub: profile?.sub,
        email: profile?.email,
        emailVerified: profile?.email_verified,
        name: profile?.name,
      });

      if (!outcome.ok) return `/login?error=${outcome.reason}`;

      // The local row's id, not Google's. `jwt` is handed this same object,
      // so this is how the decision reaches the token — and it is why `jwt`
      // below needs no Prisma call of its own.
      user.id = outcome.userId;
      return true;
    },

    // The base config's `jwt` does exactly this, and is reused for the edge.
    // It is repeated here only because `callbacks` is spread above and this
    // file used to override it with the Google round-trip that now happens
    // in `signIn`.
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
  },
});
