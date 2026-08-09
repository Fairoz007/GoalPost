'use client'
import { FormEvent, useState } from 'react'
import { Check, Clock3, Plus, Shield, Trash2, UserRound, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Id } from '@/convex/_generated/dataModel'

type Registration = { _id: Id<'registrations'>; applicantName: string; applicantEmail: string; phoneNumber?: string; countryCode?: string; captainName?: string; status: string; roster: Array<{ _id: string; displayName: string; role: string }> }
type Competitor = { _id: Id<'participants'>; name: string; countryCode?: string; flag?: string; captain?: string; logoUrl?: string; checkedIn?: boolean; roster?: Array<{ _id: string; displayName: string; role: string }> }
type RosterInput = { displayName: string; role: 'captain' | 'player' | 'substitute' | 'coach' }

export function CompetitorsManager({ gameId, competitors, registrations, onCreate, onRemove, onReview }: {
  gameId: 'efootball' | 'valorant'; competitors: Competitor[]; registrations: Registration[];
  onCreate: (data: { name: string; countryCode?: string; flag?: string; captain?: string; roster?: RosterInput[] }) => Promise<unknown>;
  onRemove: (id: Id<'participants'>) => Promise<unknown>;
  onReview: (id: Id<'registrations'>, decision: 'approved' | 'rejected') => Promise<unknown>;
}) {
  const isValorant = gameId === 'valorant'; const [saving, setSaving] = useState(false); const pending = registrations.filter((item) => item.status === 'pending')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); const form = new FormData(event.currentTarget)
    try {
      if (isValorant) {
        const captain = String(form.get('captain'))
        const roster: RosterInput[] = [{ displayName: captain, role: 'captain' }]
        for (let i = 2; i <= 5; i += 1) roster.push({ displayName: String(form.get(`player${i}`)), role: 'player' })
        const substitute = String(form.get('substitute') ?? '').trim(); if (substitute) roster.push({ displayName: substitute, role: 'substitute' })
        await onCreate({ name: String(form.get('name')), countryCode: String(form.get('country') || '') || undefined, captain, roster })
      } else await onCreate({ name: String(form.get('name')), flag: String(form.get('country') || '') || undefined })
      event.currentTarget.reset()
    } finally { setSaving(false) }
  }
  return <div className="space-y-8">
    {pending.length > 0 && <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6"><div className="flex items-center gap-3"><Clock3 className="size-5 text-primary" /><div><h2 className="font-display text-xl font-bold uppercase">Pending registrations</h2><p className="text-xs text-muted-foreground">Review applications before they enter fixtures.</p></div></div><div className="mt-5 grid gap-3">{pending.map((item) => <div key={item._id} className="rounded-xl border border-border bg-card p-4 sm:flex sm:items-center"><div className="min-w-0 flex-1"><p className="font-semibold">{item.applicantName}</p><p className="text-xs text-muted-foreground">{item.applicantEmail}{item.phoneNumber ? ` · ${item.phoneNumber}` : ''}{item.captainName ? ` · Captain ${item.captainName}` : ''}</p>{item.roster.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Roster: {item.roster.map((member) => member.displayName).join(', ')}</p>}</div><div className="mt-3 flex gap-2 sm:mt-0"><Button size="sm" variant="outline" onClick={() => onReview(item._id, 'rejected')}><X className="size-3.5" />Reject</Button><Button size="sm" onClick={() => onReview(item._id, 'approved')}><Check className="size-3.5" />Approve</Button></div></div>)}</div></section>}
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]"><form onSubmit={submit} className="h-fit rounded-2xl border border-border bg-card p-6"><div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">{isValorant ? <Shield className="size-5 text-primary" /> : <UserRound className="size-5 text-primary" />}</div><h2 className="mt-5 font-display text-2xl font-bold uppercase">Add {isValorant ? 'team' : 'player'}</h2><p className="mt-1 text-sm text-muted-foreground">{isValorant ? 'A valid team needs one captain and four starting players.' : 'Add an individual eFootball competitor.'}</p><div className="mt-6 space-y-4"><Field label={isValorant ? 'Team name' : 'Player name'}><Input name="name" required /></Field><Field label="Country"><Input name="country" placeholder={isValorant ? 'IN' : '🇮🇳 India'} /></Field>{isValorant && <><Field label="Captain"><Input name="captain" required /></Field>{[2, 3, 4, 5].map((number) => <Field key={number} label={`Starting player ${number}`}><Input name={`player${number}`} required /></Field>)}<Field label="Substitute (optional)"><Input name="substitute" /></Field></>}</div><Button className="mt-6 w-full" disabled={saving}><Plus className="size-4" />{saving ? 'Adding…' : `Add ${isValorant ? 'team' : 'player'}`}</Button></form>
      <section className="rounded-2xl border border-border bg-card p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-2xl font-bold uppercase">Approved {isValorant ? 'teams' : 'players'}</h2><p className="text-sm text-muted-foreground">{competitors.length} ready for competition</p></div><Users className="size-5 text-primary" /></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{competitors.map((competitor) => <div key={competitor._id} className="group rounded-xl border border-border bg-background p-4"><div className="flex items-start gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-display font-bold text-primary">{competitor.name.slice(0, 2).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{competitor.name}</p><p className="text-xs text-muted-foreground">{competitor.countryCode ?? competitor.flag ?? 'Global'}{competitor.captain ? ` · Captain ${competitor.captain}` : ''}</p></div><button type="button" onClick={() => onRemove(competitor._id)} className="text-muted-foreground opacity-0 transition hover:text-red-400 group-hover:opacity-100"><Trash2 className="size-4" /></button></div>{competitor.roster && competitor.roster.length > 0 && <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{competitor.roster.map((member) => <span key={member._id} className="mr-2 inline-block">{member.displayName} <span className="text-white/30">({member.role})</span></span>)}</div>}</div>)}{competitors.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-border py-14 text-center text-sm text-muted-foreground">No approved competitors yet.</div>}</div></section></div>
  </div>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div> }
