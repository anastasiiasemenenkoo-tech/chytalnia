import { LoginForm } from "@/components/auth/login-form";
import { safePath } from "@/lib/safe-path";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; next?: string }>;
}) {
  const { reset, next } = await searchParams;
  // `next` is where the proxy turned them away from — a club invite, most
  // often. Checked here as well as where it is used: an unusable value
  // should not reach the form as a hidden field at all.
  return <LoginForm justReset={reset === "1"} next={safePath(next)} />;
}
