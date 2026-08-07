"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { ParticipantsTab } from "@/components/dashboard/tournament/participants-tab";

export default function ParticipantsPage() {
  const params = useParams();
  const tournamentId = params.id as Id<"tournaments">;
  const isInvalidId = !tournamentId || tournamentId === "undefined";
  
  const participants = useQuery(api.participants.getByTournament, isInvalidId ? "skip" : { tournamentId });
  const createParticipant = useMutation(api.participants.create);
  const removeParticipant = useMutation(api.participants.remove);

  if (participants === undefined) {
    return <div className="animate-pulse space-y-4">
      <div className="h-64 bg-secondary/50 rounded-2xl w-full"></div>
    </div>;
  }

  return (
    <ParticipantsTab 
      participants={participants}
      onAddParticipant={(name, flag) => {
        createParticipant({ name, flag, tournamentId });
      }}
      onRemoveParticipant={async (id) => {
        await removeParticipant({ id });
      }}
    />
  );
}
