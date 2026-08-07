"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import { FixturesTable } from "@/components/dashboard/tournament/fixtures-table";

export default function FixturesPage() {
  const params = useParams();
  const tournamentId = params.id as Id<"tournaments">;
  const isInvalidId = !tournamentId || tournamentId === "undefined";
  
  const tournament = useQuery(api.tournaments.getById, isInvalidId ? "skip" : { id: tournamentId });
  const participants = useQuery(api.participants.getByTournament, isInvalidId ? "skip" : { tournamentId });
  const matches = useQuery(api.matches.getByTournament, isInvalidId ? "skip" : { tournamentId });
  
  const updateScore = useMutation(api.matches.updateScore);
  const generateMatches = useMutation(api.matches.generateGroupMatches);

  if (tournament === undefined || participants === undefined || matches === undefined) {
    return <div className="animate-pulse space-y-4">
      <div className="h-64 bg-secondary/50 rounded-2xl w-full"></div>
    </div>;
  }

  const handleGenerateMatches = async () => {
    if (participants.length < 2) {
      alert("You need at least 2 participants to generate matches.");
      return;
    }
    await generateMatches({ tournamentId });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-semibold text-white flex items-center gap-2">
            Tournament Fixtures
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary font-bold">
              {matches.length}
            </span>
          </h3>
          
          {matches.length === 0 && tournament.format === "Single Group + Finals" && (
            <button 
              onClick={handleGenerateMatches}
              className="bg-primary text-black font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition shadow-[0_0_15px_rgba(0,210,106,0.2)]"
            >
              Generate All Matches
            </button>
          )}
        </div>

        {matches.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-4">
            <p>No fixtures have been generated yet.</p>
            {tournament.format === "Single Group + Finals" ? (
              <button 
                onClick={handleGenerateMatches}
                className="bg-primary text-black font-semibold px-6 py-2 rounded-lg hover:bg-primary/90 transition mt-2 shadow-[0_0_15px_rgba(0,210,106,0.2)]"
              >
                Generate Round Robin Schedule
              </button>
            ) : (
              <p>Go to the Groups tab to generate matches for each group!</p>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/50 bg-background/50">
            <FixturesTable 
              matches={matches}
              participants={participants}
              onUpdateScore={(matchId, p1s, p2s) => updateScore({ matchId, player1Score: p1s, player2Score: p2s })}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
