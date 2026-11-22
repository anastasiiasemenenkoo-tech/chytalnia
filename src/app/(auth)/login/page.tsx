import { LoginForm } from "@/components/auth/login-form";
import { getDictionary } from "@/i18n";
import { isGoogleRefusal } from "@/lib/google-identity";
import { safePath } from "@/lib/safe-path";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; next?: string; error?: string }>;
}) {
  const { reset, next, error } = await searchParams;
  const dict = await getDictionary();

  // Two kinds of thing arrive in `error`: the reasons the Google sign-in
  // turns somebody away, which have something useful to say, and Auth.js's
  // own names for its own problems — `Configuration` when a key is missing,
  // for one — which do not. Those used to land here and show nothing at all.
  const refusal = error
    ? isGoogleRefusal(error)
      ? dict.auth.googleRefused[error]
      : dict.auth.googleRefused.unknown
    : null;

  // `next` is where the proxy turned them away from — a club invite, most
  // often. Checked here as well as where it is used: an unusable value
  // should not reach the form as a hidden field at all.
  return (
    <LoginForm
      justReset={reset === "1"}
      next={safePath(next)}
      refusal={refusal}
    />
  );
}
