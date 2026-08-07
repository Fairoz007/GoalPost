"use client";

import { motion } from "framer-motion";
import { Users, MoreVertical, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface Group {
  _id: Id<"groups">;
  name: string;
}

interface GroupsSidebarProps {
  groups: Group[];
  activeGroupId: Id<"groups"> | null;
  onSelectGroup: (id: Id<"groups">) => void;
  getParticipantsCount: (groupId: Id<"groups">) => number;
}

export function GroupsSidebar({ groups, activeGroupId, onSelectGroup, getParticipantsCount }: GroupsSidebarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 min-h-[600px]">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-lg font-display font-semibold flex items-center gap-2">
          Groups 
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
            {groups.length}
          </span>
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto pr-1">
        {groups.map((group, idx) => {
          const isActive = activeGroupId === group._id;
          const count = getParticipantsCount(group._id);
          
          return (
            <motion.button
              key={group._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSelectGroup(group._id)}
              className={cn(
                "group relative flex items-center gap-4 rounded-xl border p-3 text-left transition-all hover:bg-secondary/50 overflow-hidden",
                isActive 
                  ? "border-primary/50 bg-secondary/80 shadow-[0_0_15px_rgba(0,210,106,0.15)]" 
                  : "border-border/50 bg-transparent"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-group-indicator"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                />
              )}
              
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                isActive ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground group-hover:text-white"
              )}>
                <Users className="h-5 w-5" />
              </div>
              
              <div className="flex-1 overflow-hidden">
                <h4 className={cn("font-medium truncate transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-white")}>
                  {group.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {count} Teams
                </p>
              </div>

              <ChevronRight className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-transparent group-hover:text-muted-foreground")} />
            </motion.button>
          );
        })}
      </div>

      <Button variant="outline" className="mt-auto border-border/50 border-dashed text-primary hover:text-primary hover:border-primary/50 hover:bg-primary/10 gap-2">
        <Plus className="h-4 w-4" />
        Add New Group
      </Button>
    </div>
  );
}
