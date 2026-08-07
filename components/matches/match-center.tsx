'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeftRight,
  CircleDot,
  Square,
  Stethoscope,
  MapPin,
  Flag,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { teamById, type Match, type MatchEvent } from '@/lib/mock-data'
import { TeamCrest } from '@/components/shared/team-crest'
import { LiveDot } from '@/components/shared/match-card'

const eventIcon: Record<MatchEvent['type'], typeof CircleDot> = {
  goal: CircleDot,
  penalty: CircleDot,
  yellow: Square,
  red: Square,
  sub: ArrowLeftRight,
  injury: Stethoscope,
}

function StatBar({
  label,
  home,
  away,
}: {
  label: string
  home: number
  away: number
}) {
  const total = home + away || 1
  const homePct = Math.round((home / total) * 100)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-display font-semibold tabular-nums">{home}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-display font-semibold tabular-nums">{away}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="bg-primary" style={{ width: `${homePct}%` }} />
        <div className="bg-[var(--chart-3)]" style={{ width: `${100 - homePct}%` }} />
      </div>
    </div>
  )
}

export function MatchCenter({ match }: { match: Match }) {
  const home = teamById(match.homeId)
  const away = teamById(match.awayId)
  const isLive = match.status === 'live'
  const [minute, setMinute] = useState(match.minute ?? 0)

  useEffect(() => {
    if (!isLive) return
    const id = setInterval(() => {
      setMinute((m) => (m >= 90 ? 90 : m + 1))
    }, 4000)
    return () => clearInterval(id)
  }, [isLive])

  return (
    <div className="space-y-6">
      {/* Scoreboard */}
      <div className="glass-strong relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="absolute inset-0 field-grid opacity-30" aria-hidden />
        <div className="relative">
          <div className="mb-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>{match.round}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {match.venue}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <TeamCrest team={home} size="xl" />
              <span className="font-display text-sm font-semibold sm:text-base">{home.name}</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              {isLive ? (
                <span className="flex items-center gap-1.5 rounded-full bg-[var(--live)]/15 px-3 py-1 text-xs font-bold text-[var(--live)]">
                  <LiveDot />
                  {minute}&apos;
                </span>
              ) : (
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {match.status === 'finished' ? 'Full time' : `${match.date.slice(5)} · ${match.time}`}
                </span>
              )}
              <div className="flex items-center gap-3 font-display text-5xl font-bold tabular-nums sm:text-6xl">
                <motion.span
                  key={match.homeScore}
                  initial={{ scale: 1.4, color: 'var(--primary)' }}
                  animate={{ scale: 1, color: 'var(--foreground)' }}
                >
                  {match.status === 'upcoming' ? '-' : match.homeScore}
                </motion.span>
                <span className="text-2xl text-muted-foreground">:</span>
                <motion.span
                  key={match.awayScore}
                  initial={{ scale: 1.4, color: 'var(--primary)' }}
                  animate={{ scale: 1, color: 'var(--foreground)' }}
                >
                  {match.status === 'upcoming' ? '-' : match.awayScore}
                </motion.span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 text-center">
              <TeamCrest team={away} size="xl" />
              <span className="font-display text-sm font-semibold sm:text-base">{away.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Timeline */}
        <div className="lg:col-span-3">
          <h2 className="mb-4 font-display text-lg font-semibold">Match timeline</h2>
          {match.events.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No events yet. Kick-off {match.time}.
            </p>
          ) : (
            <ol className="relative space-y-3 border-l border-border pl-6">
              {[...match.events].reverse().map((e, i) => {
                const Icon = eventIcon[e.type]
                const isHome = e.teamId === match.homeId
                return (
                  <li key={i} className="relative">
                    <span
                      className={cn(
                        'absolute -left-[31px] flex size-5 items-center justify-center rounded-full',
                        e.type === 'goal' || e.type === 'penalty'
                          ? 'bg-primary text-primary-foreground'
                          : e.type === 'red'
                            ? 'bg-[var(--live)] text-white'
                            : e.type === 'yellow'
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <Icon className="size-3" />
                    </span>
                    <div
                      className={cn(
                        'glass flex items-center gap-3 rounded-lg px-4 py-2.5',
                        !isHome && 'flex-row-reverse text-right',
                      )}
                    >
                      <span className="font-display text-sm font-bold text-primary tabular-nums">
                        {e.minute}&apos;
                      </span>
                      <div className={cn('min-w-0 flex-1', !isHome && 'text-right')}>
                        <p className="truncate text-sm font-medium">{e.player}</p>
                        {e.detail ? (
                          <p className="truncate text-xs text-muted-foreground">{e.detail}</p>
                        ) : (
                          <p className="text-xs capitalize text-muted-foreground">{e.type}</p>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        {/* Stats + referee */}
        <div className="space-y-6 lg:col-span-2">
          {match.possession ? (
            <div className="glass rounded-xl p-5">
              <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Match stats
              </h3>
              <div className="space-y-4">
                <StatBar label="Possession %" home={match.possession[0]} away={match.possession[1]} />
                {match.shots ? <StatBar label="Shots" home={match.shots[0]} away={match.shots[1]} /> : null}
                {match.corners ? <StatBar label="Corners" home={match.corners[0]} away={match.corners[1]} /> : null}
              </div>
            </div>
          ) : null}

          <div className="glass rounded-xl p-5">
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Flag className="size-4" />
              Officials
            </h3>
            <p className="text-sm">
              Referee: <span className="font-medium">{match.referee}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Venue: {match.venue}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
