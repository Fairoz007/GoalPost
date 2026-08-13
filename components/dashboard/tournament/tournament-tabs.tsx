"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface TournamentTabsProps {
  tournamentId: string;
  format: string;
}

export function TournamentTabs({ tournamentId, format }: TournamentTabsProps) {
  const pathname = usePathname();
  const hasGroups = ["Groups", "Groups + Knockout"].includes(format);
  const hasKnockout = ["Knockout", "Single Elimination", "Double Elimination", "Groups", "Groups + Knockout", "Single Group + Finals"].includes(format);

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "participants", label: "Participants" },
    { id: "groups", label: "Groups", hidden: !hasGroups },
    { id: "fixtures", label: "Fixtures" },
    { id: "standings", label: "Standings" },
    { id: "knockout", label: "Knockout", hidden: !hasKnockout },
    { id: "statistics", label: "Statistics" },
    { id: "media", label: "Stream Studio" },
    { id: "settings", label: "Settings" }
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide border-b border-border bg-card/30 px-6 backdrop-blur-sm sticky top-[73px] z-10">
      {tabs.filter(t => !t.hidden).map((tab) => {
        const href = `/dashboard/tournaments/${tournamentId}/${tab.id}`;
        // Active if exact match or if it's the default redirect (meaning /dashboard/tournaments/[id] which acts like overview)
        const isActive = pathname === href || (pathname === `/dashboard/tournaments/${tournamentId}` && tab.id === "overview");
        
        return (
          <Link
            key={tab.id}
            href={href}
            className={cn(
              "relative px-4 py-4 text-sm font-medium transition-colors hover:text-white whitespace-nowrap",
              isActive ? "text-white" : "text-muted-foreground"
            )}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="tournament-active-tab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_12px_rgba(0,210,106,0.8)]"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
