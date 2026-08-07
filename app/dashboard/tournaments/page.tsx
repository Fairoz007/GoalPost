"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { Plus, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TournamentsPage() {
  const tournaments = useQuery(api.tournaments.get);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Tournaments</h1>
        <Link
          href="/dashboard/tournaments/create"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Create Tournament
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tournaments === undefined ? (
          <p className="text-muted-foreground">Loading tournaments...</p>
        ) : tournaments.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center">
            <Trophy className="mx-auto mb-4 size-12 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">No tournaments yet</h3>
            <p className="mt-2 text-muted-foreground">Create your first tournament to get started.</p>
          </div>
        ) : (
          tournaments.map((tournament) => (
            <Link
              key={tournament._id}
              href={`/dashboard/tournaments/${tournament._id}`}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold group-hover:text-primary">{tournament.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{tournament.format}</p>
                </div>
                <Badge variant={tournament.status === "Upcoming" ? "secondary" : "default"}>
                  {tournament.status}
                </Badge>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Starts: {new Date(tournament.startDate).toLocaleDateString()}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
