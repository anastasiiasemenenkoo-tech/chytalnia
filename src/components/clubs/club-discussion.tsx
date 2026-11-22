import { CommentForm } from "@/components/clubs/comment-form";
import { CommentThread } from "@/components/clubs/comment-thread";
import { VisibilityNote } from "@/components/shell/visibility-note";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary, getLocale } from "@/i18n";
import { prisma } from "@/lib/db";

export async function ClubDiscussion({
  clubId,
  currentUserId,
  isOwner,
}: {
  clubId: string;
  currentUserId: string;
  isOwner: boolean;
}) {
  const dict = await getDictionary();
  const locale = await getLocale();

  const comments = await prisma.clubComment.findMany({
    where: { clubId, parentId: null },
    include: {
      author: { select: { name: true } },
      replies: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  function fmt(date: Date) {
    return date.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.clubs.discussionTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          {/* Before the box, not after it: by the time someone has written
              something, telling them who will read it is too late. */}
          <VisibilityNote>{dict.clubs.openWarningDiscussion}</VisibilityNote>
          <CommentForm clubId={clubId} />
        </div>
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {dict.clubs.discussionEmpty}
          </p>
        ) : (
          <ul className="space-y-6">
            {comments.map((c) => (
              <CommentThread
                key={c.id}
                clubId={clubId}
                comment={{
                  id: c.id,
                  body: c.body,
                  createdAt: fmt(c.createdAt),
                  author: c.author,
                  canDelete: c.authorId === currentUserId || isOwner,
                }}
                replies={c.replies.map((r) => ({
                  id: r.id,
                  body: r.body,
                  createdAt: fmt(r.createdAt),
                  author: r.author,
                  canDelete: r.authorId === currentUserId || isOwner,
                }))}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
