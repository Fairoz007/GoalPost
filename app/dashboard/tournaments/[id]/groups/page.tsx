"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion } from "framer-motion";

import { HeroStats } from "@/components/dashboard/tournament/hero-stats";
import { GroupsSidebar } from "@/components/dashboard/tournament/groups-sidebar";
import { GroupDetails } from "@/components/dashboard/tournament/group-details";

export default function GroupsPage() {
  const params = useParams();
  const tournamentId = params.id as Id<"tournaments">;
  const isInvalidId = !tournamentId || tournamentId === "undefined";
  
  const [activeGroupId, setActiveGroupId] = useState<Id<"groups"> | null>(null);
  const [newGroupName, setNewGroupName] = useState("");

  const tournament = useQuery(api.tournaments.getById, isInvalidId ? "skip" : { id: tournamentId });
  const participants = useQuery(api.participants.getByTournament, isInvalidId ? "skip" : { tournamentId });
  const groups = useQuery(api.groups.getByTournament, isInvalidId ? "skip" : { tournamentId });
  const matches = useQuery(api.matches.getByTournament, isInvalidId ? "skip" : { tournamentId });

  const createGroup = useMutation(api.groups.create);
  const removeGroup = useMutation(api.groups.remove);
  const generateMatches = useMutation(api.matches.generateGroupMatches);
  const updateScore = useMutation(api.matches.updateScore);
  const upsertStats = useMutation(api.matches.upsertStats);
  const assignToGroup = useMutation(api.participants.assignToGroup);

  if (tournament === undefined || participants === undefined || groups === undefined || matches === undefined) {
    return <div className="animate-pulse space-y-6">
      <div className="h-32 bg-secondary/50 rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 h-96 bg-secondary/50 rounded-2xl"></div>
        <div className="lg:col-span-8 h-96 bg-secondary/50 rounded-2xl"></div>
      </div>
    </div>;
  }

  if (tournament === null) {
    return <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">Tournament not found.</div>;
  }

  if (tournament.format === "Single Group + Finals") {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Groups are managed automatically in Single Group formats.
      </div>
    );
  }

  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    const newId = await createGroup({ name: newGroupName, tournamentId });
    setNewGroupName("");
    setActiveGroupId(newId);
  };

  const activeGroup = groups.find(g => g._id === activeGroupId) || null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <HeroStats 
        newGroupName={newGroupName}
        setNewGroupName={setNewGroupName}
        onCreateGroup={handleCreateGroup}
        groupsCount={groups.length}
        totalTeams={participants.length}
        assignedTeams={participants.filter(p => p.groupId != null).length}
        totalMatches={matches.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <GroupsSidebar 
            groups={groups}
            activeGroupId={activeGroupId}
            onSelectGroup={setActiveGroupId}
            getParticipantsCount={(id) => participants.filter(p => p.groupId === id).length}
          />
        </div>
        
        <div className="lg:col-span-8">
          <DndContext collisionDetection={closestCenter}>
            <SortableContext items={participants.filter(p => p.groupId === activeGroupId).map(p => p._id)} strategy={verticalListSortingStrategy}>
              <GroupDetails 
                group={activeGroup}
                participants={participants}
                matches={matches}
                gameId={tournament.gameId === "valorant" ? "valorant" : "efootball"}
                onUpdateStats={(matchId, participantId, values) => upsertStats({ matchId, participantId, gameId: tournament.gameId === "valorant" ? "valorant" : "efootball", ...values })}
                onGenerateMatches={(id) => generateMatches({ tournamentId, groupId: id })}
                onUpdateScore={(id, p1s, p2s) => updateScore({ matchId: id, player1Score: p1s, player2Score: p2s })}
                onRemoveGroup={async (id) => {
                  await removeGroup({ id });
                  setActiveGroupId(null);
                }}
                onAssignParticipant={(participantId, groupId) => assignToGroup({ participantId, groupId })}
              />
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </motion.div>
  );
}
