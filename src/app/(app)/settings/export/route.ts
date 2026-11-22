import { exportReader } from "@/lib/data-export";
import { getCurrentUser } from "@/lib/session";

/**
 * The reader's own data as a file. Behind the session, and it only ever
 * builds the caller's own — there is no id in the URL to tamper with.
 *
 * A route handler rather than a server action because the answer is a
 * download: an action can hand back a string, but then the browser has to be
 * talked into saving it, and a plain link with `Content-Disposition` is
 * already what a browser does well.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const data = await exportReader(user.id);
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="chytalnia-${stamp}.json"`,
      // Reviews and private notes are in here; no cache should keep a copy.
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
