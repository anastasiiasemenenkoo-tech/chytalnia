import Link from "next/link";
import { Users } from "lucide-react";

import { JoinLeaveButton } from "@/components/clubs/join-leave-button";
import { Spine } from "@/components/decor/spine";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDictionary } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";

export async function ClubCard({
  id,
  name,
  description,
  memberCount,
  isMember,
  isOwner,
  currentlyReadingTitle,
}: {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
  isOwner: boolean;
  currentlyReadingTitle: string | null;
}) {
  const dict = await getDictionary();
  const memberLine =
    memberCount === 1
      ? dict.clubs.member
      : interpolate(dict.clubs.members, { n: memberCount });

  return (
    <Card className="flex-row gap-0 py-0">
      {/* The book the club is on, standing against the card's edge. It says
          what a "Зараз читає: …" line used to say, in the app's own alphabet. */}
      <Spine
        title={currentlyReadingTitle}
        label={
          currentlyReadingTitle
            ? `${dict.clubs.reading}: ${currentlyReadingTitle}`
            : undefined
        }
        className="w-8"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-heading text-base leading-snug font-medium">
              <Link href={`/clubs/${id}`} className="hover:underline">
                {name}
              </Link>
            </div>
            {description && (
              <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                {description}
              </p>
            )}
          </div>
          {isOwner && (
            <Badge variant="secondary" className="shrink-0">
              {dict.clubs.owner}
            </Badge>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            {memberLine}
          </span>
          <JoinLeaveButton clubId={id} isMember={isMember} isOwner={isOwner} />
        </div>
      </div>
    </Card>
  );
}
