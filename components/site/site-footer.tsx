import Link from "next/link";
import { Logo } from "./logo";
import { Cloud } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#090909]">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
            The competitive esports home for eFootball and VALORANT tournaments.
            Powered by PowerWex Cloud.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <Cloud className="size-3.5" /> PowerWex Cloud Connected
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <Link href="/tournaments">Tournaments</Link>
          <Link href="/games">Games</Link>
          <Link href="/rankings">Rankings</Link>
          <Link href="/dashboard/tournaments" prefetch={false}>Organizer Portal</Link>
        </nav>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © 2026 PowerWex EG Tournament Cloud. All rights reserved.
      </div>
    </footer>
  );
}
