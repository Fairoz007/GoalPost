'use client'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useParams } from 'next/navigation'
import type { Id } from '@/convex/_generated/dataModel'
import { CompetitorsManager } from '@/components/dashboard/tournament/competitors-manager'

export default function ParticipantsPage() {
  const params = useParams<{ id: string }>(); const tournamentId = params.id as Id<'tournaments'>
  const tournament = useQuery(api.tournaments.getById, { id: tournamentId }); const participants = useQuery(api.participants.getByTournament, { tournamentId }); const registrations = useQuery(api.arena.listRegistrations, { tournamentId })
  const create = useMutation(api.participants.create); const remove = useMutation(api.participants.remove); const review = useMutation(api.arena.reviewRegistration)
  if (tournament === undefined || participants === undefined || registrations === undefined) return <div className="h-80 animate-pulse rounded-2xl bg-card" />
  if (!tournament) return <div className="p-10 text-center text-muted-foreground">Tournament not found.</div>
  const gameId = tournament.gameId === 'valorant' ? 'valorant' : 'efootball'
  return <CompetitorsManager gameId={gameId} competitors={participants} registrations={registrations} onCreate={(data) => create({ tournamentId, gameId, ...data })} onRemove={(id) => remove({ id })} onReview={(registrationId, decision) => review({ registrationId, decision })} />
}
