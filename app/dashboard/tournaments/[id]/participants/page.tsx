'use client'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useParams } from 'next/navigation'
import type { Id } from '@/convex/_generated/dataModel'
import { CompetitorsManager } from '@/components/dashboard/tournament/competitors-manager'
import { getTournamentEditCode } from '@/lib/tournament-admin'

export default function ParticipantsPage() {
  const params = useParams<{ id: string }>(); const tournamentId = params.id as Id<'tournaments'>
  const tournament = useQuery(api.tournaments.getById, { id: tournamentId }); const participants = useQuery(api.participants.getByTournament, { tournamentId })
  const create = useMutation(api.participants.create); const remove = useMutation(api.participants.remove)
  if (tournament === undefined || participants === undefined) return <div className="h-80 animate-pulse rounded-2xl bg-card" />
  if (!tournament) return <div className="p-10 text-center text-muted-foreground">Tournament not found.</div>
  const gameId = tournament.gameId === 'valorant' ? 'valorant' : 'efootball'
  return <CompetitorsManager tournamentId={tournamentId} tournamentName={tournament.name} gameId={gameId} competitors={participants} onCreate={(data) => create({ tournamentId, adminCode: getTournamentEditCode(tournamentId), gameId, ...data })} onRemove={(id) => remove({ id, adminCode: getTournamentEditCode(tournamentId) })} />
}
