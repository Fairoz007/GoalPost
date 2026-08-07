"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Trophy, Calendar, Users, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TournamentsPage() {
  const tournaments = useQuery(api.tournaments.get);

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Tournaments</h1>
          <p className="text-muted-foreground mt-2">
            Browse all our eFootball tournaments, view standings, and track fixtures.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tournaments === undefined ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6 h-[200px] animate-pulse">
              <div className="h-6 bg-secondary/50 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-secondary/50 rounded w-1/2"></div>
              <div className="h-4 bg-secondary/50 rounded w-2/3 mt-auto"></div>
            </div>
          ))
        ) : tournaments.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border/50 bg-card/30 p-12 text-center text-muted-foreground">
            <Trophy className="mx-auto h-12 w-12 opacity-20 mb-4" />
            <p>No tournaments have been created yet.</p>
          </div>
        ) : (
          tournaments.map((t) => (
            <Link
              key={t._id}
              href={`/tournaments/${t._id}`}
              className="group flex flex-col justify-between rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(0,210,106,0.15)] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/10"></div>
              
              <div className="relative z-10">
                <div className="flex w-full justify-between items-start mb-4">
                  <Badge variant={t.status === "Live" || t.status === "Ongoing" ? "default" : "secondary"} className="mb-2">
                    {t.status}
                  </Badge>
                </div>
                
                <h3 className="font-semibold text-xl mb-2 line-clamp-2">{t.name}</h3>
                
                {t.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {t.description}
                  </p>
                )}
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-border/50 flex flex-col gap-2">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Activity className="mr-2 h-3 w-3" />
                  <span className="font-medium">{t.format}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="mr-2 h-3 w-3" />
                  <span>
                    {new Date(t.startDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
