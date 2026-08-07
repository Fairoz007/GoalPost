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

  const [pageIndex, setPageIndex] = useState(0);

  // Auto-cycle matches every 10 seconds
  useEffect(() => {
    if (!matches) return;
    const completedMatches = matches.filter(m => m.status === "Completed");
    if (completedMatches.length <= 4) return;
    
    const interval = setInterval(() => {
      setPageIndex((prev) => (prev + 1) % Math.ceil(completedMatches.length / 4));
    }, 10000);
    return () => clearInterval(interval);
  }, [matches]);

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
    return { ...p, played, points: (won * 3) + (drawn * 1), gd: gf - ga, gf };
  }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

  const topTeams = standings.slice(0, 5);
  
  const completedMatches = matches.filter(m => m.status === "Completed");
  const visibleMatches = completedMatches.slice(pageIndex * 4, (pageIndex + 1) * 4);

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden text-white font-sans p-8 flex flex-col justify-between pointer-events-none">
      
      {/* Main Content Area */}
      <div className="flex justify-between items-end w-full mt-auto">
        
        {/* Left: Standings */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="w-80 bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="bg-primary/20 px-4 py-3 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-lg font-bold text-primary tracking-wide uppercase">Top Teams</h2>
            <span className="text-xs text-white/50">{tournament.name}</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {topTeams.map((team, idx) => {
              const iso = getIsoFromFlagString(team.flag);
              return (
                <div key={team._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white/50 font-bold text-sm w-4">{idx + 1}</span>
                    {iso && <ReactCountryFlag countryCode={iso} svg style={{ width: '24px', height: '18px' }} />}
                    <span className="font-semibold truncate max-w-[120px]">{team.name}</span>
                  </div>
                  <span className="font-bold text-primary">{team.points} pts</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Right: Cycling Recent Matches */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
          className="w-96 flex flex-col gap-4 relative h-[320px]"
        >
          {completedMatches.length > 0 && (
            <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl h-full flex flex-col">
              <div className="bg-blue-500/20 px-4 py-3 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-sm font-bold text-blue-400 tracking-wide uppercase">Recent Results</h2>
                <div className="flex gap-1">
                  {Array.from({ length: Math.ceil(completedMatches.length / 4) }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === pageIndex ? 'bg-blue-400' : 'bg-white/20'}`}></div>
                  ))}
                </div>
              </div>
              <div className="p-4 flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pageIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-3 absolute inset-0 p-4"
                  >
                    {visibleMatches.map(m => {
                      const p1 = participants.find(p => p._id === m.player1Id);
                      const p2 = participants.find(p => p._id === m.player2Id);
                      const iso1 = getIsoFromFlagString(p1?.flag);
                      const iso2 = getIsoFromFlagString(p2?.flag);
                      return (
                        <div key={m._id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                          <div className="flex items-center gap-2 w-[40%] justify-end">
                            <span className="font-semibold truncate text-sm">{p1?.name}</span>
                            {iso1 && <ReactCountryFlag countryCode={iso1} svg style={{ width: '16px' }} />}
                          </div>
                          <div className="px-2 py-0.5 bg-black rounded text-xs font-bold text-primary">
                            {m.player1Score} - {m.player2Score}
                          </div>
                          <div className="flex items-center gap-2 w-[40%] justify-start">
                            {iso2 && <ReactCountryFlag countryCode={iso2} svg style={{ width: '16px' }} />}
                            <span className="font-semibold truncate text-sm">{p2?.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
