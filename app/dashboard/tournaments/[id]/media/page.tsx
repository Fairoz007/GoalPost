'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery } from 'convex/react'
import {
  CalendarClock,
  Check,
  Clock3,
  ExternalLink,
  Film,
  Link2,
  LockKeyhole,
  Pencil,
  Play,
  Radio,
  Save,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { ObsOverlayPanel } from '@/components/arena/obs-overlay-panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getTournamentEditCode } from '@/lib/tournament-admin'
import { cn } from '@/lib/utils'

type StreamMatch = {
  _id: Id<'matches'>
  player1Id: Id<'participants'>
  player2Id: Id<'participants'>
  player1Score?: number
  player2Score?: number
  status: string
  date: string
  round?: string
  youtubeVideoId?: string
}

function timestamp(match: StreamMatch) {
  const value = new Date(match.date).getTime()
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value
}

function isToday(match: StreamMatch) {
  const date = new Date(match.date)
  const today = new Date()
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
}

function formatSchedule(dateValue: string) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'Schedule pending'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export default function MediaPage() {
  const params = useParams<{ id: string }>()
  const tournamentId = params.id as Id<'tournaments'>
  const tournament = useQuery(api.tournaments.getOwnedById, { id: tournamentId })
  const matches = useQuery(api.matches.getByTournament, { tournamentId }) as StreamMatch[] | undefined
  const participants = useQuery(api.participants.getByTournament, { tournamentId })
  const setYouTubeVideo = useMutation(api.matches.setYouTubeVideo)
  const [selectedMatchId, setSelectedMatchId] = useState<Id<'matches'> | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const participantNames = useMemo(
    () => new Map(participants?.map((participant) => [participant._id, participant.name]) ?? []),
    [participants],
  )
  const orderedMatches = useMemo(
    () => [...(matches ?? [])].sort((first, second) => timestamp(first) - timestamp(second)),
    [matches],
  )
  const todayMatches = orderedMatches.filter((match) => isToday(match))
  const liveMatch = orderedMatches.find((match) => match.status === 'Live')
  const nextMatch = orderedMatches.find((match) => match.status !== 'Completed' && !isToday(match) && timestamp(match) > Date.now())
  const primaryTodayMatch = liveMatch ?? todayMatches.find((match) => match.status !== 'Completed') ?? todayMatches[0]
  const selectedMatch = orderedMatches.find((match) => match._id === selectedMatchId)
  const embeddedCount = orderedMatches.filter((match) => match.youtubeVideoId).length

  useEffect(() => {
    if (!selectedMatchId && orderedMatches.length) {
      const initialMatch = liveMatch ?? primaryTodayMatch ?? nextMatch ?? orderedMatches[0]
      setSelectedMatchId(initialMatch._id)
      setVideoUrl(initialMatch.youtubeVideoId ? `https://youtu.be/${initialMatch.youtubeVideoId}` : '')
    }
  }, [liveMatch, nextMatch, orderedMatches, primaryTodayMatch, selectedMatchId])

  const matchName = (match: StreamMatch) => `${participantNames.get(match.player1Id) ?? 'TBD'} vs ${participantNames.get(match.player2Id) ?? 'TBD'}`

  const selectMatch = (match: StreamMatch) => {
    setSelectedMatchId(match._id)
    setVideoUrl(match.youtubeVideoId ? `https://youtu.be/${match.youtubeVideoId}` : '')
    setMessage('')
    setError('')
    requestAnimationFrame(() => document.getElementById('stream-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const saveVideo = async (nextUrl = videoUrl) => {
    if (!selectedMatch) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await setYouTubeVideo({ matchId: selectedMatch._id, videoUrl: nextUrl, adminCode: getTournamentEditCode(tournamentId) })
      setVideoUrl(nextUrl)
      setMessage(nextUrl.trim() ? 'Stream URL saved. The public match page is updated.' : 'Stream URL removed from this match.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the stream URL.')
    } finally {
      setSaving(false)
    }
  }

  if (tournament === undefined || matches === undefined || participants === undefined) return <StudioSkeleton />
  if (!tournament) return <div className="rounded-2xl border border-border bg-card py-24 text-center"><LockKeyhole className="mx-auto size-9 text-muted-foreground" /><p className="mt-4 font-semibold">Streamer access required</p><p className="mt-2 text-sm text-muted-foreground">Only the account that created this tournament can manage its streams.</p></div>

  return <div className="space-y-8">
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(239,35,60,.22),transparent_38%)]" />
      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div><Badge className="border-primary/20 bg-primary/10 text-primary"><Sparkles />Creator studio</Badge><h1 className="mt-5 font-display text-4xl font-bold uppercase sm:text-5xl">Stream control room</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Manage today&apos;s broadcast and prepare the next match without leaving your tournament dashboard. Every saved URL updates the public match page instantly.</p></div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-md">
            <StudioMetric value={todayMatches.length} label="Today" />
            <StudioMetric value={embeddedCount} label="URLs ready" />
            <StudioMetric value={orderedMatches.length} label="Matches" />
          </div>
        </div>
        <div className="mt-8 flex items-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground"><LockKeyhole className="size-3.5 text-emerald-400" /><span>Protected creator workspace</span><span className="text-border">•</span><span>Only you can add, edit, or remove tournament stream URLs.</span></div>
      </div>
    </section>

    {orderedMatches.length ? <>
      <section className="grid gap-4 lg:grid-cols-2">
        <FeaturedStream label={liveMatch ? 'Live now' : 'Today’s stream'} icon={liveMatch ? Radio : Video} match={primaryTodayMatch} matchName={matchName} onSelect={selectMatch} emptyText="No match is scheduled for today." active={selectedMatchId === primaryTodayMatch?._id} />
        <FeaturedStream label="Up next" icon={CalendarClock} match={nextMatch} matchName={matchName} onSelect={selectMatch} emptyText="No future match is scheduled yet." active={selectedMatchId === nextMatch?._id} />
      </section>

      <section id="stream-editor" className="scroll-mt-28 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/20">
        <div className="grid xl:grid-cols-[minmax(380px,.82fr)_minmax(0,1.18fr)]">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Selected broadcast</p><h2 className="mt-2 font-display text-2xl font-bold uppercase">{selectedMatch ? matchName(selectedMatch) : 'Choose a match'}</h2></div>{selectedMatch?.youtubeVideoId && <Badge className="bg-emerald-500/10 text-emerald-400"><Check />URL ready</Badge>}</div>
            {selectedMatch && <><div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground"><Badge variant="outline">{selectedMatch.status}</Badge><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{formatSchedule(selectedMatch.date)}</span><span>•</span><span>{selectedMatch.round ?? 'Tournament match'}</span></div>
              <div className="mt-7 space-y-2"><Label htmlFor="youtube-url">YouTube stream URL</Label><div className="relative"><Link2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="youtube-url" type="url" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="h-11 pl-10" /></div><p className="text-xs leading-5 text-muted-foreground">Paste a YouTube watch, Live, Shorts, or youtu.be link. You can return and replace it before the next stream.</p></div>
              <div className="mt-6 flex flex-wrap gap-3"><Button size="lg" onClick={() => void saveVideo()} disabled={saving || !videoUrl.trim()}><Save />{saving ? 'Saving…' : selectedMatch.youtubeVideoId ? 'Update URL' : 'Publish URL'}</Button>{selectedMatch.youtubeVideoId && <Button size="lg" variant="outline" disabled={saving} onClick={() => void saveVideo('')}><Trash2 />Remove</Button>}<Button size="lg" variant="ghost" render={<Link href={`/match/${selectedMatch._id}`} target="_blank" />}><ExternalLink />Public page</Button></div>
              {message && <p className="mt-4 flex items-center gap-2 text-sm text-emerald-400"><Check className="size-4" />{message}</p>}{error && <p className="mt-4 text-sm text-red-400">{error}</p>}</>}
          </div>
          <div className="relative min-h-72 border-t border-border bg-black xl:border-l xl:border-t-0">{selectedMatch?.youtubeVideoId ? <><iframe className="aspect-video h-full min-h-72 w-full" src={`https://www.youtube-nocookie.com/embed/${selectedMatch.youtubeVideoId}`} title={`${matchName(selectedMatch)} stream preview`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /><span className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">Preview</span></> : <div className="field-grid flex h-full min-h-72 items-center justify-center p-8 text-center"><div><span className="mx-auto flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/5"><Play className="ml-1 size-6 text-primary" /></span><p className="mt-5 font-display text-xl font-bold uppercase">Preview ready</p><p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Add a YouTube URL to preview the broadcast here before viewers see it.</p></div></div>}</div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-primary">Stream queue</p><h2 className="mt-2 font-display text-3xl font-bold uppercase">Every match, always editable</h2></div><p className="text-sm text-muted-foreground">{embeddedCount} of {orderedMatches.length} stream URLs ready</p></div>
        <div className="mt-6 divide-y divide-border overflow-hidden rounded-2xl border border-border">{orderedMatches.map((match, index) => <StreamQueueRow key={match._id} match={match} index={index} name={matchName(match)} active={selectedMatchId === match._id} onSelect={selectMatch} />)}</div>
      </section>
    </> : <section className="rounded-3xl border border-dashed border-border bg-card py-20 text-center"><Film className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-5 font-display text-2xl font-bold uppercase">No matches to stream yet</h2><p className="mt-2 text-sm text-muted-foreground">Generate tournament fixtures, then return here to prepare every YouTube broadcast.</p></section>}

    <ObsOverlayPanel tournamentId={tournamentId} gameId={tournament.gameId} matches={matches} participants={participants} />
  </div>
}

function StudioMetric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-2xl border border-white/8 bg-black/20 p-4 backdrop-blur"><p className="font-display text-3xl font-bold">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p></div>
}

function FeaturedStream({ label, icon: Icon, match, matchName, onSelect, emptyText, active }: { label: string; icon: typeof Video; match?: StreamMatch; matchName: (match: StreamMatch) => string; onSelect: (match: StreamMatch) => void; emptyText: string; active: boolean }) {
  return <article className={cn('relative overflow-hidden rounded-2xl border bg-card p-6 transition-colors', active ? 'border-primary/50' : 'border-border')}><div className="absolute right-0 top-0 size-28 rounded-full bg-primary/8 blur-3xl" /><div className="relative"><div className="flex items-center justify-between"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-primary"><Icon className="size-4" />{label}</p>{match?.youtubeVideoId && <Badge className="bg-emerald-500/10 text-emerald-400"><Check />Ready</Badge>}</div>{match ? <><h3 className="mt-5 font-display text-2xl font-bold uppercase">{matchName(match)}</h3><p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" />{formatSchedule(match.date)}</p><div className="mt-6 flex items-center justify-between gap-3"><Badge variant="outline">{match.status}</Badge><Button variant={match.youtubeVideoId ? 'outline' : 'default'} onClick={() => onSelect(match)}>{match.youtubeVideoId ? <Pencil /> : <Link2 />}{match.youtubeVideoId ? 'Edit URL' : 'Add URL'}</Button></div></> : <div className="py-8"><p className="text-sm text-muted-foreground">{emptyText}</p></div>}</div></article>
}

function StreamQueueRow({ match, index, name, active, onSelect }: { match: StreamMatch; index: number; name: string; active: boolean; onSelect: (match: StreamMatch) => void }) {
  return <div className={cn('grid items-center gap-4 bg-background/50 px-4 py-4 transition-colors sm:grid-cols-[44px_minmax(0,1fr)_170px_100px_auto] sm:px-5', active && 'bg-primary/5')}><span className="hidden font-display text-lg font-bold text-muted-foreground sm:block">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0"><p className="truncate font-semibold">{name}</p><p className="mt-1 text-xs text-muted-foreground">{match.round ?? 'Tournament match'}</p></div><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{formatSchedule(match.date)}</p><Badge variant="outline" className="justify-self-start">{match.status}</Badge><Button size="sm" variant={match.youtubeVideoId ? 'outline' : 'default'} onClick={() => onSelect(match)}>{match.youtubeVideoId ? <Pencil /> : <Link2 />}{match.youtubeVideoId ? 'Edit' : 'Add URL'}</Button></div>
}

function StudioSkeleton() {
  return <div className="space-y-6"><div className="h-60 animate-pulse rounded-3xl bg-card" /><div className="grid gap-4 lg:grid-cols-2"><div className="h-48 animate-pulse rounded-2xl bg-card" /><div className="h-48 animate-pulse rounded-2xl bg-card" /></div><div className="h-96 animate-pulse rounded-3xl bg-card" /></div>
}
