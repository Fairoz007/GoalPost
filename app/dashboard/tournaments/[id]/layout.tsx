"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";

import { TournamentHeader } from "@/components/dashboard/tournament/tournament-header";
import { TournamentTabs } from "@/components/dashboard/tournament/tournament-tabs";
import { FAB } from "@/components/dashboard/tournament/fab";

export default function TournamentLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as Id<"tournaments">;
  
  const isInvalidId = !tournamentId || tournamentId === "undefined";
  const tournament = useQuery(api.tournaments.getOwnedById, isInvalidId ? "skip" : { id: tournamentId });

  useEffect(() => {
    if (isInvalidId) router.replace("/dashboard/tournaments");
  }, [isInvalidId, router]);

  if (isInvalidId) {
    return null;
  }

  if (tournament === undefined) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground animate-pulse font-display tracking-wider">LOADING TOURNAMENT...</p>
        </div>
      </div>
    );
  }

  if (tournament === null) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-muted-foreground">
        Tournament not found.
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground pb-24">
      <TournamentHeader 
        name={tournament.name}
        type={tournament.format}
        status={tournament.status}
        startDate={tournament.startDate}
        publicHref={tournament.slug ? `/tournament/${tournament.slug}` : `/tournaments/${tournamentId}`}
        settingsHref={`/dashboard/tournaments/${tournamentId}/settings`}
        gameName={tournament.gameId === "valorant" ? "VALORANT" : "eFootball"}
      />

      <TournamentTabs 
        tournamentId={tournamentId} 
        format={tournament.format}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-4">
        {children}
      </div>

      <FAB />
    </div>
  );
}
