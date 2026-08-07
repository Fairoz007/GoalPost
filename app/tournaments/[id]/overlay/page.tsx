"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import ReactCountryFlag from "react-country-flag";
import { getIsoFromFlagString } from "@/lib/countries";
import { useState, useEffect } from "react";

export default function OBSOverlayPage() {
  const params = useParams();
  const tournamentId = params.id as Id<"tournaments">;
  
  const tournament = useQuery(api.tournaments.getById, { id: tournamentId });
  const participants = useQuery(api.participants.getByTournament, { tournamentId });
  const matches = useQuery(api.matches.getByTournament, { tournamentId });

  // Auto-refresh the page every 20 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      window.location.reload();
    }, 20000);
    return () => clearInterval(refreshInterval);
  }, []);

  if (!tournament || !participants || !matches) {
    return null; // Don't show loading on stream
  }

  // Calculate Standings
  const standings = participants.map(p => {
    let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
    matches.forEach(m => {
      if (m.status !== "Completed") return;
      if (m.player1Id === p._id) {
        played++; gf += m.player1Score || 0; ga += m.player2Score || 0;
        if ((m.player1Score || 0) > (m.player2Score || 0)) won++; else if (m.player1Score === m.player2Score) drawn++; else lost++;
      } else if (m.player2Id === p._id) {
        played++; gf += m.player2Score || 0; ga += m.player1Score || 0;
        if ((m.player2Score || 0) > (m.player1Score || 0)) won++; else if (m.player2Score === m.player1Score) drawn++; else lost++;
      }
    });
    return { ...p, played, won, drawn, lost, points: (won * 3) + (drawn * 1), gd: gf - ga, gf, ga };
  }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden text-white font-sans p-8 flex flex-col justify-between pointer-events-none">
      
      {/* Main Content Area */}
      <div className="flex justify-between items-end w-full mt-auto">
        
        {/* Left: Full Standings Table */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="w-auto min-w-[700px] bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="bg-primary/20 px-6 py-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-primary tracking-widest uppercase">League Standings</h2>
            <span className="text-sm text-white/50 font-semibold">{tournament.name}</span>
          </div>
          <div className="p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-white/50 text-xs font-bold tracking-widest uppercase border-b border-white/5">
                  <th className="px-4 py-3 w-16 text-center">Pos</th>
                  <th className="px-4 py-3">Club / Player</th>
                  <th className="px-4 py-3 text-center w-12">MP</th>
                  <th className="px-4 py-3 text-center w-12">W</th>
                  <th className="px-4 py-3 text-center w-12">D</th>
                  <th className="px-4 py-3 text-center w-12">L</th>
                  <th className="px-4 py-3 text-center w-12">GF</th>
                  <th className="px-4 py-3 text-center w-12">GA</th>
                  <th className="px-4 py-3 text-center w-16">GD</th>
                  <th className="px-4 py-3 text-center w-16 text-primary">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, idx) => {
                  const iso = getIsoFromFlagString(team.flag);
                  return (
                    <tr key={team._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-center">
                        <span className="text-white/80 font-black text-lg">{idx + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {iso && <ReactCountryFlag countryCode={iso} svg style={{ width: '28px', height: '20px' }} />}
                          <span className="font-bold text-sm tracking-wide">{team.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-white/70">{team.played}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-white/70">{team.won}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-white/70">{team.drawn}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-white/70">{team.lost}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-white/70">{team.gf}</td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-white/70">{team.ga}</td>
                      <td className="px-4 py-3 text-center text-sm font-bold">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                      <td className="px-4 py-3 text-center text-base font-black text-primary">{team.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
