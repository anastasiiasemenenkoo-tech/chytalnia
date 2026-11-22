"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";

import { createYearShare, revokeYearShare } from "@/actions/year-share";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDict } from "@/i18n/provider";

const subscribeNever = () => () => {};
const readOrigin = () => window.location.origin;
const readNoOrigin = () => "";

/**
 * The link that opens this reader's year to anyone holding it.
 *
 * Off until asked for, and revocable: the row behind the token is deleted
 * and the address stops resolving. The body text says plainly what a
 * visitor will see, because consent to share is worth nothing if the person
 * giving it has to guess what they are giving away.
 */
export function ShareLinkCard({
  year,
  initialToken,
}: {
  year: number;
  initialToken: string | null;
}) {
  const dict = useDict();
  const [token, setToken] = useState(initialToken);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  // Only the browser knows which host this is being read on. Read in an
  // effect this was a second render of the whole card for one string;
  // `useSyncExternalStore` is how React 19 wants a value that exists on the
  // client and not on the server — the server snapshot is the empty string,
  // so the first paint matches the HTML and there is nothing to hydrate
  // around. The store never changes, so it never subscribes to anything.
  const origin = useSyncExternalStore(subscribeNever, readOrigin, readNoOrigin);

  const url = token && origin ? `${origin}/y/${token}` : "";

  async function create() {
    setBusy(true);
    const res = await createYearShare(year);
    setBusy(false);
    if (res.ok) setToken(res.token);
    else toast.error(res.error);
  }

  async function revoke() {
    setBusy(true);
    const res = await revokeYearShare(year);
    setBusy(false);
    if (res.ok) {
      setToken(null);
      setCopied(false);
      toast.success(dict.year.shareLinkRevoked);
    } else {
      toast.error(res.error);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(dict.year.shareLinkFailed);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">{dict.year.shareLinkBody}</p>

      {token ? (
        <>
          <div className="flex gap-2">
            <Input readOnly value={url} className="font-mono text-xs" />
            <Button
              type="button"
              variant="outline"
              onClick={copy}
              disabled={!url}
            >
              {copied ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copied ? dict.year.shareLinkCopied : dict.year.shareLinkCopy}
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground -ml-2"
            onClick={revoke}
            disabled={busy}
          >
            {busy ? dict.year.shareLinkRevoking : dict.year.shareLinkRevoke}
          </Button>
        </>
      ) : (
        <Button type="button" variant="outline" onClick={create} disabled={busy}>
          <Link2 className="mr-2 h-4 w-4" />
          {busy ? dict.year.shareLinkCreating : dict.year.shareLinkCreate}
        </Button>
      )}
    </div>
  );
}
