"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import ReactCountryFlag from "react-country-flag";
import { Globe, Trophy } from "lucide-react";
import { getIsoFromFlagString, getNameFromFlagString } from "@/lib/countries";

export default function StandingsPage() {
  const params = useParams();
  const tournamentId = params.id as Id<"tournaments">;
  const isInvalidId = !tournamentId || tournamentId === "undefined";
  
  const participants = useQuery(api.participants.getByTournament, isInvalidId ? "skip" : { tournamentId });
  const matches = useQuery(api.matches.getByTournament, isInvalidId ? "skip" : { tournamentId });

  if (participants === undefined || matches === undefined) {
    return <div className="animate-pulse space-y-4">
      <div className="h-64 bg-secondary/50 rounded-2xl w-full"></div>
    </div>;
  }

  // Calculate Standings
  const standings = participants?.map(p => {
    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let gf = 0;
    let ga = 0;

    matches?.forEach(m => {
      if (m.status !== "Completed") return;
      if (m.player1Score === undefined || m.player2Score === undefined) return;

      if (m.player1Id === p._id) {
        played++;
        gf += m.player1Score;
        ga += m.player2Score;
        if (m.player1Score > m.player2Score) won++;
        else if (m.player1Score === m.player2Score) drawn++;
        else lost++;
      } else if (m.player2Id === p._id) {
        played++;
        gf += m.player2Score;
        ga += m.player1Score;
        if (m.player2Score > m.player1Score) won++;
        else if (m.player2Score === m.player1Score) drawn++;
        else lost++;
      }
    });

    const gd = gf - ga;
    const points = (won * 3) + (drawn * 1);

    return { ...p, played, won, drawn, lost, gf, ga, gd, points };
  }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf) || [];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-semibold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Tournament Standings
          </h3>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/50 bg-background/50">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-secondary/50 text-muted-foreground border-b border-border/50">
              <tr>
                <th className="py-4 px-6 font-semibold">Pos</th>
                <th className="py-4 px-6 font-semibold">Club / Player</th>
                <th className="py-4 px-4 font-semibold text-center" title="Played">MP</th>
                <th className="py-4 px-4 font-semibold text-center" title="Won">W</th>
                <th className="py-4 px-4 font-semibold text-center" title="Drawn">D</th>
                <th className="py-4 px-4 font-semibold text-center" title="Lost">L</th>
                <th className="py-4 px-4 font-semibold text-center" title="Goals For">GF</th>
                <th className="py-4 px-4 font-semibold text-center" title="Goals Against">GA</th>
                <th className="py-4 px-4 font-semibold text-center" title="Goal Difference">GD</th>
                <th className="py-4 px-6 font-bold text-right text-white">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => {
                const iso = getIsoFromFlagString(row.flag);
                const name = getNameFromFlagString(row.flag);
                const isTopTwo = i < 2; // Assuming top 2 qualify
                
                return (
                  <motion.tr 
                    key={row._id} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors relative group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-base font-bold ${isTopTwo ? 'text-primary' : 'text-muted-foreground'}`}>
                          {i + 1}
                        </span>
                        {isTopTwo && (
                          <div className="w-1 h-6 bg-primary rounded-full absolute left-0" title="Qualification Zone" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium">
                      <div className="flex items-center">
                        <span className="font-semibold text-white tracking-wide">{row.name}</span>
                        {row.teamName && <span className="text-muted-foreground ml-2 text-xs uppercase tracking-wider">({row.teamName})</span>}
                        <div className="ml-3 flex items-center shrink-0" title={name || "Unknown Country"}>
                          {iso ? (
                            <div className="h-5 w-7 overflow-hidden rounded shadow-sm flex items-center justify-center bg-black/10">
                              <ReactCountryFlag countryCode={iso} svg style={{ width: '28px', height: '20px', objectFit: 'cover' }} />
                            </div>
                          ) : (
                            <Globe className="h-5 w-5 text-muted-foreground/60" />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-medium text-muted-foreground">{row.played}</td>
                    <td className="py-4 px-4 text-center font-medium text-muted-foreground">{row.won}</td>
                    <td className="py-4 px-4 text-center font-medium text-muted-foreground">{row.drawn}</td>
                    <td className="py-4 px-4 text-center font-medium text-muted-foreground">{row.lost}</td>
                    <td className="py-4 px-4 text-center font-medium text-muted-foreground">{row.gf}</td>
                    <td className="py-4 px-4 text-center font-medium text-muted-foreground">{row.ga}</td>
                    <td className="py-4 px-4 text-center font-bold">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                    <td className="py-4 px-6 text-right font-display text-lg font-bold text-white bg-secondary/20">{row.points}</td>
                  </motion.tr>
                );
              })}
              {standings.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">No participants found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {standings.length > 0 && (
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span>Qualification Zone (Top 2)</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
