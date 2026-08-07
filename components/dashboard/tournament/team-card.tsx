"use client";

import { motion } from "framer-motion";
import { GripVertical, Trophy, Star, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ReactCountryFlag from "react-country-flag";
import { getIsoFromFlagString, getNameFromFlagString } from "@/lib/countries";

interface TeamCardProps {
  participant: any;
  index: number;
}

export function TeamCard({ participant, index }: TeamCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: participant._id,
    data: { participant }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const iso = getIsoFromFlagString(participant.flag);
  const countryName = getNameFromFlagString(participant.flag);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border p-4 transition-all hover:bg-secondary/50",
        isDragging ? "border-primary shadow-lg shadow-primary/20 opacity-80" : "border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/80 border border-border/50 overflow-hidden shadow-sm"
            title={countryName || "Unknown Country"}
          >
            {iso ? (
              <ReactCountryFlag 
                countryCode={iso} 
                svg 
                style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
              />
            ) : (
              <Globe className="h-5 w-5 text-muted-foreground/60" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-white">{participant.name}</h4>
            {participant.teamName && (
              <p className="text-xs text-muted-foreground mt-0.5">{participant.teamName}</p>
            )}
          </div>
        </div>
        
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab hover:bg-secondary rounded p-1 text-muted-foreground opacity-50 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
      
      <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border/30">
        <Badge variant="outline" className="bg-secondary/30 text-xs px-2 py-0.5 text-muted-foreground border-border/50">
          <Trophy className="mr-1 h-3 w-3 text-warning" /> 0 Pts
        </Badge>
        <Badge variant="outline" className="bg-secondary/30 text-xs px-2 py-0.5 text-muted-foreground border-border/50">
          <Star className="mr-1 h-3 w-3 text-accent" /> Rank -
        </Badge>
      </div>
    </motion.div>
  );
}
