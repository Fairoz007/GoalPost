'use client'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useParams } from 'next/navigation'
import type { Id } from '@/convex/_generated/dataModel'
import { Trophy } from 'lucide-react'

export default function StandingsPage() {
  const params = useParams<{ id: string }>(); const tournamentId = params.id as Id<'tournaments'>
  const standings = useQuery(api.matches.getStandings, { tournamentId })
  if (standings === undefined) return <div className="h-80 animate-pulse rounded-2xl bg-card" />
  const valorant = standings.gameId === 'valorant'
  return <div className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center gap-3"><Trophy className="size-5 text-primary" /><div><h1 className="font-display text-2xl font-bold uppercase">{valorant ? 'VALORANT' : 'eFootball'} standings</h1><p className="text-xs text-muted-foreground">Calculated in real time by the tournament engine</p></div></div><div className="mt-6 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[720px] text-sm"><thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="p-4 text-left">#</th><th className="p-4 text-left">{valorant ? 'Team' : 'Player'}</th><th>MP</th><th>W</th>{!valorant && <th>D</th>}<th>L</th><th>{valorant ? 'Map W' : 'GF'}</th><th>{valorant ? 'Map L' : 'GA'}</th>{valorant && <><th>Map ±</th><th>Round ±</th></>} {!valorant && <th>GD</th>}<th className="pr-5">PTS</th></tr></thead><tbody>{standings.rows.map((row, index) => <tr key={row._id} className="border-t border-border"><td className="p-4 font-mono text-muted-foreground">{index + 1}</td><td className="p-4 font-semibold">{row.name}</td><td className="text-center">{row.played}</td><td className="text-center">{row.won}</td>{!valorant && <td className="text-center">{row.drawn}</td>}<td className="text-center">{row.lost}</td><td className="text-center">{row.scored}</td><td className="text-center">{row.conceded}</td>{valorant && <><td className="text-center">{signed(row.mapDifferential)}</td><td className="text-center">{signed(row.roundDifferential)}</td></>}{!valorant && <td className="text-center">{signed(row.differential)}</td>}<td className="pr-5 text-center font-display text-xl font-bold text-primary">{row.points}</td></tr>)}</tbody></table>{standings.rows.length === 0 && <div className="py-14 text-center text-sm text-muted-foreground">Standings will appear when competitors join.</div>}</div></div>
}
function signed(value: number) { return value > 0 ? `+${value}` : value }
