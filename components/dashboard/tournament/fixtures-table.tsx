'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Save, Trash2, Calendar, Shield, Swords } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Id } from '@/convex/_generated/dataModel'

interface FixturesTableProps {
  matches: any[]
  participants: any[]
  gameId?: 'efootball' | 'valorant'
  onUpdateScore: (matchId: Id<'matches'>, p1s: number, p2s: number) => Promise<unknown> | void
  onUpdateStats?: (
    matchId: Id<'matches'>,
    participantId: Id<'participants'>,
    values: {
      roundsWon?: number
      kills?: number
      acs?: number
      goals?: number
      possession?: number
      shots?: number
      cards?: number
    },
  ) => Promise<unknown> | void
  onDeleteMatch?: (matchId: Id<'matches'>) => Promise<unknown> | void
}

function MatchRow({
  match,
  participants,
  gameId,
  onUpdateScore,
  onUpdateStats,
  onDeleteMatch,
}: FixturesTableProps & { match: any }) {
  const first = participants.find((item) => item._id === match.player1Id)
  const second = participants.find((item) => item._id === match.player2Id)

  const [score1, setScore1] = useState(match.player1Score?.toString() ?? '')
  const [score2, setScore2] = useState(match.player2Score?.toString() ?? '')
  const [rounds1, setRounds1] = useState('')
  const [rounds2, setRounds2] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [kills1, setKills1] = useState('')
  const [kills2, setKills2] = useState('')
  const [acs1, setAcs1] = useState('')
  const [acs2, setAcs2] = useState('')
  const [possession1, setPossession1] = useState('')
  const [possession2, setPossession2] = useState('')
  const [shots1, setShots1] = useState('')
  const [shots2, setShots2] = useState('')
  const [cards1, setCards1] = useState('')
  const [cards2, setCards2] = useState('')

  const optionalNumber = (value: string) => (value === '' ? undefined : Number(value))

  const save = async () => {
    setError('')
    setSaving(true)
    try {
      await onUpdateScore(match._id, Number(score1), Number(score2))
      if (onUpdateStats) {
        const firstValues =
          gameId === 'valorant'
            ? { roundsWon: optionalNumber(rounds1), kills: optionalNumber(kills1), acs: optionalNumber(acs1) }
            : {
                goals: Number(score1),
                possession: optionalNumber(possession1),
                shots: optionalNumber(shots1),
                cards: optionalNumber(cards1),
              }
        const secondValues =
          gameId === 'valorant'
            ? { roundsWon: optionalNumber(rounds2), kills: optionalNumber(kills2), acs: optionalNumber(acs2) }
            : {
                goals: Number(score2),
                possession: optionalNumber(possession2),
                shots: optionalNumber(shots2),
                cards: optionalNumber(cards2),
              }
        await Promise.all([
          onUpdateStats(match._id, match.player1Id, firstValues),
          onUpdateStats(match._id, match.player2Id, secondValues),
        ])
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save result.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDeleteMatch) return
    if (!window.confirm(`Delete fixture "${first?.name || 'Player 1'} vs ${second?.name || 'Player 2'}"?`)) return
    setDeleting(true)
    try {
      await onDeleteMatch(match._id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete fixture.')
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-background p-4 shadow-sm transition hover:border-primary/30 sm:p-5">
      <div className="grid items-center gap-4 lg:grid-cols-[130px_1fr_auto_1fr_160px]">
        {/* Match Stage / Status */}
        <div>
          <Badge
            variant={match.status === 'Completed' ? 'default' : match.status === 'Live' ? 'destructive' : 'outline'}
            className="text-[10px] font-bold uppercase"
          >
            {match.status}
          </Badge>
          <p className="mt-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            {match.round ?? 'Fixture'}
          </p>
          {match.bestOf && match.bestOf > 1 && (
            <span className="text-[10px] text-muted-foreground">Bo{match.bestOf}</span>
          )}
        </div>

        {/* Player 1 */}
        <div className="text-right">
          <p className={`font-semibold ${match.winnerId === match.player1Id ? 'text-primary font-bold' : ''}`}>
            {first?.name ?? 'TBD'}
          </p>
          {first?.captain && (
            <p className="text-xs text-muted-foreground">Captain: {first.captain}</p>
          )}
        </div>

        {/* Score Inputs */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            value={score1}
            onChange={(event) => setScore1(event.target.value)}
            className="h-11 w-14 text-center text-lg font-bold"
          />
          <span className="text-muted-foreground font-black">:</span>
          <Input
            type="number"
            min={0}
            value={score2}
            onChange={(event) => setScore2(event.target.value)}
            className="h-11 w-14 text-center text-lg font-bold"
          />
        </div>

        {/* Player 2 */}
        <div>
          <p className={`font-semibold ${match.winnerId === match.player2Id ? 'text-primary font-bold' : ''}`}>
            {second?.name ?? 'TBD'}
          </p>
          {second?.captain && (
            <p className="text-xs text-muted-foreground">Captain: {second.captain}</p>
          )}
        </div>

        {/* Actions & Date */}
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={save}
              disabled={saving || score1 === '' || score2 === ''}
              className="gap-1.5 font-bold"
            >
              <Save className="size-3.5" />
              {saving ? 'Saving...' : 'Save'}
            </Button>

            {onDeleteMatch && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={deleting}
                className="size-8 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                title="Delete this match fixture"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground">
            {format(new Date(match.date), 'MMM d, HH:mm')}
          </p>
        </div>
      </div>

      {/* Game Specific Stats Inputs */}
      {gameId === 'valorant' ? (
        <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <StatPair label="Rounds" first={rounds1} second={rounds2} setFirst={setRounds1} setSecond={setRounds2} />
          <StatPair label="Team Kills" first={kills1} second={kills2} setFirst={setKills1} setSecond={setKills2} />
          <StatPair label="Avg ACS" first={acs1} second={acs2} setFirst={setAcs1} setSecond={setAcs2} />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
          <StatPair label="Possession %" first={possession1} second={possession2} setFirst={setPossession1} setSecond={setPossession2} />
          <StatPair label="Shots" first={shots1} second={shots2} setFirst={setShots1} setSecond={setShots2} />
          <StatPair label="Cards" first={cards1} second={cards2} setFirst={setCards1} setSecond={setCards2} />
        </div>
      )}

      {error && <p className="mt-3 text-center text-xs text-rose-400 font-semibold">{error}</p>}
    </div>
  )
}

function StatPair({
  label,
  first,
  second,
  setFirst,
  setSecond,
}: {
  label: string
  first: string
  second: string
  setFirst: (value: string) => void
  setSecond: (value: string) => void
}) {
  return (
    <label className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <span className="w-24 text-right font-bold uppercase tracking-wider">{label}</span>
      <Input
        type="number"
        min={0}
        value={first}
        onChange={(event) => setFirst(event.target.value)}
        className="h-8 w-16 text-center"
      />
      <span>:</span>
      <Input
        type="number"
        min={0}
        value={second}
        onChange={(event) => setSecond(event.target.value)}
        className="h-8 w-16 text-center"
      />
    </label>
  )
}

export function FixturesTable(props: FixturesTableProps) {
  if (!props.matches.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-14 text-center">
        <Swords className="mx-auto size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-semibold text-muted-foreground">No fixtures generated or added yet.</p>
        <p className="mt-1 text-xs text-muted-foreground/80">Use Auto-Generate or the Manual Fixtures Hub above to create matches.</p>
      </div>
    )
  }

  const matches = [...props.matches].sort(
    (a, b) =>
      (a.bracketRound ?? 0) - (b.bracketRound ?? 0) ||
      new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <MatchRow key={match._id} {...props} match={match} />
      ))}
    </div>
  )
}
