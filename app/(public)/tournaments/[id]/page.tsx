"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Globe, Users, Goal, Swords, Trophy, Activity, Medal, Star, Shield, Flame, ChevronRight, TrendingUp } from "lucide-react";
import ReactCountryFlag from "react-country-flag";
import { getIsoFromFlagString, getNameFromFlagString } from "@/lib/countries";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function PublicTournamentPage() {
  const params = useParams();
  const tournamentId = params.id as Id<"tournaments">;

  const tournament = useQuery(api.tournaments.getById, { id: tournamentId });
  const participants = useQuery(api.participants.getByTournament, { tournamentId });
  const matches = useQuery(api.matches.getByTournament, { tournamentId });

  if (tournament === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090C13]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00E676]"></div>
      </div>
    );
  }

  if (tournament === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090C13]">
        <div className="text-white text-xl">Tournament not found</div>
      </div>
    );
  }

  // Calculate Standings & Form
  const standings = participants?.map(p => {
    let played = 0, won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
    
    // Sort matches by date for accurate form calculation
    const playerMatches = matches
      ?.filter(m => m.status === "Completed" && (m.player1Id === p._id || m.player2Id === p._id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

    const form: ("W" | "D" | "L")[] = [];

    playerMatches.forEach(m => {
      if (m.player1Score === undefined || m.player2Score === undefined) return;
      
      const isPlayer1 = m.player1Id === p._id;
      const myScore = isPlayer1 ? m.player1Score : m.player2Score;
      const theirScore = isPlayer1 ? m.player2Score : m.player1Score;

      played++;
      gf += myScore;
      ga += theirScore;
      
      if (myScore > theirScore) {
        won++;
        form.push("W");
      } else if (myScore === theirScore) {
        drawn++;
        form.push("D");
      } else {
        lost++;
        form.push("L");
      }
    });

    const gd = gf - ga;
    const points = (won * 3) + (drawn * 1);
    
    // Keep only last 5 for form
    const recentForm = form.slice(-5);

    return { ...p, played, won, drawn, lost, gf, ga, gd, points, form: recentForm };
  }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf) || [];

  // Tournament Aggregates
  const completedMatches = matches?.filter(m => m.status === "Completed") || [];
  const upcomingMatches = matches?.filter(m => m.status === "Scheduled") || [];
  const liveMatches = matches?.filter(m => m.status === "Live") || [];

  let totalGoals = 0;
  let biggestWinStr = "-";
  let maxGd = -1;

  completedMatches.forEach(m => {
    if (m.player1Score !== undefined && m.player2Score !== undefined) {
      totalGoals += (m.player1Score + m.player2Score);
      const diff = Math.abs(m.player1Score - m.player2Score);
      if (diff > maxGd) {
        maxGd = diff;
        biggestWinStr = `${Math.max(m.player1Score, m.player2Score)}-${Math.min(m.player1Score, m.player2Score)}`;
      }
    }
  });

  const avgGoals = completedMatches.length > 0 ? (totalGoals / completedMatches.length).toFixed(1) : "0";

  // Podium
  const top3 = standings.slice(0, 3);
  const podiumColors = ["text-[#FFC107]", "text-[#B0BEC5]", "text-[#CD7F32]"];
  const podiumBorders = ["border-[#FFC107]/50", "border-[#B0BEC5]/50", "border-[#CD7F32]/50"];
  const podiumGradients = [
    "from-[#FFC107]/10 to-transparent",
    "from-[#B0BEC5]/10 to-transparent",
    "from-[#CD7F32]/10 to-transparent"
  ];

  return (
    <div className="min-h-screen bg-[#090C13] text-white selection:bg-[#00E676]/30 font-sans pb-24">
      {/* Hero Section */}
      <div className="relative w-full border-b border-white/10 bg-[#131A24] overflow-hidden">
        {/* Abstract Background patterns */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#00E676] rounded-full blur-[120px]"></div>
          <div className="absolute top-20 -left-20 w-72 h-72 bg-[#00BFFF] rounded-full blur-[100px]"></div>
          {/* Subtle grid */}
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 relative z-10 flex flex-col items-center text-center">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
            <Trophy className="h-16 w-16 mx-auto text-[#00E676] mb-6 drop-shadow-[0_0_15px_rgba(0,230,118,0.5)]" />
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">{tournament.name}</h1>
            <div className="flex flex-wrap justify-center gap-4 text-sm md:text-base font-medium text-white/70 mb-8">
              <span className="flex items-center"><Activity className="w-4 h-4 mr-2" />{tournament.format}</span>
              <span>•</span>
              <span className="flex items-center"><Flame className="w-4 h-4 mr-2" />{tournament.status}</span>
              <span>•</span>
              <span className="flex items-center"><Users className="w-4 h-4 mr-2" />{participants?.length || 0} Players</span>
            </div>
            
            <div className="flex justify-center mt-6">
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/tournaments/${tournamentId}/overlay`;
                  navigator.clipboard.writeText(url);
                  alert("OBS Overlay URL copied to clipboard! Paste it as a Browser Source in OBS.");
                }}
                className="flex items-center gap-2 bg-[#00E676]/20 text-[#00E676] hover:bg-[#00E676]/30 border border-[#00E676]/50 px-6 py-2 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(0,230,118,0.2)]"
              >
                <Globe className="w-4 h-4" />
                Copy OBS Overlay URL
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        
        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xl font-bold mb-6 flex items-center tracking-wide uppercase text-white/80">
              <Medal className="w-5 h-5 mr-3 text-[#00E676]" /> Top 3 Players
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {top3.map((player, idx) => (
                <motion.div 
                  key={player._id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1, duration: 0.4 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className={cn(
                    "relative overflow-hidden rounded-2xl bg-[#131A24] border p-6 flex flex-col items-center text-center",
                    podiumBorders[idx]
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-b opacity-50 pointer-events-none", podiumGradients[idx])}></div>
                  <div className="relative z-10 w-full flex justify-between items-start mb-4">
                    <span className={cn("text-3xl font-black drop-shadow-md", podiumColors[idx])}>
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                    </span>
                    <Badge variant="outline" className="bg-black/40 border-white/10 text-white font-mono">
                      {player.points} PTS
                    </Badge>
                  </div>
                  
                  <div className="relative z-10 mb-2">
                    {getIsoFromFlagString(player.flag) ? (
                      <div className="w-16 h-12 rounded-lg overflow-hidden shadow-lg border border-white/10 mx-auto mb-4">
                        <ReactCountryFlag 
                          countryCode={getIsoFromFlagString(player.flag)!} 
                          svg 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <Globe className="w-6 h-6 text-white/40" />
                      </div>
                    )}
                    <h3 className="text-xl font-bold truncate px-2">{player.name}</h3>
                  </div>
                  
                  <div className="relative z-10 flex gap-4 mt-auto pt-4 border-t border-white/10 w-full justify-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">GD</span>
                      <span className="font-bold text-[#00E676]">{player.gd > 0 ? `+${player.gd}` : player.gd}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-white/50 uppercase tracking-wider">Matches</span>
                      <span className="font-bold">{player.played}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-3">
          
          {/* Standings Table */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center tracking-wide uppercase text-white/80">
              <Trophy className="w-5 h-5 mr-3 text-[#00E676]" /> Standings
            </h2>
            <div className="rounded-2xl border border-white/10 bg-[#131A24] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-black/20 text-white/50 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                      <th className="py-4 px-6 w-12 text-center">#</th>
                      <th className="py-4 px-4">Player</th>
                      <th className="py-4 px-3 text-center hidden sm:table-cell">P</th>
                      <th className="py-4 px-3 text-center">GD</th>
                      <th className="py-4 px-4 text-center">Form</th>
                      <th className="py-4 px-6 text-right font-bold text-[#00E676]">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {standings.map((row, i) => {
                      const iso = getIsoFromFlagString(row.flag);
                      const isTop3 = i < 3;
                      return (
                        <motion.tr 
                          key={row._id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          <td className="py-4 px-6 text-center">
                            <span className={cn(
                              "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                              i === 0 ? "bg-[#FFC107]/20 text-[#FFC107]" :
                              i === 1 ? "bg-[#B0BEC5]/20 text-[#B0BEC5]" :
                              i === 2 ? "bg-[#CD7F32]/20 text-[#CD7F32]" :
                              "text-white/40 group-hover:text-white"
                            )}>
                              {i + 1}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-medium flex items-center gap-3">
                            {iso ? (
                              <div className="h-5 w-7 overflow-hidden rounded-[4px] shadow-sm flex-shrink-0">
                                <ReactCountryFlag countryCode={iso} svg style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <Globe className="h-5 w-5 text-white/40 flex-shrink-0" />
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-white tracking-wide text-base">{row.name}</span>
                              {row.teamName && <span className="text-[10px] text-white/40 uppercase">{row.teamName}</span>}
                            </div>
                          </td>
                          <td className="py-4 px-3 text-center text-white/50 hidden sm:table-cell font-mono">{row.played}</td>
                          <td className="py-4 px-3 text-center">
                            <Badge variant="outline" className={cn(
                              "bg-transparent border-transparent",
                              row.gd > 0 ? "text-[#00E676]" : row.gd < 0 ? "text-red-400" : "text-white/50"
                            )}>
                              {row.gd > 0 ? `+${row.gd}` : row.gd}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {row.form.length === 0 ? (
                                <span className="text-white/30 text-xs">-</span>
                              ) : (
                                row.form.map((f, idx) => (
                                  <span key={idx} title={f} className={cn(
                                    "w-2.5 h-2.5 rounded-full",
                                    f === "W" ? "bg-[#00E676]" : f === "D" ? "bg-yellow-500" : "bg-red-500"
                                  )}></span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right font-black text-lg text-white group-hover:text-[#00E676] transition-colors font-mono">
                            {row.points}
                          </td>
                        </motion.tr>
                      );
                    })}
                    {standings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-white/40">No participants found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tournament Stats */}
            <h2 className="text-xl font-bold flex items-center tracking-wide uppercase text-white/80 mt-12 pt-4">
              <TrendingUp className="w-5 h-5 mr-3 text-[#00BFFF]" /> Tournament Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#131A24] border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:border-white/20 transition-colors">
                <Swords className="w-6 h-6 text-white/40 mb-2" />
                <span className="text-3xl font-black">{completedMatches.length}</span>
                <span className="text-xs text-white/50 uppercase tracking-wider mt-1">Matches Played</span>
              </div>
              <div className="bg-[#131A24] border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:border-white/20 transition-colors">
                <Goal className="w-6 h-6 text-white/40 mb-2" />
                <span className="text-3xl font-black">{totalGoals}</span>
                <span className="text-xs text-white/50 uppercase tracking-wider mt-1">Total Goals</span>
              </div>
              <div className="bg-[#131A24] border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:border-white/20 transition-colors">
                <Activity className="w-6 h-6 text-white/40 mb-2" />
                <span className="text-3xl font-black">{avgGoals}</span>
                <span className="text-xs text-white/50 uppercase tracking-wider mt-1">Avg Goals</span>
              </div>
              <div className="bg-[#131A24] border border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:border-white/20 transition-colors">
                <Star className="w-6 h-6 text-[#FFC107] mb-2" />
                <span className="text-xl font-black flex-1 flex items-center">{biggestWinStr}</span>
                <span className="text-xs text-white/50 uppercase tracking-wider mt-1">Biggest Win</span>
              </div>
            </div>
          </div>

          {/* Right Column: Matches */}
          <div className="space-y-8">
            
            {/* Live Matches */}
            {liveMatches.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center tracking-wide uppercase text-white">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse mr-3"></div>
                  Live Now
                </h2>
                {liveMatches.map(match => {
                  const p1 = participants?.find(p => p._id === match.player1Id);
                  const p2 = participants?.find(p => p._id === match.player2Id);
                  
                  return (
                    <div key={match._id} className="relative rounded-2xl border border-red-500/30 bg-[#131A24] p-5 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none"></div>
                      <div className="flex justify-between items-center relative z-10">
                        <div className="flex flex-col gap-4 w-full">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg">{p1?.name}</span>
                            <span className="font-black text-2xl text-red-500">{match.player1Score ?? 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-lg">{p2?.name}</span>
                            <span className="font-black text-2xl text-red-500">{match.player2Score ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Latest Matches */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center tracking-wide uppercase text-white/80">
                <Shield className="w-5 h-5 mr-3 text-white/50" /> Latest Results
              </h2>
              <div className="space-y-3">
                {completedMatches.slice(0, 5).map(match => {
                  const p1 = participants?.find(p => p._id === match.player1Id);
                  const p2 = participants?.find(p => p._id === match.player2Id);
                  const isP1Winner = (match.player1Score || 0) > (match.player2Score || 0);
                  const isP2Winner = (match.player2Score || 0) > (match.player1Score || 0);
                  
                  return (
                    <motion.div 
                      key={match._id} 
                      whileHover={{ scale: 1.02 }}
                      className="rounded-xl border border-white/5 bg-[#131A24] p-4 flex flex-col transition-all hover:border-white/20"
                    >
                      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-3 flex justify-between">
                        <span>{match.round || 'Group Stage'}</span>
                        <span>{new Date(match.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn("font-medium", isP1Winner ? "text-white font-bold" : "text-white/60")}>
                          {p1?.name}
                        </span>
                        <span className={cn("font-mono font-bold", isP1Winner ? "text-[#00E676]" : "text-white/60")}>
                          {match.player1Score}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={cn("font-medium", isP2Winner ? "text-white font-bold" : "text-white/60")}>
                          {p2?.name}
                        </span>
                        <span className={cn("font-mono font-bold", isP2Winner ? "text-[#00E676]" : "text-white/60")}>
                          {match.player2Score}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
                {completedMatches.length === 0 && (
                  <div className="rounded-xl border border-white/5 bg-black/20 p-8 text-center text-white/40 text-sm">
                    No completed matches yet.
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Matches */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center tracking-wide uppercase text-white/80">
                <ChevronRight className="w-5 h-5 mr-2 text-white/50" /> Upcoming
              </h2>
              <div className="space-y-3">
                {upcomingMatches.slice(0, 3).map(match => {
                  const p1 = participants?.find(p => p._id === match.player1Id);
                  const p2 = participants?.find(p => p._id === match.player2Id);
                  
                  return (
                    <div key={match._id} className="rounded-xl border border-white/5 bg-black/20 p-4">
                      <div className="text-center font-bold text-white/80 mb-1">{p1?.name}</div>
                      <div className="text-center text-xs text-white/30 font-bold my-1">VS</div>
                      <div className="text-center font-bold text-white/80">{p2?.name}</div>
                      <div className="text-center mt-3 pt-3 border-t border-white/5 text-[10px] text-[#00BFFF] uppercase tracking-wider">
                        {new Date(match.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
                {upcomingMatches.length === 0 && (
                  <div className="rounded-xl border border-white/5 bg-black/20 p-8 text-center text-white/40 text-sm">
                    No upcoming fixtures scheduled.
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
