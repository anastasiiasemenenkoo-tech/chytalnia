import { CreateClubForm } from "@/components/clubs/create-club-form";
import { requireCurrentUser } from "@/lib/session";

export default async function NewClubPage() {
  // A page under `(app)` renders in parallel with the layout that guards it,
  // so the layout's redirect is not what keeps a signed-out visitor from
  // seeing this. The page asks for itself.
  await requireCurrentUser();

  return (
    <div className="mx-auto max-w-xl">
      <CreateClubForm />
    </div>
  );
}
