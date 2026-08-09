import Link from 'next/link'
import { ArrowUpRight, CalendarDays, Trophy, Users } from 'lucide-react'
import { getGameModule } from '@/lib/game-modules'

export type TournamentCardData = { _id: string; name: string; slug?: string; description?: string; gameId?: string; status: string; format: string; startDate: string; prizePool?: string; maxSlots?: number; participantCount?: number; bannerUrl?: string }
export function tournamentHref(tournament: TournamentCardData) { return tournament.slug ? `/tournament/${tournament.slug}` : `/tournaments/${tournament._id}` }

export function TournamentCard({ tournament, featured = false }: { tournament: TournamentCardData; featured?: boolean }) {
  const game = getGameModule(tournament.gameId)
  const live = tournament.status === 'Ongoing'
  const registrationAvailable = !['Draft', 'Completed', 'Cancelled'].includes(tournament.status)
  return <Link href={tournamentHref(tournament)} className={`group relative flex min-h-72 overflow-hidden rounded-2xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 ${featured ? 'md:col-span-2' : ''}`}>
    <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(239,35,60,.18),transparent_45%)] opacity-70 transition group-hover:opacity-100" />
    {tournament.bannerUrl && <div className="absolute inset-0 bg-cover bg-center opacity-30 grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" style={{ backgroundImage: `url(${tournament.bannerUrl})` }} />}
    <div className="relative mt-auto w-full p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-white">{game.name}</span><span className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${live ? 'text-primary' : 'text-muted-foreground'}`}>{live && <span className="live-pulse size-1.5 rounded-full bg-primary" />}{tournament.status}</span></div><h3 className="max-w-xl font-display text-2xl font-bold uppercase leading-tight sm:text-3xl">{tournament.name}</h3><p className="mt-2 line-clamp-2 max-w-xl text-sm text-muted-foreground">{tournament.description ?? `${tournament.format} competition for ${game.competitorLabel.toLowerCase()}s ready to prove themselves.`}</p><div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/8 pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" />{new Date(tournament.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><span className="flex items-center gap-1.5"><Users className="size-3.5" />{tournament.maxSlots ? `${tournament.maxSlots} slots` : tournament.format}</span>{tournament.prizePool && <span className="flex items-center gap-1.5"><Trophy className="size-3.5" />{tournament.prizePool}</span>}<span className="ml-auto flex items-center gap-1 font-semibold text-white">{registrationAvailable ? 'Register now' : 'View tournament'}<ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" /></span></div></div>
  </Link>
}
