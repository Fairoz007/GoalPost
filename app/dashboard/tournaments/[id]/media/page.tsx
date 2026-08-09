'use client'

import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { ObsOverlayPanel } from '@/components/arena/obs-overlay-panel'

export default function MediaPage() {
  const params = useParams<{ id: string }>()
  const tournamentId = params.id as Id<'tournaments'>
  const tournament = useQuery(api.tournaments.getById, { id: tournamentId })
  const matches = useQuery(api.matches.getByTournament, { tournamentId })
  const participants = useQuery(api.participants.getByTournament, { tournamentId })
  if (tournament === undefined || matches === undefined || participants === undefined) return <div className="h-96 animate-pulse rounded-2xl bg-card" />
  if (!tournament) return <div className="py-20 text-center text-muted-foreground">Tournament not found.</div>
  return <ObsOverlayPanel tournamentId={tournamentId} gameId={tournament.gameId} matches={matches} participants={participants} />
}
