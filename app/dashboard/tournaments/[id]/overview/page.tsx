"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Trophy, Users, Calendar, Activity, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OverviewPage() {
  const params = useParams();
  const tournamentId = params.id as Id<"tournaments">;
  const isInvalidId = !tournamentId || tournamentId === "undefined";
  
  const participants = useQuery(api.participants.getByTournament, isInvalidId ? "skip" : { tournamentId });
  const groups = useQuery(api.groups.getByTournament, isInvalidId ? "skip" : { tournamentId });
  const matches = useQuery(api.matches.getByTournament, isInvalidId ? "skip" : { tournamentId });

  if (participants === undefined || groups === undefined || matches === undefined) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-secondary/50 rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-secondary/50 rounded-xl"></div>)}
      </div>
    </div>;
  }

  const completedMatches = matches.filter(m => m.status === "Completed").length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-secondary/20 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold text-white">{participants.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered for tournament</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Groups</CardTitle>
            <Trophy className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold text-white">{groups.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active group stages</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Matches</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold text-white">{matches.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total fixtures scheduled</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion</CardTitle>
            <Activity className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold text-white">
              {matches.length > 0 ? Math.round((completedMatches / matches.length) * 100) : 0}%
            </div>
            <div className="w-full bg-secondary/50 rounded-full h-1.5 mt-2">
              <div 
                className="bg-danger h-1.5 rounded-full" 
                style={{ width: `${matches.length > 0 ? (completedMatches / matches.length) * 100 : 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-secondary/20 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            {matches.filter(m => m.status === "Completed").slice(0, 5).length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No matches completed yet.</div>
            ) : (
              <div className="space-y-4">
                {matches.filter(m => m.status === "Completed").slice(0, 5).map(m => {
                  const p1 = participants.find(p => p._id === m.player1Id);
                  const p2 = participants.find(p => p._id === m.player2Id);
                  return (
                    <div key={m._id} className="flex justify-between items-center bg-secondary/40 p-3 rounded-lg border border-border/50">
                      <span className="font-medium text-white truncate w-1/3 text-right">{p1?.name}</span>
                      <span className="px-3 py-1 bg-black/40 rounded text-sm font-bold mx-2">
                        {m.player1Score} - {m.player2Score}
                      </span>
                      <span className="font-medium text-white truncate w-1/3 text-left">{p2?.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-secondary/20 border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Fixtures</CardTitle>
          </CardHeader>
          <CardContent>
            {matches.filter(m => m.status !== "Completed").slice(0, 5).length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No upcoming fixtures.</div>
            ) : (
              <div className="space-y-4">
                {matches.filter(m => m.status !== "Completed").slice(0, 5).map(m => {
                  const p1 = participants.find(p => p._id === m.player1Id);
                  const p2 = participants.find(p => p._id === m.player2Id);
                  return (
                    <div key={m._id} className="flex justify-between items-center bg-secondary/40 p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-white">{p1?.name || '?'}</span>
                        <span className="text-muted-foreground text-xs font-bold">vs</span>
                        <span className="font-medium text-white">{p2?.name || '?'}</span>
                      </div>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        Upcoming
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
