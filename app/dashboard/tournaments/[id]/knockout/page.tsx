"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Trophy, CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactCountryFlag from "react-country-flag";
import { getIsoFromFlagString } from "@/lib/countries";

function MatchNode({ match, participants, onUpdateScore }: { match: any, participants: any[], onUpdateScore: any }) {
  if (!match) return <div className="h-[96px] w-64 rounded-xl border border-dashed border-border/50 bg-secondary/20 flex items-center justify-center text-muted-foreground text-sm">TBD</div>;

  const p1 = participants.find(p => p._id === match.player1Id);
  const p2 = participants.find(p => p._id === match.player2Id);
  const iso1 = getIsoFromFlagString(p1?.flag);
  const iso2 = getIsoFromFlagString(p2?.flag);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [score1, setScore1] = useState<string>(match.player1Score !== undefined ? String(match.player1Score) : "");
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [score2, setScore2] = useState<string>(match.player2Score !== undefined ? String(match.player2Score) : "");

  const hasChanges = (score1 !== "" && score1 !== String(match.player1Score ?? "")) || 
                     (score2 !== "" && score2 !== String(match.player2Score ?? ""));
  const canSave = score1 !== "" && score2 !== "" && hasChanges;

  return (
    <div className="w-64 rounded-xl border border-border/50 bg-card shadow-sm relative group">
      {match.status === "Completed" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 text-primary text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg pointer-events-none">
          COMPLETED
        </div>
      )}
      
      {canSave && (
        <Button
          size="icon"
          onClick={() => onUpdateScore(match._id, parseInt(score1, 10), parseInt(score2, 10))}
          className="absolute top-1/2 -right-12 -translate-y-1/2 w-8 h-8 bg-primary text-black shadow-[0_0_10px_rgba(0,210,106,0.5)] animate-in zoom-in z-20 hover:bg-primary/90"
        >
          <Save className="h-4 w-4" />
        </Button>
      )}

      {/* Player 1 */}
      <div className={`flex items-center justify-between p-2 border-b border-border/30 rounded-t-xl ${match.status === "Completed" && (match.player1Score || 0) > (match.player2Score || 0) ? 'bg-primary/10' : 'bg-secondary/20'}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          {iso1 && <ReactCountryFlag countryCode={iso1} svg style={{ width: '20px', height: '14px' }} />}
          <span className={`text-sm font-semibold truncate ${match.status === "Completed" && (match.player1Score || 0) > (match.player2Score || 0) ? 'text-white' : 'text-muted-foreground'}`}>{p1?.name || "TBD"}</span>
        </div>
        <Input 
          type="number" 
          min="0"
          value={score1}
          onChange={(e) => setScore1(e.target.value)}
          className="w-10 h-7 text-center font-bold bg-black/40 border-border/50 text-sm px-1 focus-visible:ring-primary/50"
        />
      </div>

      {/* Player 2 */}
      <div className={`flex items-center justify-between p-2 rounded-b-xl ${match.status === "Completed" && (match.player2Score || 0) > (match.player1Score || 0) ? 'bg-primary/10' : 'bg-secondary/20'}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          {iso2 && <ReactCountryFlag countryCode={iso2} svg style={{ width: '20px', height: '14px' }} />}
          <span className={`text-sm font-semibold truncate ${match.status === "Completed" && (match.player2Score || 0) > (match.player1Score || 0) ? 'text-white' : 'text-muted-foreground'}`}>{p2?.name || "TBD"}</span>
        </div>
        <Input 
          type="number" 
          min="0"
          value={score2}
          onChange={(e) => setScore2(e.target.value)}
          className="w-10 h-7 text-center font-bold bg-black/40 border-border/50 text-sm px-1 focus-visible:ring-primary/50"
        />
      </div>
    </div>
  );
}

export default function KnockoutPage() {
  const params = useParams();
  const tournamentId = params.id as Id<"tournaments">;
  const isInvalidId = !tournamentId || tournamentId === "undefined";
  
  const participants = useQuery(api.participants.getByTournament, isInvalidId ? "skip" : { tournamentId });
  const matches = useQuery(api.matches.getByTournament, isInvalidId ? "skip" : { tournamentId });
  
  const updateScore = useMutation(api.matches.updateScore);
  const generateKnockout = useMutation(api.matches.generateKnockout);
  const createFinal = useMutation(api.matches.createFinal);
  const resetKnockout = useMutation(api.matches.resetKnockout);

  if (participants === undefined || matches === undefined) {
    return <div className="animate-pulse space-y-4">
      <div className="h-96 bg-secondary/50 rounded-2xl w-full"></div>
    </div>;
  }

  const semiFinals = matches.filter(m => m.round === "Semi-Final");
  const finalMatch = matches.find(m => m.round === "Final");

  const handleGenerateBracket = async () => {
    try {
      await generateKnockout({ tournamentId });
    } catch (e: any) {
      alert(e.message || "Failed to generate bracket.");
    }
  };

  const handleCreateFinal = async () => {
    if (semiFinals.length !== 2 || semiFinals.some(m => m.status !== "Completed")) {
      alert("Both Semi-Finals must be completed first.");
      return;
    }
    
    // Determine winners
    const winners = semiFinals.map(m => {
      if ((m.player1Score || 0) > (m.player2Score || 0)) return m.player1Id;
      return m.player2Id;
    });

    await createFinal({
      tournamentId,
      player1Id: winners[0],
      player2Id: winners[1],
    });
  };

  const handleResetBracket = async () => {
    if (confirm("Are you sure you want to reset the knockout bracket? All knockout scores will be lost.")) {
      await resetKnockout({ tournamentId });
    }
  };

  const sf1 = semiFinals[0];
  const sf2 = semiFinals[1];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-display font-semibold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent" />
            Knockout Stage
          </h3>
          
          <div className="flex items-center gap-4">
            {semiFinals.length > 0 && !finalMatch && (
              <Button onClick={handleResetBracket} variant="destructive" className="font-semibold shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                Reset Bracket
              </Button>
            )}

            {semiFinals.length === 0 && (
              <Button onClick={handleGenerateBracket} className="bg-primary text-black font-semibold shadow-[0_0_15px_rgba(0,210,106,0.2)]">
                Generate Bracket (Top 4)
              </Button>
            )}

            {semiFinals.length === 2 && !finalMatch && semiFinals.every(m => m.status === "Completed") && (
              <Button onClick={handleCreateFinal} className="bg-accent text-black font-semibold shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                Generate Final Match
              </Button>
            )}
          </div>
        </div>

        {semiFinals.length > 0 ? (
          <div className="flex items-center justify-center gap-12 py-12 px-4 overflow-x-auto">
            {/* Semi-Finals Column */}
            <div className="flex flex-col gap-16 relative z-10">
              <div className="text-center mb-4 font-display font-bold text-muted-foreground uppercase tracking-wider text-sm absolute -top-10 left-0 right-0">Semi-Finals</div>
              
              <div className="relative">
                <MatchNode match={sf1} participants={participants} onUpdateScore={(id: any, s1: any, s2: any) => updateScore({ matchId: id, player1Score: s1, player2Score: s2 })} />
                {/* Connector Line to Final */}
                <div className="absolute top-1/2 -right-6 w-6 h-[2px] bg-border/50"></div>
                <div className="absolute top-1/2 -right-6 w-[2px] h-[calc(50%+2rem)] bg-border/50"></div>
              </div>
              
              <div className="relative">
                <MatchNode match={sf2} participants={participants} onUpdateScore={(id: any, s1: any, s2: any) => updateScore({ matchId: id, player1Score: s1, player2Score: s2 })} />
                {/* Connector Line to Final */}
                <div className="absolute top-1/2 -right-6 w-6 h-[2px] bg-border/50"></div>
                <div className="absolute bottom-1/2 -right-6 w-[2px] h-[calc(50%+2rem)] bg-border/50"></div>
              </div>
            </div>

            {/* Final Column */}
            <div className="flex flex-col justify-center relative z-10 pl-6">
              <div className="text-center mb-4 font-display font-bold text-accent uppercase tracking-wider text-sm absolute top-[calc(50%-5.5rem)] left-0 right-0">Grand Final</div>
              
              <div className="relative">
                {/* Connector from Semi-Finals */}
                <div className="absolute top-1/2 -left-6 w-6 h-[2px] bg-border/50"></div>
                
                <MatchNode match={finalMatch} participants={participants} onUpdateScore={(id: any, s1: any, s2: any) => updateScore({ matchId: id, player1Score: s1, player2Score: s2 })} />
                
                {finalMatch?.status === "Completed" && (
                  <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-primary animate-pulse">
                    <Trophy className="h-10 w-10" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center text-muted-foreground flex flex-col items-center gap-4">
            <Trophy className="h-12 w-12 text-muted-foreground/30 mb-2" />
            <p>The knockout stage hasn't started yet.</p>
            <p className="text-sm max-w-md mx-auto">Once the group stage is complete, click the button above to automatically pit the Top 4 teams against each other in the Semi-Finals (1st vs 4th, 2nd vs 3rd).</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
