'use client'

import { useState } from 'react'
import { Disc3, Plus, Shuffle, Calendar, Sparkles, Check, Users, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { SpinWheel, WheelParticipant } from './spin-wheel'
import type { Id } from '@/convex/_generated/dataModel'

interface ManualFixtureDialogProps {
  open: boolean
  onClose: () => void
  tournamentId: Id<'tournaments'>
  participants: any[]
  groups?: any[]
  gameId: 'efootball' | 'valorant'
  defaultBestOf?: number
  onCreateMatch: (data: {
    player1Id: Id<'participants'>
    player2Id: Id<'participants'>
    round?: string
    date?: string
    groupId?: Id<'groups'>
    bestOf?: number
  }) => Promise<unknown>
  onCreateBatchMatches?: (
    matches: Array<{
      player1Id: Id<'participants'>
      player2Id: Id<'participants'>
      round?: string
      date?: string
      groupId?: Id<'groups'>
      bestOf?: number
    }>,
  ) => Promise<unknown>
}

const COMMON_ROUNDS = [
  'Fixture',
  'Matchday 1',
  'Matchday 2',
  'Matchday 3',
  'Group Stage',
  'Exhibition',
  'Showmatch',
  'Round of 16',
  'Quarter-Final',
  'Semi-Final',
  'Final',
]

export function ManualFixtureDialog({
  open,
  onClose,
  tournamentId,
  participants,
  groups,
  gameId,
  defaultBestOf = 1,
  onCreateMatch,
  onCreateBatchMatches,
}: ManualFixtureDialogProps) {
  const [activeTab, setActiveTab] = useState<'wheel' | 'manual' | 'shuffle'>('wheel')
  const [player1Id, setPlayer1Id] = useState<string>('')
  const [player2Id, setPlayer2Id] = useState<string>('')
  const [roundName, setRoundName] = useState('Fixture')
  const [customRound, setCustomRound] = useState('')
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().slice(0, 16))
  const [selectedGroupId, setSelectedGroupId] = useState<string>('none')
  const [bestOf, setBestOf] = useState<number>(defaultBestOf)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  if (!open) return null

  const p1 = participants.find((p) => p._id === player1Id) || null
  const p2 = participants.find((p) => p._id === player2Id) || null

  const resetForm = () => {
    setPlayer1Id('')
    setPlayer2Id('')
    setError('')
  }

  const effectiveRound = customRound.trim() || roundName

  const handleCreate = async () => {
    if (!player1Id || !player2Id) {
      setError('Please select both Participant 1 and Participant 2.')
      return
    }
    if (player1Id === player2Id) {
      setError('A participant cannot play against themselves.')
      return
    }

    setCreating(true)
    setError('')
    setSuccessMsg('')
    try {
      await onCreateMatch({
        player1Id: player1Id as Id<'participants'>,
        player2Id: player2Id as Id<'participants'>,
        round: effectiveRound,
        date: new Date(matchDate).toISOString(),
        groupId: selectedGroupId !== 'none' ? (selectedGroupId as Id<'groups'>) : undefined,
        bestOf,
      })
      setSuccessMsg(`Fixture created: ${p1?.name} vs ${p2?.name}`)
      resetForm()
      setTimeout(() => {
        setSuccessMsg('')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create fixture.')
    } finally {
      setCreating(false)
    }
  }

  const handleBatchShuffleAll = async () => {
    if (participants.length < 2) {
      setError('At least 2 participants are needed to generate fixtures.')
      return
    }
    setCreating(true)
    setError('')
    setSuccessMsg('')

    try {
      const shuffled = [...participants].sort(() => Math.random() - 0.5)
      const pairs: Array<{
        player1Id: Id<'participants'>
        player2Id: Id<'participants'>
        round?: string
        date?: string
        groupId?: Id<'groups'>
        bestOf?: number
      }> = []

      for (let i = 0; i + 1 < shuffled.length; i += 2) {
        pairs.push({
          player1Id: shuffled[i]._id,
          player2Id: shuffled[i + 1]._id,
          round: effectiveRound || 'Random Draw',
          date: new Date(matchDate).toISOString(),
          groupId: selectedGroupId !== 'none' ? (selectedGroupId as Id<'groups'>) : undefined,
          bestOf,
        })
      }

      if (onCreateBatchMatches) {
        await onCreateBatchMatches(pairs)
      } else {
        for (const pair of pairs) {
          await onCreateMatch(pair)
        }
      }

      setSuccessMsg(`Successfully created ${pairs.length} random fixtures!`)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate random fixtures.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-3 border-b border-border pb-5 sm:flex-row sm:items-center">
          <div>
            <Badge className="bg-primary/20 text-primary uppercase font-bold tracking-wider">
              {gameId === 'valorant' ? 'VALORANT' : 'eFootball'} Fixtures Hub
            </Badge>
            <h2 className="mt-1 font-display text-2xl font-bold uppercase text-foreground">
              Manual Fixtures & Random Draw
            </h2>
            <p className="text-xs text-muted-foreground">
              Add individual fixtures, spin the wheel, or randomly shuffle participants.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-border pb-4">
          <Button
            size="sm"
            variant={activeTab === 'wheel' ? 'default' : 'outline'}
            onClick={() => setActiveTab('wheel')}
            className="gap-2 font-bold"
          >
            <Disc3 className="size-4 text-primary" />
            Spin Wheel
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'manual' ? 'default' : 'outline'}
            onClick={() => setActiveTab('manual')}
            className="gap-2 font-bold"
          >
            <Users className="size-4" />
            Manual Pick
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'shuffle' ? 'default' : 'outline'}
            onClick={() => setActiveTab('shuffle')}
            className="gap-2 font-bold"
          >
            <Shuffle className="size-4 text-primary" />
            Auto-Pair All
          </Button>
        </div>

        {/* Success / Error Banners */}
        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-400">
            <Check className="size-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-400">
            {error}
          </div>
        )}

        {/* Tab 1: Interactive Spin Wheel */}
        {activeTab === 'wheel' && (
          <div className="mt-6 space-y-6">
            <SpinWheel
              participants={participants}
              player1={p1}
              player2={p2}
              onAssignPlayer1={(p) => setPlayer1Id(p._id)}
              onAssignPlayer2={(p) => setPlayer2Id(p._id)}
              onSelectPair={(first, second) => {
                setPlayer1Id(first._id)
                setPlayer2Id(second._id)
              }}
            />
          </div>
        )}

        {/* Tab 2: Manual Dropdown Pick */}
        {activeTab === 'manual' && (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {/* Player 1 Select */}
            <div className="rounded-2xl border border-border bg-background p-5">
              <Label className="text-xs font-bold uppercase tracking-wider text-primary">Participant 1 (Home)</Label>
              <div className="mt-3">
                <Select value={player1Id} onValueChange={(val) => setPlayer1Id(val || '')}>
                  <SelectTrigger className="h-12 w-full text-base">
                    <SelectValue placeholder="Select Participant 1..." />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((p) => (
                      <SelectItem key={p._id} value={p._id} disabled={p._id === player2Id}>
                        {p.name} {p.captain ? `(C: ${p.captain})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {p1 && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                  <p className="font-bold text-foreground">{p1.name}</p>
                  <p className="text-muted-foreground">{p1.teamName || (gameId === 'valorant' ? 'VALORANT Team' : 'Player')}</p>
                </div>
              )}
            </div>

            {/* Player 2 Select */}
            <div className="rounded-2xl border border-border bg-background p-5">
              <Label className="text-xs font-bold uppercase tracking-wider text-primary">Participant 2 (Away)</Label>
              <div className="mt-3">
                <Select value={player2Id} onValueChange={(val) => setPlayer2Id(val || '')}>
                  <SelectTrigger className="h-12 w-full text-base">
                    <SelectValue placeholder="Select Participant 2..." />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((p) => (
                      <SelectItem key={p._id} value={p._id} disabled={p._id === player1Id}>
                        {p.name} {p.captain ? `(C: ${p.captain})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {p2 && (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs">
                  <p className="font-bold text-foreground">{p2.name}</p>
                  <p className="text-muted-foreground">{p2.teamName || (gameId === 'valorant' ? 'VALORANT Team' : 'Player')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Batch Auto-Pair All */}
        {activeTab === 'shuffle' && (
          <div className="mt-6 rounded-2xl border border-border bg-background p-6 text-center">
            <Shuffle className="mx-auto size-12 text-primary" />
            <h3 className="mt-3 font-display text-xl font-bold uppercase">Shuffle & Auto-Pair All Participants</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Instantly randomize and generate fixtures for all {participants.length} competitors in this tournament.
            </p>

            <div className="mt-6 flex justify-center">
              <Button
                size="lg"
                onClick={handleBatchShuffleAll}
                disabled={creating || participants.length < 2}
                className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 font-bold"
              >
                <Sparkles className="size-5" />
                {creating ? 'Generating Pairs...' : `Generate ${Math.floor(participants.length / 2)} Random Fixtures`}
              </Button>
            </div>
          </div>
        )}

        {/* Fixture Settings (Round, Date, BestOf, Group) */}
        <div className="mt-6 rounded-2xl border border-border bg-background/50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Match Details</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Round Preset */}
            <div>
              <Label className="text-xs">Stage / Round</Label>
              <Select value={roundName} onValueChange={(val) => { setRoundName(val || 'Fixture'); setCustomRound(''); }}>
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_ROUNDS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                  <SelectItem value="Custom">Custom Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Round Name if selected */}
            {roundName === 'Custom' && (
              <div>
                <Label className="text-xs">Custom Round Label</Label>
                <Input
                  value={customRound}
                  onChange={(e) => setCustomRound(e.target.value)}
                  placeholder="e.g. Showmatch A"
                  className="mt-1.5 h-10"
                />
              </div>
            )}

            {/* Match Date & Time */}
            <div>
              <Label className="text-xs">Date & Time</Label>
              <Input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="mt-1.5 h-10"
              />
            </div>

            {/* Best Of */}
            <div>
              <Label className="text-xs">Match Format</Label>
              <Select value={String(bestOf)} onValueChange={(v) => setBestOf(Number(v || '1'))}>
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Best of 1 (Bo1)</SelectItem>
                  <SelectItem value="3">Best of 3 (Bo3)</SelectItem>
                  <SelectItem value="5">Best of 5 (Bo5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Optional Group */}
            {groups && groups.length > 0 && (
              <div>
                <Label className="text-xs">Assign to Group (Optional)</Label>
                <Select value={selectedGroupId} onValueChange={(val) => setSelectedGroupId(val || 'none')}>
                  <SelectTrigger className="mt-1.5 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Group (Main Stage)</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex flex-col justify-end gap-3 border-t border-border pt-4 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            size="lg"
            onClick={handleCreate}
            disabled={creating || !player1Id || !player2Id || player1Id === player2Id}
            className="gap-2 bg-primary font-bold shadow-lg shadow-primary/20"
          >
            <Plus className="size-4" />
            {creating ? 'Creating Fixture...' : 'Create Match Fixture'}
          </Button>
        </div>
      </div>
    </div>
  )
}
