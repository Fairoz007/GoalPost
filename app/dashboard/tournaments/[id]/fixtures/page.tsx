'use client'

import { useMutation, useQuery } from 'convex/react'
import { useParams } from 'next/navigation'
import { CalendarPlus } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { FixturesTable } from '@/components/dashboard/tournament/fixtures-table'
import { getTournamentEditCode } from '@/lib/tournament-admin'

export default function FixturesPage() {
  const params = useParams<{ id: string }>()
  const tournamentId = params.id as Id<'tournaments'>
  const tournament = useQuery(api.tournaments.getById, { id: tournamentId })
  const participants = useQuery(api.participants.getByTournament, { tournamentId })
  const matches = useQuery(api.matches.getByTournament, { tournamentId })
  const generate = useMutation(api.matches.generateTournament)
  const updateScore = useMutation(api.matches.updateScore)
  const upsertStats = useMutation(api.matches.upsertStats)
  const adminCode = () => getTournamentEditCode(tournamentId)

  if (tournament === undefined || participants === undefined || matches === undefined) return <div className="h-80 animate-pulse rounded-2xl bg-card" />
  if (!tournament) return <div className="p-10 text-center">Tournament not found.</div>
  const gameId = tournament.gameId === 'valorant' ? 'valorant' : 'efootball'

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
      <div><p className="text-xs font-bold uppercase tracking-wider text-primary">{gameId === 'valorant' ? 'VALORANT' : 'eFootball'} schedule engine</p><h1 className="mt-1 font-display text-2xl font-bold uppercase">Fixtures</h1><p className="text-sm text-muted-foreground">{tournament.format} · {matches.length} matches generated</p></div>
      {matches.length === 0 && <Button onClick={() => generate({ tournamentId, adminCode: adminCode() })}><CalendarPlus className="size-4" />Generate {tournament.format}</Button>}
    </div>
    <FixturesTable matches={matches} participants={participants} gameId={gameId} onUpdateScore={(matchId, player1Score, player2Score) => updateScore({ matchId, player1Score, player2Score, adminCode: adminCode() })} onUpdateStats={(matchId, participantId, values) => upsertStats({ matchId, participantId, gameId, adminCode: adminCode(), ...values })} />
  </div>
}
