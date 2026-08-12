'use client'

import { useMutation, useQuery } from 'convex/react'
import { useParams } from 'next/navigation'
import { RotateCcw, Trophy } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { FixturesTable } from '@/components/dashboard/tournament/fixtures-table'
import { getTournamentEditCode } from '@/lib/tournament-admin'

export default function KnockoutPage() {
  const params = useParams<{ id: string }>()
  const tournamentId = params.id as Id<'tournaments'>
  const tournament = useQuery(api.tournaments.getById, { id: tournamentId })
  const participants = useQuery(api.participants.getByTournament, { tournamentId })
  const matches = useQuery(api.matches.getByTournament, { tournamentId })
  const generate = useMutation(api.matches.generateKnockout)
  const reset = useMutation(api.matches.resetKnockout)
  const updateScore = useMutation(api.matches.updateScore)
  const upsertStats = useMutation(api.matches.upsertStats)
  const adminCode = () => getTournamentEditCode(tournamentId)

  if (tournament === undefined || participants === undefined || matches === undefined) return <div className="h-96 animate-pulse rounded-2xl bg-card" />
  if (!tournament) return <div className="p-10 text-center">Tournament not found.</div>
  const gameId = tournament.gameId === 'valorant' ? 'valorant' : 'efootball'
  const knockout = matches.filter((match) => match.bracketRound !== undefined)
  const rounds = [...new Set(knockout.map((match) => match.bracketRound))].sort((a, b) => (a ?? 0) - (b ?? 0))

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><Trophy className="size-6 text-primary" /><div><p className="text-xs font-bold uppercase tracking-wider text-primary">{gameId === 'valorant' ? 'VALORANT' : 'eFootball'} bracket engine</p><h1 className="font-display text-2xl font-bold uppercase">{tournament.format}</h1><p className="text-sm text-muted-foreground">Winners advance automatically when every match in a round is complete.</p></div></div><div className="flex gap-2">{knockout.length > 0 && <Button variant="outline" onClick={() => reset({ tournamentId, adminCode: adminCode() })}><RotateCcw className="size-4" />Reset</Button>}{knockout.length === 0 && <Button onClick={() => generate({ tournamentId, adminCode: adminCode() })}>Generate bracket</Button>}</div></div>
    {rounds.length ? <div className="space-y-8">{rounds.map((round) => { const roundMatches = knockout.filter((match) => match.bracketRound === round); return <section key={round} className="rounded-2xl border border-border bg-card p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-primary">Round {round}</p><h2 className="font-display text-xl font-bold uppercase">{roundMatches[0]?.round}</h2></div><span className="text-xs text-muted-foreground">{roundMatches.filter((match) => match.status === 'Completed').length}/{roundMatches.length} complete</span></div><FixturesTable matches={roundMatches} participants={participants} gameId={gameId} onUpdateScore={(matchId, player1Score, player2Score) => updateScore({ matchId, player1Score, player2Score, adminCode: adminCode() })} onUpdateStats={(matchId, participantId, values) => upsertStats({ matchId, participantId, gameId, adminCode: adminCode(), ...values })} /></section>})}</div> : <div className="rounded-2xl border border-dashed border-border py-24 text-center"><Trophy className="mx-auto size-10 text-muted-foreground" /><p className="mt-4 text-muted-foreground">Generate a bracket after competitors are confirmed.</p></div>}
  </div>
}
