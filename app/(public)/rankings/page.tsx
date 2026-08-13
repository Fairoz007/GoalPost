'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { Crown, Medal, Shield, TrendingUp, Trophy } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import type { GameId } from '@/lib/game-modules'
import { cn } from '@/lib/utils'

const gameLabels: Record<GameId, string> = { efootball: 'eFootball', valorant: 'VALORANT' }

export default function RankingsPage() {
  const [game, setGame] = useState<GameId>('efootball')
  const rankings = useQuery(api.arena.listRankings, { gameId: game, limit: 100 })

  return <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-16 sm:px-6">
    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      <div><p className="text-xs font-bold uppercase tracking-[.24em] text-primary">Global ladder</p><h1 className="mt-3 font-display text-6xl font-bold uppercase sm:text-8xl">Arena rankings</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">Every approved competitor starts provisionally at 1000. Completed matches update ratings and records automatically.</p></div>
      <div className="flex rounded-full border border-border bg-card p-1">{(['efootball', 'valorant'] as GameId[]).map((id) => <button key={id} onClick={() => setGame(id)} aria-pressed={game === id} className={cn('rounded-full px-5 py-2 text-xs font-bold uppercase transition-colors', game === id ? 'bg-primary text-white' : 'text-muted-foreground hover:text-white')}>{gameLabels[id]}</button>)}</div>
    </div>

    <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="hidden grid-cols-[72px_minmax(220px,1fr)_120px_100px_120px] bg-muted/50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground sm:grid"><span>Rank</span><span>Competitor</span><span>Record</span><span>Titles</span><span className="text-right">Rating</span></div>
      {rankings === undefined && <div className="space-y-px bg-border">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-[76px] animate-pulse bg-card" />)}</div>}
      {rankings?.map((row, index) => <div key={row._id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-4 py-4 first:border-t-0 sm:grid-cols-[72px_minmax(220px,1fr)_120px_100px_120px] sm:px-5">
        <span className="font-display text-xl font-bold">{index === 0 ? <Crown className="size-5 text-amber-400" /> : index === 1 ? <Medal className="size-5 text-slate-300" /> : index === 2 ? <Medal className="size-5 text-amber-700" /> : index + 1}</span>
        <div className="min-w-0"><p className="truncate font-semibold">{row.displayName}</p><p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><Shield className="size-3" />{row.countryCode ?? 'Global'} · {row.kind}</p></div>
        <span className="flex items-center justify-end gap-1 font-display text-xl font-bold text-primary sm:order-last"><TrendingUp className="size-3" />{row.rating}</span>
        <span className="hidden text-sm text-muted-foreground sm:block">{row.wins}–{row.losses}</span>
        <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex"><Trophy className="size-3.5" />{row.tournamentsWon}</span>
        <div className="col-start-2 flex gap-4 text-xs text-muted-foreground sm:hidden"><span>{row.wins}–{row.losses} record</span><span>{row.tournamentsWon} titles</span></div>
      </div>)}
      {rankings?.length === 0 && <div className="px-5 py-20 text-center"><Trophy className="mx-auto size-10 text-muted-foreground" /><p className="mt-4 font-semibold">No {gameLabels[game]} competitors yet</p><p className="mt-2 text-sm text-muted-foreground">Approved competitors will appear here at a provisional 1000 rating.</p></div>}
    </div>
  </div>
}
