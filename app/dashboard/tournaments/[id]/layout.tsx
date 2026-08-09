"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

import { TournamentHeader } from "@/components/dashboard/tournament/tournament-header";
import { TournamentTabs } from "@/components/dashboard/tournament/tournament-tabs";
import { FAB } from "@/components/dashboard/tournament/fab";

export default function TournamentLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const tournamentId = params.id as Id<"tournaments">;
  
  const isInvalidId = !tournamentId || tournamentId === "undefined";
  const tournament = useQuery(api.tournaments.getById, isInvalidId ? "skip" : { id: tournamentId });

  const [localCode, setLocalCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState("");
  
  useEffect(() => {
    if (typeof window !== "undefined" && tournamentId) {
      setLocalCode(localStorage.getItem(`admin_code_${tournamentId}`));
    }
  }, [tournamentId]);

  // Only verify if we have a code to verify
  const isVerified = useQuery(
    api.tournaments.verifyAdminCode,
    (isInvalidId || !localCode) ? "skip" : { id: tournamentId, code: localCode }
  );

  if (isInvalidId) {
    if (typeof window !== 'undefined') {
      window.location.href = "/dashboard/tournaments";
    }
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

  // If the tournament has an admin code and it's not verified yet
  if (tournament.hasAdminCode && isVerified !== true) {
    // Show a loading state while we verify the code from localStorage
    if (isVerified === undefined && localCode !== null) {
      return (
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground animate-pulse font-display tracking-wider">VERIFYING ACCESS...</p>
          </div>
        </div>
      );
    }

    const handleLogin = (e: React.FormEvent) => {
      e.preventDefault();
      if (inputCode) {
        localStorage.setItem(`admin_code_${tournamentId}`, inputCode.toUpperCase());
        setLocalCode(inputCode.toUpperCase());
      }
    };

    return (
      <div className="flex h-[80vh] items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl text-center"
        >
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Restricted Access</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            This tournament requires an Admin Passcode to manage.
          </p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              type="text" 
              placeholder="Enter passcode (e.g. XY7B9Q)" 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              className="text-center font-mono tracking-widest uppercase text-lg"
              autoFocus
            />
            {isVerified === false && localCode && (
              <p className="text-red-500 text-sm font-medium">Invalid passcode. Please try again.</p>
            )}
            <Button type="submit" className="w-full" size="lg">
              Unlock Dashboard
            </Button>
          </form>
        </motion.div>
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
