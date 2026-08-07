"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import ReactCountryFlag from "react-country-flag";
import { Globe, CheckCircle2, Save } from "lucide-react";
import { getIsoFromFlagString, getNameFromFlagString } from "@/lib/countries";
import { format } from "date-fns";

interface FixturesTableProps {
  matches: any[];
  participants: any[];
  onUpdateScore: (matchId: Id<"matches">, p1s: number, p2s: number) => void;
}

function MatchRow({ match, idx, participants, onUpdateScore }: { match: any, idx: number, participants: any[], onUpdateScore: any }) {
  const p1 = participants?.find(p => p._id === match.player1Id);
  const p2 = participants?.find(p => p._id === match.player2Id);
  
  const isCompleted = match.status === "Completed";
  const iso1 = getIsoFromFlagString(p1?.flag);
  const iso2 = getIsoFromFlagString(p2?.flag);
  const name1 = getNameFromFlagString(p1?.flag);
  const name2 = getNameFromFlagString(p2?.flag);

  const [score1, setScore1] = useState<string>(match.player1Score !== undefined ? String(match.player1Score) : "");
  const [score2, setScore2] = useState<string>(match.player2Score !== undefined ? String(match.player2Score) : "");

  const hasChanges = (score1 !== "" && score1 !== String(match.player1Score ?? "")) || 
                     (score2 !== "" && score2 !== String(match.player2Score ?? ""));
  const canSave = score1 !== "" && score2 !== "" && hasChanges;

  const handleSave = () => {
    if (canSave) {
      onUpdateScore(match._id, parseInt(score1, 10), parseInt(score2, 10));
    }
  };

  return (
    <motion.tr 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.03 }}
      className={`group hover:bg-secondary/30 transition-colors ${isCompleted ? 'bg-secondary/10' : ''}`}
    >
      <td className="py-4 px-6">
        <div className="flex flex-col">
          <span className="font-mono text-muted-foreground">#{idx + 1}</span>
          {match.round && (
            <span className="text-[10px] uppercase font-bold text-primary mt-1">{match.round}</span>
          )}
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center justify-end gap-3">
          <div className="flex flex-col items-end">
            <span className={`font-semibold ${isCompleted && (match.player1Score || 0) > (match.player2Score || 0) ? 'text-primary' : 'text-white'}`}>
              {p1?.name || 'Unknown'}
            </span>
            {p1?.teamName && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{p1.teamName}</span>}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border/50 shrink-0 overflow-hidden" title={name1 || "Unknown"}>
            {iso1 ? (
              <ReactCountryFlag countryCode={iso1} svg style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
            ) : (
              <Globe className="h-4 w-4 text-muted-foreground/60" />
            )}
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center justify-center gap-2">
          <Input 
            type="number" 
            min="0"
            className="w-12 h-10 text-center font-bold bg-black/40 border-border/50 focus-visible:ring-primary/50 text-lg" 
            value={score1}
            onChange={(e) => setScore1(e.target.value)}
          />
          <span className="text-muted-foreground font-medium">-</span>
          <Input 
            type="number" 
            min="0"
            className="w-12 h-10 text-center font-bold bg-black/40 border-border/50 focus-visible:ring-primary/50 text-lg" 
            value={score2}
            onChange={(e) => setScore2(e.target.value)}
          />
          {canSave && (
            <Button 
              size="icon" 
              onClick={handleSave}
              className="w-8 h-8 ml-2 bg-primary text-black hover:bg-primary/90 shadow-[0_0_10px_rgba(0,210,106,0.3)] animate-in zoom-in"
            >
              <Save className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center justify-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border/50 shrink-0 overflow-hidden" title={name2 || "Unknown"}>
            {iso2 ? (
              <ReactCountryFlag countryCode={iso2} svg style={{ width: '32px', height: '32px', objectFit: 'cover' }} />
            ) : (
              <Globe className="h-4 w-4 text-muted-foreground/60" />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className={`font-semibold ${isCompleted && (match.player2Score || 0) > (match.player1Score || 0) ? 'text-primary' : 'text-white'}`}>
              {p2?.name || 'Unknown'}
            </span>
            {p2?.teamName && <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{p2.teamName}</span>}
          </div>
        </div>
      </td>
      <td className="py-4 px-6 text-center">
        {isCompleted ? (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold uppercase">
            Completed
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-secondary text-muted-foreground font-bold uppercase border-border/50">
            {match.status}
          </Badge>
        )}
      </td>
      <td className="py-4 px-6 text-right">
        <span className="text-xs font-mono text-muted-foreground">
          {format(new Date(match.date), "MMM d, HH:mm")}
        </span>
      </td>
    </motion.tr>
  );
}

export function FixturesTable({ matches, participants, onUpdateScore }: FixturesTableProps) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/50 bg-card/30 p-12 text-center text-muted-foreground">
        No fixtures generated yet. Click 'Generate Fixtures' to create the schedule.
      </div>
    );
  }

  // Sort matches by round (Group Stage first, then Semi-Final, then Final)
  const sortedMatches = [...matches].sort((a, b) => {
    const roundWeights: Record<string, number> = { "Group Stage": 1, "Semi-Final": 2, "Final": 3 };
    const weightA = roundWeights[a.round || "Group Stage"] || 0;
    const weightB = roundWeights[b.round || "Group Stage"] || 0;
    if (weightA !== weightB) return weightA - weightB;
    // Then sort by date
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground border-b border-border/50">
            <tr>
              <th className="py-4 px-6 text-left font-medium w-24">Match</th>
              <th className="py-4 px-6 text-right font-medium w-1/3">Home Team</th>
              <th className="py-4 px-6 text-center font-medium">Score</th>
              <th className="py-4 px-6 text-left font-medium w-1/3">Away Team</th>
              <th className="py-4 px-6 text-center font-medium">Status</th>
              <th className="py-4 px-6 text-right font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sortedMatches.map((match, idx) => (
              <MatchRow 
                key={match._id}
                match={match}
                idx={idx}
                participants={participants}
                onUpdateScore={onUpdateScore}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
