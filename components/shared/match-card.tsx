import Link from 'next/link'
import { cn } from '@/lib/utils'
import { teamById, type Match } from '@/lib/mock-data'
import { TeamCrest } from './team-crest'

export function LiveDot({ className }: { className?: string }) {
  return (
    <span
      className={cn('live-pulse inline-block size-2 rounded-full bg-[var(--live)]', className)}
      aria-hidden
    />
  )
}

export function MatchCard({ match, href }: { match: Match; href?: string }) {
  const home = teamById(match.homeId)
  const away = teamById(match.awayId)
  const isLive = match.status === 'live' || match.status === 'ht'
  const finished = match.status === 'finished'

  const inner = (
    <div className="glass group relative flex flex-col gap-3 rounded-xl p-4 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{match.round}</span>
        {isLive ? (
          <span className="flex items-center gap-1.5 font-semibold text-[var(--live)]">
            <LiveDot />
            {match.status === 'ht' ? 'HT' : `${match.minute}'`}
          </span>
        ) : finished ? (
          <span className="font-medium">FT</span>
        ) : (
          <span>
            {match.date.slice(5)} · {match.time}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <TeamCrest team={home} size="sm" />
          <span className="truncate text-sm font-medium">{home.name}</span>
        </div>
        <span
          className={cn(
            'font-display text-lg font-semibold tabular-nums',
            isLive && 'text-primary',
          )}
        >
          {finished || isLive ? match.homeScore : '-'}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <TeamCrest team={away} size="sm" />
          <span className="truncate text-sm font-medium">{away.name}</span>
        </div>
        <span
          className={cn(
            'font-display text-lg font-semibold tabular-nums',
            isLive && 'text-primary',
          )}
        >
          {finished || isLive ? match.awayScore : '-'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span className="truncate">{match.venue}</span>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    )
  }
  return inner
}
