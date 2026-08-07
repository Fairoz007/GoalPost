'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Minus, Plus, Maximize, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { bracket, teamById, type BracketMatch } from '@/lib/mock-data'
import { TeamCrest } from '@/components/shared/team-crest'
import { Button } from '@/components/ui/button'

function Slot({
  side,
  winnerId,
}: {
  side?: { teamId: string; score?: number }
  winnerId?: string
}) {
  if (!side) {
    return (
      <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-muted-foreground">
        <span className="italic">TBD</span>
      </div>
    )
  }
  const team = teamById(side.teamId)
  const isWinner = winnerId === side.teamId
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 px-3 py-2 text-sm',
        isWinner ? 'font-semibold text-foreground' : 'text-muted-foreground',
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <TeamCrest team={team} size="sm" />
        <span className="truncate">{team.short}</span>
      </span>
      <span className={cn('font-display tabular-nums', isWinner && 'text-primary')}>
        {side.score ?? '-'}
      </span>
    </div>
  )
}

function MatchBox({ match, champion }: { match: BracketMatch; champion?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={cn(
        'w-52 divide-y divide-border overflow-hidden rounded-lg border bg-card',
        champion ? 'border-accent shadow-[0_0_30px_-8px] shadow-accent/40' : 'border-border',
      )}
    >
      <Slot side={match.home} winnerId={match.winner} />
      <Slot side={match.away} winnerId={match.winner} />
    </motion.div>
  )
}

export function BracketView() {
  const [scale, setScale] = useState(1)
  const wrapRef = useRef<HTMLDivElement>(null)
  const finalWinner = undefined // final not played yet

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">City Knockout Cup · Single Elimination</p>
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setScale((s) => Math.max(0.6, +(s - 0.1).toFixed(2)))}
            aria-label="Zoom out"
          >
            <Minus className="size-4" />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setScale((s) => Math.min(1.4, +(s + 0.1).toFixed(2)))}
            aria-label="Zoom in"
          >
            <Plus className="size-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={() => setScale(1)} aria-label="Reset zoom">
            <Maximize className="size-4" />
          </Button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="glass overflow-auto rounded-xl p-6"
      >
        <motion.div
          drag
          dragConstraints={wrapRef}
          dragElastic={0.05}
          style={{ scale }}
          className="flex w-max origin-top-left cursor-grab items-stretch gap-12 active:cursor-grabbing"
        >
          {bracket.map((round, ri) => (
            <div key={round.name} className="flex flex-col justify-around gap-6">
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-primary">
                {round.name}
              </p>
              {round.matches.map((m) => (
                <MatchBox key={m.id} match={m} champion={ri === bracket.length - 1} />
              ))}
            </div>
          ))}

          {/* Champion column */}
          <div className="flex flex-col justify-center">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-accent">
              Champion
            </p>
            <div className="flex w-52 flex-col items-center gap-2 rounded-lg border border-dashed border-accent/50 bg-accent/5 px-3 py-6 text-center">
              <Trophy className="size-8 text-accent" />
              <span className="text-sm text-muted-foreground">
                {finalWinner ? teamById(finalWinner).name : 'To be decided'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Drag to pan · use the controls to zoom
      </p>
    </div>
  )
}
