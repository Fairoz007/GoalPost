'use client'

import { useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { getGameModule } from '@/lib/game-modules'
import { cn } from '@/lib/utils'

type OverlayView = 'scoreboard' | 'standings'

export default function OBSOverlayPage() {
  const params = useParams<{ id: string }>()
  const search = useSearchParams()
  const tournamentId = params.id as Id<'tournaments'>
  const requestedMatch = search.get('match') as Id<'matches'> | null
  const view: OverlayView = search.get('view') === 'standings' ? 'standings' : 'scoreboard'
  const position = search.get('position') === 'bottom' ? 'bottom' : 'top'
  const limit = Math.min(Math.max(Number(search.get('limit')) || 8, 4), 16)
  const data = useQuery(api.matches.getOverlayData, { tournamentId, matchId: requestedMatch ?? undefined })

  useEffect(() => {
    const htmlBackground = document.documentElement.style.background
    const bodyBackground = document.body.style.background
    const bodyOverflow = document.body.style.overflow
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.background = htmlBackground
      document.body.style.background = bodyBackground
      document.body.style.overflow = bodyOverflow
    }
  }, [])

  if (!data) return null
  const game = getGameModule(data.tournament.gameId)

  return (
    <main className="pointer-events-none relative h-screen w-screen overflow-hidden bg-transparent font-sans text-white">
      {view === 'standings'
        ? <StandingsOverlay data={data} game={game} limit={limit} position={position} />
        : <ScoreboardOverlay data={data} game={game} position={position} />}
    </main>
  )
}

function ScoreboardOverlay({ data, game, position }: { data: any; game: ReturnType<typeof getGameModule>; position: 'top' | 'bottom' }) {
  const match = data.match
  const live = match?.status === 'Live'
  const scoreLabel = game.id === 'valorant' ? `MAPS · BO${match?.bestOf ?? data.tournament.bestOf ?? 3}` : 'GOALS'
  return (
    <div className={cn('absolute left-1/2 w-[min(92vw,1120px)] -translate-x-1/2 drop-shadow-[0_18px_30px_rgba(0,0,0,.8)]', position === 'bottom' ? 'bottom-[5vh]' : 'top-[4vh]')}>
      <div className="flex h-10 items-center justify-between rounded-t-xl border border-b-0 border-white/15 bg-[#080808]/95 px-5 text-[11px] font-bold uppercase tracking-[.2em]">
        <span className="flex items-center gap-3"><BrandMark /><span className="max-w-[420px] truncate text-white/70">{data.tournament.name}</span></span>
        <span className="text-white/45">{game.name} · {match?.round ?? data.tournament.currentStage ?? 'Tournament'}</span>
      </div>
      <div className="grid min-h-28 grid-cols-[1fr_auto_1fr] items-stretch overflow-hidden border-x border-white/15 bg-[#101010]/96">
        <CompetitorSide competitor={data.player1} side="left" />
        <div className="relative flex min-w-52 flex-col items-center justify-center border-x border-white/10 bg-black/55 px-8">
          <div className="font-display text-6xl font-bold tabular-nums leading-none">
            {match?.player1Score ?? '–'} <span className="text-3xl text-primary">:</span> {match?.player2Score ?? '–'}
          </div>
          <span className="mt-2 text-[10px] font-bold uppercase tracking-[.24em] text-white/40">{scoreLabel}</span>
        </div>
        <CompetitorSide competitor={data.player2} side="right" />
      </div>
      <div className="flex h-9 items-center justify-between rounded-b-xl border border-t-0 border-white/15 bg-[#080808]/95 px-5 text-[10px] font-bold uppercase tracking-[.18em]">
        <span className={cn('flex items-center gap-2', live ? 'text-primary' : 'text-white/55')}><span className={cn('size-1.5 rounded-full', live ? 'animate-pulse bg-primary shadow-[0_0_10px_currentColor]' : 'bg-white/30')} />{match?.status ?? 'Waiting for fixture'}</span>
        <span className="text-white/35">arena.donestudio.in</span>
      </div>
    </div>
  )
}

function CompetitorSide({ competitor, side }: { competitor: any; side: 'left' | 'right' }) {
  const initials = competitor?.name?.slice(0, 2).toUpperCase() ?? 'TBD'
  return <div className={cn('flex min-w-0 items-center gap-4 px-6', side === 'right' && 'flex-row-reverse text-right')}>
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-white/5 font-display text-lg font-bold text-primary">{competitor?.logoUrl || competitor?.avatarUrl ? <img src={competitor.logoUrl ?? competitor.avatarUrl} alt="" className="size-full object-cover" /> : initials}</div>
    <div className="min-w-0"><p className="truncate font-display text-3xl font-bold uppercase leading-none">{competitor?.name ?? 'To be decided'}</p><p className="mt-2 truncate text-[10px] font-bold uppercase tracking-[.2em] text-white/40">{competitor?.captain ? `Captain · ${competitor.captain}` : competitor?.countryCode ?? 'Arena competitor'}</p></div>
  </div>
}

function StandingsOverlay({ data, game, limit, position }: { data: any; game: ReturnType<typeof getGameModule>; limit: number; position: 'top' | 'bottom' }) {
  const valorant = game.id === 'valorant'
  const rows = data.standings.slice(0, limit)
  return <div className={cn('absolute left-[3vw] w-[min(92vw,860px)] overflow-hidden rounded-2xl border border-white/15 bg-[#090909]/96 shadow-[0_24px_60px_rgba(0,0,0,.8)]', position === 'bottom' ? 'bottom-[4vh]' : 'top-[4vh]')}>
    <div className="flex items-center justify-between border-b border-white/10 bg-primary px-6 py-4 text-black"><div><p className="text-[10px] font-black uppercase tracking-[.22em]">{game.name} · Live table</p><h1 className="mt-1 max-w-[600px] truncate font-display text-2xl font-bold uppercase">{data.tournament.name}</h1></div><BrandMark dark /></div>
    <table className="w-full table-fixed text-sm">
      <thead className="bg-white/[.04] text-[10px] font-bold uppercase tracking-[.16em] text-white/40"><tr><th className="w-14 py-3 text-center">#</th><th className="px-3 text-left">{game.competitorLabel}</th><th className="w-12">P</th><th className="w-12">W</th>{!valorant && <th className="w-12">D</th>}<th className="w-12">L</th><th className="w-16">{valorant ? 'MW' : 'GF'}</th><th className="w-16">{valorant ? 'ML' : 'GA'}</th><th className="w-16">{valorant ? 'RD' : 'GD'}</th><th className="w-16 text-primary">PTS</th></tr></thead>
      <tbody>{rows.map((row: any, index: number) => <tr key={row._id} className="border-t border-white/[.07]"><td className="py-3 text-center font-mono text-white/45">{index + 1}</td><td className="truncate px-3 font-display text-base font-semibold uppercase">{row.name}</td><td className="text-center text-white/60">{row.played}</td><td className="text-center text-white/60">{row.won}</td>{!valorant && <td className="text-center text-white/60">{row.drawn}</td>}<td className="text-center text-white/60">{row.lost}</td><td className="text-center text-white/60">{row.scored}</td><td className="text-center text-white/60">{row.conceded}</td><td className="text-center font-semibold">{row.differential > 0 ? `+${row.differential}` : row.differential}</td><td className="text-center font-display text-lg font-bold text-primary">{row.points}</td></tr>)}</tbody>
    </table>
    <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 text-[9px] font-bold uppercase tracking-[.2em] text-white/30"><span>Updates instantly from DoneArena</span><span>arena.donestudio.in</span></div>
  </div>
}

function BrandMark({ dark = false }: { dark?: boolean }) {
  return <span className={cn('font-display text-sm font-bold tracking-tight', dark ? 'text-black' : 'text-white')}><span className={dark ? 'text-black/55' : 'text-primary'}>DONE</span>ARENA</span>
}
