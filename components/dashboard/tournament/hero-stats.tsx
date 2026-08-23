"use client";

import { motion } from "framer-motion";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeroStatsProps {
  newGroupName: string;
  setNewGroupName: (v: string) => void;
  onCreateGroup: () => void;
  groupsCount: number;
  totalTeams: number;
  assignedTeams: number;
  totalMatches: number;
}

export function HeroStats({
  newGroupName,
  setNewGroupName,
  onCreateGroup,
  groupsCount,
  totalTeams,
  assignedTeams,
  totalMatches
}: HeroStatsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-6 md:grid-cols-2 rounded-2xl border border-border bg-card p-6 shadow-sm mb-6 mt-6"
    >
      <div className="flex flex-col justify-center gap-4 border-r border-border/50 pr-6">
        <div>
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            Create New Group
          </h2>
          <p className="text-sm text-muted-foreground mt-1 ml-10">Add a new group and manage participants</p>
        </div>
        <div className="flex gap-3 ml-10">
          <Input 
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Enter group name (e.g. Group A)" 
            className="bg-secondary/50 border-border/50 focus-visible:ring-primary/50"
          />
          <Button onClick={onCreateGroup} className="gap-2 shadow-[0_0_15px_rgba(0,210,106,0.3)]">
            <Plus className="h-4 w-4" />
            Create Group
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 pl-6 items-center">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Groups</span>
          <span className="text-3xl font-display font-bold text-white">{groupsCount}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Teams Assigned</span>
          <span className="text-3xl font-display font-bold text-accent">{assignedTeams} <span className="text-lg text-muted-foreground">/ {totalTeams}</span></span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Matches</span>
          <span className="text-3xl font-display font-bold text-warning">{totalMatches}</span>
        </div>
      </div>
    </motion.div>
  );
}
