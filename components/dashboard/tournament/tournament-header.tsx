"use client";

import { ArrowLeft, Bell, Settings, Trophy } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface TournamentHeaderProps {
  name: string;
  type: string;
  status: string;
  startDate: string;
}

export function TournamentHeader({ name, type, status, startDate }: TournamentHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-border bg-card/50 px-6 py-4 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/tournaments">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-secondary/50 hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Trophy className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-display tracking-tight text-white">{name}</h1>
            <Badge variant={status === "Live" || status === "Ongoing" ? "default" : "secondary"} className="uppercase text-[10px] tracking-wider px-2 py-0.5 font-bold">
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
            <span>{type}</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/50"></span>
            <span>Starts {format(new Date(startDate), "d MMM, yyyy")}</span>
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 mt-4 md:mt-0">
        <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full hover:bg-secondary/80">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,210,106,0.8)]"></span>
        </Button>
        <Button variant="outline" className="border-border bg-secondary/30 hover:bg-secondary gap-2 text-sm">
          <Settings className="h-4 w-4 text-muted-foreground" />
          Tournament Settings
        </Button>
      </div>
    </div>
  );
}
