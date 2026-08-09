'use client'
import { useMemo, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Search, SlidersHorizontal, Trophy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { TournamentCard, type TournamentCardData } from '@/components/arena/tournament-card'
import { cn } from '@/lib/utils'

const filters = ['All', 'eFootball', 'VALORANT', 'Live', 'Registration Open'] as const
export default function TournamentsPage() {
  const data = useQuery(api.tournaments.getDiscovery); const [filter, setFilter] = useState<(typeof filters)[number]>('All'); const [search, setSearch] = useState('')
  const tournaments = useMemo(() => ((data?.tournaments ?? []) as TournamentCardData[]).filter((t) => {
    const queryMatches = t.name.toLowerCase().includes(search.toLowerCase())
    if (!queryMatches) return false
    if (filter === 'eFootball') return (t.gameId ?? 'efootball') === 'efootball'
    if (filter === 'VALORANT') return t.gameId === 'valorant'
    if (filter === 'Live') return t.status === 'Ongoing'
    if (filter === 'Registration Open') return t.status === 'Registration Open'
    return true
  }), [data, filter, search])
  return <div className="mx-auto min-h-[70vh] max-w-7xl px-4 py-14 sm:px-6"><div className="grid gap-8 border-b border-border pb-10 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[.24em] text-primary">Tournament directory</p><h1 className="mt-3 font-display text-5xl font-bold uppercase sm:text-7xl">Find your next fight</h1><p className="mt-4 max-w-2xl text-muted-foreground">Live brackets, open registrations, and upcoming events across every DoneArena game.</p></div><div className="relative w-full lg:w-80"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tournaments" className="pl-9" /></div></div><div className="my-8 flex items-center gap-3 overflow-x-auto pb-2"><SlidersHorizontal className="mr-1 size-4 shrink-0 text-muted-foreground" />{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={cn('shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition', filter === item ? 'border-primary bg-primary text-white' : 'border-border text-muted-foreground hover:text-white')}>{item}</button>)}</div>{data === undefined ? <div className="grid gap-5 md:grid-cols-2"><div className="h-72 animate-pulse rounded-2xl bg-card" /><div className="h-72 animate-pulse rounded-2xl bg-card" /></div> : tournaments.length ? <div className="grid gap-5 md:grid-cols-2">{tournaments.map((t) => <TournamentCard key={t._id} tournament={t} />)}</div> : <div className="rounded-2xl border border-dashed border-border py-20 text-center"><Trophy className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-display text-2xl font-bold uppercase">No tournaments found</h2><p className="mt-2 text-sm text-muted-foreground">Try a different game, status, or search.</p></div>}</div>
}
