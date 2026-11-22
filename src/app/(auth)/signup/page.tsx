import { SignupForm } from "@/components/auth/signup-form";
import { safePath } from "@/lib/safe-path";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <SignupForm next={safePath(next)} />;
}
