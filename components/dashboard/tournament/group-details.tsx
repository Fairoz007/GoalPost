"use client";

import { motion } from "framer-motion";
import { Settings, Shuffle, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamCard } from "./team-card";
import { FixturesTable } from "./fixtures-table";

interface GroupDetailsProps {
  group: { _id: Id<"groups">; name: string } | null;
  participants: any[];
  matches: any[];
  onGenerateMatches: (groupId: Id<"groups">) => void;
  onUpdateScore: (matchId: Id<"matches">, p1s: number, p2s: number) => void;
  gameId?: "efootball" | "valorant";
  onUpdateStats?: (matchId: Id<"matches">, participantId: Id<"participants">, values: { roundsWon?: number; kills?: number; acs?: number; goals?: number; possession?: number; shots?: number; cards?: number }) => Promise<unknown> | void;
  onRemoveGroup?: (groupId: Id<"groups">) => void;
  onAssignParticipant?: (participantId: Id<"participants">, groupId: Id<"groups"> | undefined) => void;
}

export function GroupDetails({ group, participants, matches, onGenerateMatches, onUpdateScore, gameId, onUpdateStats, onRemoveGroup, onAssignParticipant }: GroupDetailsProps) {
  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card/50 min-h-[600px] p-8 text-center glass">
        <div className="rounded-full bg-secondary p-6 mb-4">
          <Settings className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-display font-medium text-white mb-2">No Group Selected</h3>
        <p className="text-muted-foreground max-w-sm">Select a group from the sidebar or create a new one to manage its teams and fixtures.</p>
      </div>
    );
  }

  const groupMatches = matches.filter(m => m.groupId === group._id);
  const groupParticipants = participants.filter(p => p.groupId === group._id);
  const unassignedParticipants = participants.filter(p => !p.groupId);

  const assignRandomTeam = () => {
    if (!onAssignParticipant || unassignedParticipants.length === 0) return;
    const randomTeam = unassignedParticipants[Math.floor(Math.random() * unassignedParticipants.length)];
    onAssignParticipant(randomTeam._id, group._id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col gap-6 rounded-2xl border border-border bg-secondary/20 p-6 min-h-[600px]"
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-display font-bold text-white">{group.name}</h2>
          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1">
            {groupParticipants.length} Teams
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {unassignedParticipants.length > 0 && (
            <div className="w-48">
              <Select onValueChange={(val) => val && onAssignParticipant?.(val as Id<"participants">, group._id)}>
                <SelectTrigger className="h-9 border-border/50 bg-secondary/50">
                  <SelectValue placeholder="Add Team" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedParticipants.map(p => (
                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={assignRandomTeam} disabled={unassignedParticipants.length === 0} className="gap-2 border-border/50 hover:bg-secondary">
            <Shuffle className="h-4 w-4" />
            <span className="hidden sm:inline">Add Random</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onRemoveGroup && onRemoveGroup(group._id)} className="text-muted-foreground hover:text-danger hover:bg-danger/10">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {groupParticipants.map((p, idx) => (
          <TeamCard key={p._id} participant={p} index={idx} />
        ))}
        {groupParticipants.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-border/50 p-12 text-center text-muted-foreground">
            No teams assigned to this group yet. Drag and drop teams here, or use the participants tab.
          </div>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-semibold text-white">Group Matches</h3>
          <Button 
            onClick={() => onGenerateMatches(group._id)}
            disabled={groupMatches.length > 0 || groupParticipants.length < 2}
            className="gap-2 shadow-[0_0_15px_rgba(0,210,106,0.2)]"
          >
            <Settings className="h-4 w-4" />
            Generate Fixtures
          </Button>
        </div>
        <FixturesTable 
          matches={groupMatches} 
          participants={participants} 
          gameId={gameId}
          onUpdateStats={onUpdateStats}
          onUpdateScore={onUpdateScore} 
        />
      </div>
    </motion.div>
  );
}
