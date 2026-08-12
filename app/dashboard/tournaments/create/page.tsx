import Link from "next/link";
import { ArrowRight, Crosshair, Gamepad2 } from "lucide-react";

const games = [
  { id: "valorant", name: "VALORANT", copy: "Create a match-mode tournament with dedicated rules for Scrimmage, Escalation, Unrated, or Deathmatch.", Icon: Crosshair },
  { id: "efootball", name: "E-Football", copy: "Create a player-based football tournament with formats, fixtures, and scoring configured for E-Football.", Icon: Gamepad2 },
] as const;

export default function ChooseTournamentGamePage() {
  return (
    <div className="mx-auto max-w-5xl py-10">
      <p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Tournament manager</p>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase">Choose a game</h1>
      <p className="mt-3 max-w-2xl text-muted-foreground">Each game has a separate creation URL and its own match configuration.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {games.map(({ id, name, copy, Icon }) => (
          <Link key={id} href={`/dashboard/tournaments/create/${id}`} className="group rounded-2xl border border-border bg-card p-7 transition hover:border-primary/60 hover:bg-primary/[.03]">
            <div className="flex items-start justify-between">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10"><Icon className="size-6 text-primary" /></span>
              <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
            </div>
            <h2 className="mt-12 font-display text-3xl font-bold uppercase">{name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
            <p className="mt-6 font-mono text-xs text-primary">/create/{id}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
