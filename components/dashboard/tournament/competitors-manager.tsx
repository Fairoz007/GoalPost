'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Mail, Plus, Send, Shield, Trash2, UserRound, Users, X } from 'lucide-react'
import { api } from '@/convex/_generated/api'
import { ConvexError } from 'convex/values'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { COUNTRY_OPTIONS, getIsoFromFlagString } from '@/lib/countries'

type RosterInput = { displayName: string; role: 'captain' | 'player' | 'substitute' | 'coach' }
type RosterMember = RosterInput & { _id?: string }
type Competitor = { _id: Id<'participants'>; name: string; gameId?: 'efootball' | 'valorant'; countryCode?: string; flag?: string; captain?: string; logoUrl?: string; checkedIn?: boolean; roster?: RosterMember[] }
type DirectoryUser = { _id: Id<'users'>; name?: string; email: string; imageUrl?: string }

function normalizeCountry(competitor: Competitor) {
  const stored = competitor.countryCode?.trim()
  if (stored?.length === 2) return stored.toUpperCase()
  const byName = COUNTRY_OPTIONS.find((country) => country.name.toLowerCase() === stored?.toLowerCase())
  return byName?.code ?? getIsoFromFlagString(competitor.flag)?.toUpperCase() ?? ''
}

function countryName(countryCode: string) {
  return COUNTRY_OPTIONS.find((country) => country.code === countryCode)?.name ?? ''
}

function SelectDisplay({ value, placeholder }: { value: string; placeholder: string }) {
  return <span className={value ? 'truncate text-left text-foreground' : 'truncate text-left text-muted-foreground'}>{value || placeholder}</span>
}

export function CompetitorsManager({ tournamentId, tournamentName, gameId, competitors, onCreate, onRemove }: {
  tournamentId: Id<'tournaments'>
  tournamentName: string
  gameId: 'efootball' | 'valorant'
  competitors: Competitor[]
  onCreate: (data: { name: string; userId?: Id<'users'>; countryCode?: string; captain?: string; roster?: RosterInput[] }) => Promise<unknown>
  onRemove: (id: Id<'participants'>) => Promise<unknown>
}) {
  const isValorant = gameId === 'valorant'
  const history = useQuery(api.participants.getAllUnique) as Competitor[] | undefined
  const directory = useQuery(api.users.listDirectory, { tournamentId }) as DirectoryUser[] | undefined
  const invitations = useQuery(api.invitations.listForTournament, { tournamentId })
  const createInvitation = useMutation(api.invitations.create)
  const cancelInvitation = useMutation(api.invitations.cancel)
  const [saving, setSaving] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [inviteUserId, setInviteUserId] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteHref, setInviteHref] = useState('')
  const [selectedHistoryId, setSelectedHistoryId] = useState('')
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [captain, setCaptain] = useState('')
  const [players, setPlayers] = useState(['', '', '', ''])
  const [substitute, setSubstitute] = useState('')
  const [createError, setCreateError] = useState('')

  const historicalCompetitors = useMemo(() => {
    const currentNames = new Set(competitors.map((competitor) => competitor.name.trim().toLowerCase()))
    return (history ?? []).filter((competitor) => (competitor.gameId ?? 'efootball') === gameId && !currentNames.has(competitor.name.trim().toLowerCase()))
  }, [history, gameId, competitors])

  const selectHistorical = (participantId: string | null) => {
    if (!participantId) return
    setSelectedHistoryId(participantId)
    setSelectedUserId('')
    const competitor = historicalCompetitors.find((item) => item._id === participantId)
    if (!competitor) return
    setName(competitor.name)
    setCountryCode(normalizeCountry(competitor))
    setCaptain(competitor.captain ?? competitor.roster?.find((member) => member.role === 'captain')?.displayName ?? '')
    const starters = competitor.roster?.filter((member) => member.role === 'player').map((member) => member.displayName) ?? []
    setPlayers([0, 1, 2, 3].map((index) => starters[index] ?? ''))
    setSubstitute(competitor.roster?.find((member) => member.role === 'substitute')?.displayName ?? '')
  }

  const selectRegisteredUser = (userId: string | null) => {
    if (!userId) return
    setSelectedUserId(userId)
    setSelectedHistoryId('')
    const user = directory?.find((item) => item._id === userId)
    if (user?.name) setName(user.name)
  }

  const selectInviteUser = (userId: string | null) => {
    if (!userId) return
    setInviteUserId(userId)
    const user = directory?.find((item) => item._id === userId)
    if (user) setInviteEmail(user.email)
  }

  const clearForm = () => {
    setSelectedHistoryId('')
    setSelectedUserId('')
    setName('')
    setCountryCode('')
    setCaptain('')
    setPlayers(['', '', '', ''])
    setSubstitute('')
    setCreateError('')
  }

  const createErrorMessage = (error: unknown) => {
    if (error instanceof ConvexError && typeof error.data === 'string') return error.data
    return error instanceof Error
      ? error.message.replace(/^Uncaught Error: /, '')
      : `Could not add ${isValorant ? 'team' : 'player'}.`
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setCreateError('')
    try {
      const trimmedName = name.trim()
      const trimmedCountry = countryCode.trim().toUpperCase()
      if (!trimmedName) throw new Error(`${isValorant ? 'Team' : 'Player'} name is required.`)
      if (!trimmedCountry) throw new Error('Choose a country.')
      if (isValorant) {
        const trimmedCaptain = captain.trim()
        const trimmedPlayers = players.map((player) => player.trim())
        if (!trimmedCaptain || trimmedPlayers.some((player) => !player)) {
          throw new Error('Enter the captain and all four starting players.')
        }
        const roster: RosterInput[] = [{ displayName: trimmedCaptain, role: 'captain' }, ...trimmedPlayers.map((displayName) => ({ displayName, role: 'player' as const }))]
        if (substitute.trim()) roster.push({ displayName: substitute.trim(), role: 'substitute' })
        await onCreate({ name: trimmedName, userId: selectedUserId ? selectedUserId as Id<'users'> : undefined, countryCode: trimmedCountry, captain: trimmedCaptain, roster })
      } else {
        await onCreate({ name: trimmedName, userId: selectedUserId ? selectedUserId as Id<'users'> : undefined, countryCode: trimmedCountry })
      }
      clearForm()
    } catch (error) {
      setCreateError(createErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setInviting(true)
    setInviteError('')
    try {
      const email = inviteEmail.trim().toLowerCase()
      await createInvitation({ tournamentId, email, userId: inviteUserId ? inviteUserId as Id<'users'> : undefined })
      const link = `${window.location.origin}/tournaments/${tournamentId}`
      setInviteHref(`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Invitation to ${tournamentName}`)}&body=${encodeURIComponent(`You have been invited to join ${tournamentName}. Sign in or create your account, then register here:\n\n${link}`)}`)
      setInviteEmail('')
      setInviteUserId('')
    } catch (error) {
      setInviteError(error instanceof Error ? error.message.replace(/^Uncaught Error: /, '') : 'Could not create the invitation.')
    } finally {
      setInviting(false)
    }
  }

  return <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
    <div className="space-y-6">
    <form onSubmit={invite} className="rounded-2xl border border-border bg-card p-6">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10"><Mail className="size-5 text-primary" /></div>
      <h2 className="mt-5 font-display text-2xl font-bold uppercase">Invite participants</h2>
      <p className="mt-1 text-sm text-muted-foreground">Choose an Arena account or invite any valid email address.</p>
      <div className="mt-5 space-y-4">
        {directory && directory.length > 0 && <Field label="Registered Arena user"><Select value={inviteUserId} onValueChange={selectInviteUser}><SelectTrigger className="w-full"><SelectDisplay value={directory.find((user) => user._id === inviteUserId)?.name || directory.find((user) => user._id === inviteUserId)?.email || ''} placeholder="Choose a registered user" /></SelectTrigger><SelectContent>{directory.map((user) => <SelectItem key={user._id} value={user._id}>{user.name || 'Arena user'} · {user.email}</SelectItem>)}</SelectContent></Select></Field>}
        <Field label="Invitation email"><Input type="email" value={inviteEmail} onChange={(event) => { setInviteEmail(event.target.value); if (inviteUserId) setInviteUserId('') }} placeholder="player@example.com" required /></Field>
        {inviteError && <p role="alert" className="text-sm text-destructive">{inviteError}</p>}
        <Button type="submit" className="w-full" disabled={inviting}><Send className="size-4" />{inviting ? 'Creating…' : 'Create invitation'}</Button>
        {inviteHref && <a href={inviteHref} className="flex min-h-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:bg-primary/15">Open prepared email</a>}
      </div>
      {invitations && invitations.length > 0 && <div className="mt-6 border-t border-border pt-4"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent invitations</p><div className="mt-3 space-y-2">{invitations.slice(0, 5).map((invitation) => <div key={invitation._id} className="flex items-center gap-2 rounded-lg bg-background px-3 py-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{invitation.displayName || invitation.email}</p><p className="truncate text-xs capitalize text-muted-foreground">{invitation.displayName ? `${invitation.email} · ` : ''}{invitation.status}</p></div>{invitation.status === 'pending' && <button type="button" aria-label={`Cancel invitation for ${invitation.email}`} onClick={() => void cancelInvitation({ inviteId: invitation._id })} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button>}</div>)}</div></div>}
    </form>
    <form onSubmit={submit} className="h-fit rounded-2xl border border-border bg-card p-6">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">{isValorant ? <Shield className="size-5 text-primary" /> : <UserRound className="size-5 text-primary" />}</div>
      <h2 className="mt-5 font-display text-2xl font-bold uppercase">Add {isValorant ? 'team' : 'player'}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Select a previous competitor or enter a new one.</p>

      {directory && directory.length > 0 && <div className="mt-6"><Field label="Registered Arena account (optional)"><Select value={selectedUserId} onValueChange={selectRegisteredUser}><SelectTrigger className="w-full"><SelectDisplay value={directory.find((user) => user._id === selectedUserId)?.name || directory.find((user) => user._id === selectedUserId)?.email || ''} placeholder={`Link registered ${isValorant ? 'captain' : 'player'}`} /></SelectTrigger><SelectContent>{directory.map((user) => <SelectItem key={user._id} value={user._id}>{user.name || 'Arena user'} · {user.email}</SelectItem>)}</SelectContent></Select></Field></div>}

      {selectedUserId && <div className="mt-2 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-400"><span>This player will be linked to the selected Arena account.</span><button type="button" className="font-bold uppercase tracking-wider hover:text-white" onClick={() => setSelectedUserId('')}>Clear</button></div>}

      {historicalCompetitors.length > 0 && <div className="mt-6 space-y-3">
        <Field label="Quick import from previous tournaments">
          <Select value={selectedHistoryId} onValueChange={selectHistorical}>
            <SelectTrigger className="w-full"><SelectDisplay value={historicalCompetitors.find((competitor) => competitor._id === selectedHistoryId)?.name ?? ''} placeholder={`Select previous ${isValorant ? 'team' : 'player'}…`} /></SelectTrigger>
            <SelectContent>{historicalCompetitors.map((competitor) => <SelectItem key={competitor._id} value={competitor._id}>{competitor.name}{normalizeCountry(competitor) ? ` · ${normalizeCountry(competitor)}` : ''}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <div className="flex items-center gap-3"><span className="h-px flex-1 bg-border" /><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">or add new</span><span className="h-px flex-1 bg-border" /></div>
      </div>}

      <div className="mt-6 space-y-4">
        <Field label={isValorant ? 'Team name' : 'Player name'}><Input value={name} onChange={(event) => { setName(event.target.value); if (selectedUserId) setSelectedUserId(''); if (selectedHistoryId) setSelectedHistoryId('') }} required /></Field>
        <Field label="Country"><Select value={countryCode} onValueChange={(value) => setCountryCode((value ?? '').toUpperCase())} required><SelectTrigger className="w-full"><SelectDisplay value={countryName(countryCode)} placeholder="Choose a country" /></SelectTrigger><SelectContent>{COUNTRY_OPTIONS.map((country) => <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>)}</SelectContent></Select></Field>
        {isValorant && <>
          <Field label="Captain"><Input value={captain} onChange={(event) => setCaptain(event.target.value)} required /></Field>
          {players.map((player, index) => <Field key={index} label={`Starting player ${index + 2}`}><Input value={player} onChange={(event) => setPlayers((current) => current.map((value, playerIndex) => playerIndex === index ? event.target.value : value))} required /></Field>)}
          <Field label="Substitute (optional)"><Input value={substitute} onChange={(event) => setSubstitute(event.target.value)} /></Field>
        </>}
      </div>
      {createError && <p role="alert" className="mt-4 text-sm text-destructive">{createError}</p>}
      <Button type="submit" className="mt-6 w-full" disabled={saving}><Plus className="size-4" />{saving ? 'Adding…' : `Add ${isValorant ? 'team' : 'player'}`}</Button>
    </form>
    </div>

    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between"><div><h2 className="font-display text-2xl font-bold uppercase">Confirmed {isValorant ? 'teams' : 'players'}</h2><p className="text-sm text-muted-foreground">{competitors.length} ready for competition · no approval queue</p></div><Users className="size-5 text-primary" /></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {competitors.map((competitor) => <div key={competitor._id} className="group rounded-xl border border-border bg-background p-4"><div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-display font-bold text-primary">{competitor.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{competitor.name}</p><p className="text-xs text-muted-foreground">{competitor.countryCode ?? competitor.flag ?? 'Global'}{competitor.captain ? ` · Captain ${competitor.captain}` : ''}</p></div><button type="button" onClick={() => onRemove(competitor._id)} className="text-muted-foreground opacity-0 transition hover:text-red-400 group-hover:opacity-100"><Trash2 className="size-4" /></button></div>{competitor.roster && competitor.roster.length > 0 && <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{competitor.roster.map((member) => <span key={member._id ?? `${member.role}-${member.displayName}`} className="mr-2 inline-block">{member.displayName} <span className="text-white/30">({member.role})</span></span>)}</div>}</div>)}
        {competitors.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">No competitors yet.</div>}
      </div>
    </section>
  </div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>
}
