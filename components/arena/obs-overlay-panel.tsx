'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Clipboard, ExternalLink, MonitorUp, Radio, TableProperties } from 'lucide-react'
import type { Id } from '@/convex/_generated/dataModel'
import { Button, buttonVariants } from '@/components/ui/button'
import { getGameModule } from '@/lib/game-modules'
import { cn } from '@/lib/utils'

export function ObsOverlayPanel({ tournamentId, gameId, matches, participants }: { tournamentId: Id<'tournaments'>; gameId?: string; matches: any[]; participants: any[] }) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState('')
  const game = getGameModule(gameId)
  const names = useMemo(() => new Map(participants.map((participant) => [participant._id, participant.name])), [participants])
  useEffect(() => setOrigin(window.location.origin), [])
  const base = `${origin}/tournaments/${tournamentId}/overlay`
  const scoreboard = `${base}?view=scoreboard`
  const standings = `${base}?view=standings&limit=8&position=bottom`
  const copy = async (label: string, url: string) => {
    await navigator.clipboard.writeText(url)
    setCopied(label)
    window.setTimeout(() => setCopied(''), 1800)
  }

  return <div>
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-primary">OBS browser sources</p><h2 className="mt-2 font-display text-4xl font-bold uppercase">Broadcast every match live</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">These public, transparent overlays subscribe directly to Convex. Scores, match status, competitors, and {game.id === 'valorant' ? 'map-based standings' : 'football standings'} update in OBS without refreshing the browser source.</p></div><div className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm"><p className="font-semibold text-white">Recommended OBS settings</p><dl className="mt-4 grid grid-cols-2 gap-y-3 text-xs text-muted-foreground"><dt>Source</dt><dd className="text-right text-white">Browser</dd><dt>Width</dt><dd className="text-right text-white">1920 px</dd><dt>Height</dt><dd className="text-right text-white">1080 px</dd><dt>FPS</dt><dd className="text-right text-white">60</dd></dl></div></div>
    <div className="mt-8 grid gap-4 md:grid-cols-2"><OverlayCard icon={Radio} title="Automatic scorebug" copy="Shows the live match first, then the next scheduled fixture. Ideal for the main gameplay scene." url={scoreboard} copied={copied === 'scoreboard'} onCopy={() => copy('scoreboard', scoreboard)} /><OverlayCard icon={TableProperties} title="Live standings" copy={`Shows the top eight ${game.competitorLabel.toLowerCase()}s using the ${game.name} standings rules.`} url={standings} copied={copied === 'standings'} onCopy={() => copy('standings', standings)} /></div>
    <section className="mt-8 rounded-2xl border border-border bg-card p-6"><div className="flex items-center gap-3"><MonitorUp className="size-5 text-primary" /><div><h3 className="font-display text-xl font-bold uppercase">Match-specific scorebugs</h3><p className="text-xs text-muted-foreground">Pin a browser source to one fixture instead of automatic match selection.</p></div></div><div className="mt-5 grid gap-2">{matches.map((match) => { const label = `${names.get(match.player1Id) ?? 'TBD'} vs ${names.get(match.player2Id) ?? 'TBD'}`; const url = `${scoreboard}&match=${match._id}`; return <div key={match._id} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{label}</p><p className="mt-1 text-xs text-muted-foreground">{match.round ?? 'Tournament match'} · {match.status}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => copy(match._id, url)}>{copied === match._id ? <Check className="size-3.5" /> : <Clipboard className="size-3.5" />}{copied === match._id ? 'Copied' : 'Copy URL'}</Button><a className={buttonVariants({ size: 'sm' })} href={url} target="_blank" rel="noreferrer">Preview<ExternalLink className="size-3.5" /></a></div></div>})}{matches.length === 0 && <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">Generate fixtures to create match-specific overlay links. The automatic scorebug is already available.</div>}</div></section>
  </div>
}

function OverlayCard({ icon: Icon, title, copy, url, copied, onCopy }: { icon: typeof Radio; title: string; copy: string; url: string; copied: boolean; onCopy: () => void }) {
  return <div className="rounded-2xl border border-border bg-card p-6"><Icon className="size-6 text-primary" /><h3 className="mt-6 font-display text-2xl font-bold uppercase">{title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{copy}</p><div className="mt-5 truncate rounded-lg border border-border bg-background px-3 py-2 font-mono text-[10px] text-muted-foreground">{url}</div><div className="mt-4 flex gap-2"><Button onClick={onCopy} className="flex-1">{copied ? <Check className="size-4" /> : <Clipboard className="size-4" />}{copied ? 'Copied' : 'Copy OBS URL'}</Button><a className={cn(buttonVariants({ variant: 'outline' }), 'px-3')} href={url} target="_blank" rel="noreferrer" aria-label={`Preview ${title}`}><ExternalLink className="size-4" /></a></div></div>
}
