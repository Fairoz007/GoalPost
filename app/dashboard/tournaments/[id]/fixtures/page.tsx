'use client'

import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { useParams } from 'next/navigation'
import { CalendarPlus, Disc3, Plus, Sparkles, Swords } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { FixturesTable } from '@/components/dashboard/tournament/fixtures-table'
import { ManualFixtureDialog } from '@/components/dashboard/tournament/manual-fixture-dialog'
import { getTournamentEditCode } from '@/lib/tournament-admin'

export default function FixturesPage() {
  const params = useParams<{ id: string }>()
  const tournamentId = params.id as Id<'tournaments'>
  const [manualDialogOpen, setManualDialogOpen] = useState(false)

  const tournament = useQuery(api.tournaments.getById, { id: tournamentId })
  const participants = useQuery(api.participants.getByTournament, { tournamentId })
  const groups = useQuery(api.groups.getByTournament, { tournamentId })
  const matches = useQuery(api.matches.getByTournament, { tournamentId })

  const generate = useMutation(api.matches.generateTournament)
  const createMatch = useMutation(api.matches.create)
  const createBatchMatches = useMutation(api.matches.createBatch)
  const deleteMatch = useMutation(api.matches.remove)
  const updateScore = useMutation(api.matches.updateScore)
  const upsertStats = useMutation(api.matches.upsertStats)

  const adminCode = () => getTournamentEditCode(tournamentId)

  if (tournament === undefined || participants === undefined || matches === undefined || groups === undefined) {
    return <div className="h-80 animate-pulse rounded-2xl bg-card" />
  }
  if (!tournament) return <div className="p-10 text-center text-muted-foreground">Tournament not found.</div>
  const gameId = tournament.gameId === 'valorant' ? 'valorant' : 'efootball'

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border bg-card p-6 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {gameId === 'valorant' ? 'VALORANT' : 'eFootball'} Fixtures Engine
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold uppercase text-foreground">Fixtures</h1>
          <p className="text-sm text-muted-foreground">
            {tournament.format} · {matches.length} matches scheduled · {participants.length} competitors
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Manual Fixtures & Spin Wheel Button */}
          <Button
            size="lg"
            variant="outline"
            onClick={() => setManualDialogOpen(true)}
            className="gap-2 border-primary/40 font-bold hover:bg-primary/10"
          >
            <Disc3 className="size-4 text-primary" />
            Manual & Spin Wheel Hub
          </Button>

          {/* Standard Auto Generate Button */}
          {matches.length === 0 && (
            <Button
              size="lg"
              onClick={() => generate({ tournamentId, adminCode: adminCode() })}
              className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 font-bold shadow-lg shadow-red-500/20"
            >
              <CalendarPlus className="size-4" />
              Auto-Generate {tournament.format}
            </Button>
          )}
        </div>
      </div>

      {/* Fixtures Table */}
      <FixturesTable
        matches={matches}
        participants={participants}
        gameId={gameId}
        onUpdateScore={(matchId, player1Score, player2Score) =>
          updateScore({ matchId, player1Score, player2Score, adminCode: adminCode() })
        }
        onUpdateStats={(matchId, participantId, values) =>
          upsertStats({ matchId, participantId, gameId, adminCode: adminCode(), ...values })
        }
        onDeleteMatch={(matchId) => deleteMatch({ matchId, adminCode: adminCode() })}
      />

      {/* Manual Fixture & Random Draw Dialog */}
      <ManualFixtureDialog
        open={manualDialogOpen}
        onClose={() => setManualDialogOpen(false)}
        tournamentId={tournamentId}
        participants={participants}
        groups={groups}
        gameId={gameId}
        defaultBestOf={tournament.bestOf}
        onCreateMatch={(data) => createMatch({ tournamentId, adminCode: adminCode(), ...data })}
        onCreateBatchMatches={(items) => createBatchMatches({ tournamentId, adminCode: adminCode(), matches: items })}
      />
    </div>
  )
}
