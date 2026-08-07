import Link from 'next/link'
import { cn } from '@/lib/utils'
import { standings } from '@/lib/mock-data'
import { TeamCrest } from '@/components/shared/team-crest'
import { FormRow } from '@/components/shared/form-badge'

export function StandingsTable({ compact = false }: { compact?: boolean }) {
  const rows = standings()
  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-2 py-3 font-medium">Club</th>
              <th className="px-2 py-3 text-center font-medium">Pld</th>
              <th className="px-2 py-3 text-center font-medium">W</th>
              <th className="px-2 py-3 text-center font-medium">D</th>
              <th className="px-2 py-3 text-center font-medium">L</th>
              <th className="px-2 py-3 text-center font-medium">GF</th>
              <th className="px-2 py-3 text-center font-medium">GA</th>
              <th className="px-2 py-3 text-center font-medium">GD</th>
              <th className="px-2 py-3 text-center font-medium">Pts</th>
              {!compact ? <th className="px-3 py-3 text-center font-medium">Form</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40"
              >
                <td className="relative px-4 py-3 tabular-nums">
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r',
                      row.rank <= 4
                        ? 'bg-primary'
                        : row.rank <= 6
                          ? 'bg-accent'
                          : row.rank >= 11
                            ? 'bg-[var(--live)]'
                            : 'bg-transparent',
                    )}
                  />
                  {row.rank}
                </td>
                <td className="px-2 py-3">
                  <Link href={`/teams/${row.id}`} className="flex items-center gap-2.5 hover:text-primary">
                    <TeamCrest team={row} size="sm" />
                    <span className="font-medium">{row.name}</span>
                  </Link>
                </td>
                <td className="px-2 py-3 text-center tabular-nums text-muted-foreground">{row.played}</td>
                <td className="px-2 py-3 text-center tabular-nums">{row.won}</td>
                <td className="px-2 py-3 text-center tabular-nums">{row.drawn}</td>
                <td className="px-2 py-3 text-center tabular-nums">{row.lost}</td>
                <td className="px-2 py-3 text-center tabular-nums text-muted-foreground">{row.gf}</td>
                <td className="px-2 py-3 text-center tabular-nums text-muted-foreground">{row.ga}</td>
                <td className="px-2 py-3 text-center tabular-nums">
                  {row.gd > 0 ? `+${row.gd}` : row.gd}
                </td>
                <td className="px-2 py-3 text-center font-display font-bold text-primary tabular-nums">
                  {row.points}
                </td>
                {!compact ? (
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <FormRow form={row.form} />
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!compact ? (
        <div className="flex flex-wrap gap-4 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded bg-primary" />Champions League</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded bg-accent" />Play-off</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-1 rounded bg-[var(--live)]" />Relegation</span>
        </div>
      ) : null}
    </div>
  )
}
