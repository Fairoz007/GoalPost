'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { ArrowRight, Users } from 'lucide-react'
import { gameModules, type GameId } from '@/lib/game-modules'
import { TournamentCard, type TournamentCardData } from '@/components/arena/tournament-card'
import { buttonVariants } from '@/components/ui/button'

export default function GamePage() {
  const params = useParams<{ game: string }>(); const id: GameId = params.game === 'valorant' ? 'valorant' : 'efootball'; const visual = gameModules[id]
  const gameModule = useQuery(api.gameModules.get, { gameId: id }); const data = useQuery(api.tournaments.getDiscovery)
  const tournaments = ((data?.tournaments ?? []) as unknown as TournamentCardData[]).filter((t) => (t.gameId ?? 'efootball') === id)
  return <><section className="relative overflow-hidden border-b border-border"><div className="field-grid absolute inset-0 opacity-50" /><div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32"><visual.Icon className="size-12 text-primary" /><p className="mt-10 text-xs font-bold uppercase tracking-[.24em] text-primary">{gameModule?.teamSize ?? visual.teamSize}v{gameModule?.teamSize ?? visual.teamSize} competition</p><h1 className="mt-3 font-display text-7xl font-bold uppercase sm:text-9xl">{gameModule?.name ?? visual.name}</h1><p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">{visual.description}</p><Link href="/tournaments" className={`${buttonVariants({ size: 'lg' })} mt-8`}>Find a tournament <ArrowRight className="size-4" /></Link></div></section><main className="mx-auto max-w-7xl px-4 py-16 sm:px-6"><div className="grid gap-10 lg:grid-cols-[1fr_320px]"><div><h2 className="font-display text-4xl font-bold uppercase">Tournaments</h2><div className="mt-7 grid gap-5">{tournaments.map((t) => <TournamentCard key={t._id} tournament={t} />)}{data && tournaments.length === 0 && <div className="rounded-xl border border-dashed border-border py-14 text-center text-muted-foreground">No {visual.name} tournaments published yet.</div>}</div></div><aside className="rounded-2xl border border-border bg-card p-6"><Users className="size-6 text-primary" /><h2 className="mt-5 font-display text-2xl font-bold uppercase">Convex module rules</h2><p className="mt-2 text-sm text-muted-foreground">Competitor: {gameModule?.competitorKind ?? visual.competitorLabel}<br />Roster size: {gameModule?.teamSize ?? visual.teamSize}<br />Default series: Best of {gameModule?.defaultBestOf ?? 1}<br />Score: {gameModule?.scoreLabel ?? 'Goals'}</p><h3 className="mt-7 text-xs font-bold uppercase tracking-wider text-muted-foreground">Supported formats</h3><ul className="mt-3 space-y-2 text-sm">{(gameModule?.formats ?? visual.formats).map((format) => <li key={format} className="border-b border-border pb-2">{format}</li>)}</ul><h3 className="mt-7 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tracked statistics</h3><p className="mt-3 text-sm text-muted-foreground">{(gameModule?.statFields ?? visual.stats).join(', ')}</p></aside></div></main></>
}
