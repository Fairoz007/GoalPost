"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Trophy, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  const tournaments = useQuery(api.tournaments.get);

  return (
    <div className="flex min-h-screen flex-col items-center py-24 px-4 text-center">
      <Trophy className="mb-6 size-16 text-primary" />
      <h1 className="text-balance font-display text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
        eFootball <span className="text-primary text-glow">Tournaments</span>
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Live standings, brackets, and fixtures for our eFootball community.
      </p>

      <div className="mt-8 flex gap-4">
        <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
          Manage Tournaments
        </Link>
      </div>

      <div className="mt-20 w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-6 text-left">Live & Upcoming Tournaments</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {tournaments === undefined ? (
            <p className="text-muted-foreground">Loading tournaments...</p>
          ) : tournaments.length === 0 ? (
            <p className="text-muted-foreground text-left">No tournaments found.</p>
          ) : (
            tournaments.map((t) => (
              <Link
                key={t._id}
                href={`/tournaments/${t._id}`}
                className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50 text-left"
              >
                <div className="flex w-full justify-between items-start">
                  <h3 className="font-semibold text-lg">{t.name}</h3>
                  <Badge variant={t.status === "Live" || t.status === "Ongoing" ? "default" : "secondary"}>
                    {t.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{t.format} • {new Date(t.startDate).toLocaleDateString()}</p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
