"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, Save, Settings, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { gameModules, valorantMatchModes, type ValorantMatchMode } from "@/lib/game-modules";
import { getTournamentEditCode } from "@/lib/tournament-admin";

type TournamentStatus = "Draft" | "Upcoming" | "Registration Open" | "Ongoing" | "Completed" | "Cancelled";

function toLocalDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function SettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tournamentId = params.id as Id<"tournaments">;
  const tournament = useQuery(api.tournaments.getById, { id: tournamentId });
  const matches = useQuery(api.matches.getByTournament, { tournamentId });
  const updateTournament = useMutation(api.tournaments.update);
  const removeTournament = useMutation(api.tournaments.remove);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [status, setStatus] = useState<TournamentStatus>("Upcoming");
  const [format, setFormat] = useState("");
  const [matchMode, setMatchMode] = useState<ValorantMatchMode>("scrimmage");
  const [bestOf, setBestOf] = useState(1);
  const [maxSlots, setMaxSlots] = useState(16);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [registrationClosesAt, setRegistrationClosesAt] = useState("");
  const [prizePool, setPrizePool] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [rules, setRules] = useState("");
  const [registrationGroupUrl, setRegistrationGroupUrl] = useState("");
  const [registrationInstructions, setRegistrationInstructions] = useState("");
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tournament) return;
    setName(tournament.name);
    setSlug(tournament.slug ?? "");
    setDescription(tournament.description ?? "");
    setOrganizer(tournament.organizer ?? "");
    setStatus(tournament.status as TournamentStatus);
    setFormat(tournament.format);
    setMatchMode((tournament.matchMode ?? "scrimmage") as ValorantMatchMode);
    setBestOf(tournament.bestOf ?? (tournament.gameId === "valorant" ? 3 : 1));
    setMaxSlots(tournament.maxSlots ?? (tournament.gameId === "valorant" ? 8 : 16));
    setStartDate(toLocalDateTime(tournament.startDate));
    setEndDate(toLocalDateTime(tournament.endDate));
    setRegistrationClosesAt(toLocalDateTime(tournament.registrationClosesAt));
    setPrizePool(tournament.prizePool ?? "");
    setBannerUrl(tournament.bannerUrl ?? "");
    setRules(tournament.rules ?? "");
    setRegistrationGroupUrl(tournament.registrationGroupUrl ?? "");
    setRegistrationInstructions(tournament.registrationInstructions ?? "");
    setRegistrationEnabled(tournament.registrationEnabled !== false);
    setFeatured(tournament.featured === true);
  }, [tournament]);

  if (tournament === undefined || matches === undefined) return <div className="h-96 animate-pulse rounded-2xl bg-card" />;
  if (!tournament) return <div className="p-10 text-center text-muted-foreground">Tournament not found.</div>;

  const gameId = tournament.gameId === "valorant" ? "valorant" : "efootball";
  const game = gameModules[gameId];
  const structureLocked = matches.length > 0;

  const changeMatchMode = (mode: ValorantMatchMode) => {
    const oldDefault = valorantMatchModes[matchMode].rules;
    setMatchMode(mode);
    if (!rules.trim() || rules === oldDefault) setRules(valorantMatchModes[mode].rules);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      await updateTournament({
        id: tournamentId,
        adminCode: getTournamentEditCode(tournamentId),
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        description,
        organizer,
        status,
        format: format as any,
        matchMode: gameId === "valorant" ? matchMode : undefined,
        bestOf,
        maxSlots,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : "",
        registrationClosesAt: registrationClosesAt ? new Date(registrationClosesAt).toISOString() : "",
        prizePool,
        bannerUrl,
        rules,
        registrationGroupUrl,
        registrationInstructions,
        registrationEnabled,
        featured,
      });
      setMessage("Tournament settings saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save tournament settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this tournament? This cannot be undone.")) return;
    await removeTournament({ id: tournamentId, adminCode: getTournamentEditCode(tournamentId) });
    router.push("/dashboard/tournaments");
  };

  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-8">
    <form onSubmit={handleSave} className="space-y-8">
      <SettingsSection title="General" description={`Edit the public identity and lifecycle of this ${game.name} tournament.`}>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Tournament name"><Input value={name} onChange={(event) => setName(event.target.value)} required /></Field><Field label="Public URL"><Input value={slug} onChange={(event) => setSlug(event.target.value)} required /></Field></div>
        <Field label="Description"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} /></Field>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Organizer"><Input value={organizer} onChange={(event) => setOrganizer(event.target.value)} /></Field><Field label="Status"><Select value={status} onValueChange={(value) => value && setStatus(value as TournamentStatus)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{["Draft", "Upcoming", "Registration Open", "Ongoing", "Completed", "Cancelled"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field></div>
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Banner image URL"><Input type="url" value={bannerUrl} onChange={(event) => setBannerUrl(event.target.value)} /></Field><Field label="Prize pool"><Input value={prizePool} onChange={(event) => setPrizePool(event.target.value)} placeholder="OMR 250 or Trophy" /></Field></div>
        <Toggle label="Featured tournament" description="Highlight this tournament on public discovery pages." checked={featured} onCheckedChange={setFeatured} />
      </SettingsSection>

      <SettingsSection title="Competition format" description={`Choose how ${game.competitorLabel.toLowerCase()}s progress through the ${game.name} event.`}>
        {structureLocked && <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><p>Format and match mode are locked because fixtures already exist. Other settings can still be edited.</p></div>}
        <Field label="Tournament format"><Select value={format} disabled={structureLocked} onValueChange={(value) => value && setFormat(value)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{game.formats.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field>
        {gameId === "valorant" && <Field label="VALORANT match mode"><Select value={matchMode} disabled={structureLocked} onValueChange={(value) => value && changeMatchMode(value as ValorantMatchMode)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(valorantMatchModes).map(([id, mode]) => <SelectItem key={id} value={id}>{mode.name}</SelectItem>)}</SelectContent></Select></Field>}
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Maximum slots"><Input type="number" min={2} max={128} value={maxSlots} onChange={(event) => setMaxSlots(Number(event.target.value))} /></Field><Field label="Series length"><Select value={String(bestOf)} onValueChange={(value) => value && setBestOf(Number(value))}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{[1, 3, 5].map((value) => <SelectItem key={value} value={String(value)}>Best of {value}</SelectItem>)}</SelectContent></Select></Field></div>
        <Field label="Tournament rules"><Textarea value={rules} onChange={(event) => setRules(event.target.value)} rows={8} /></Field>
      </SettingsSection>

      <SettingsSection title="Schedule" description="Update the tournament and registration window.">
        <div className="grid gap-5 sm:grid-cols-2"><Field label="Starts"><Input type="datetime-local" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></Field><Field label="Ends"><Input type="datetime-local" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></Field></div>
        <Field label="Registration closes"><Input type="datetime-local" value={registrationClosesAt} onChange={(event) => setRegistrationClosesAt(event.target.value)} /></Field>
      </SettingsSection>

      <SettingsSection title="Registration" description="Control availability and participant instructions.">
        <Toggle label="Registration available" description="Turn this off to stop new public registrations." checked={registrationEnabled} onCheckedChange={setRegistrationEnabled} />
        <Field label="WhatsApp Group URL"><Input type="url" value={registrationGroupUrl} onChange={(event) => setRegistrationGroupUrl(event.target.value)} placeholder="https://chat.whatsapp.com/DcM0VixkixZ5QBYIXS6TW6?s=cl&p=a&mlu" /></Field>
        <Field label="Registration instructions"><Textarea value={registrationInstructions} onChange={(event) => setRegistrationInstructions(event.target.value)} rows={4} /></Field>
      </SettingsSection>

      {error && <p className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">{error}</p>}
      {message && <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-primary">{message}</p>}
      <div className="sticky bottom-4 flex justify-end"><Button type="submit" size="lg" disabled={saving}><Save className="size-4" />{saving ? "Saving…" : "Save all settings"}</Button></div>
    </form>

    <div className="rounded-2xl border border-danger/30 bg-danger/5 p-8"><h3 className="font-display text-xl font-bold text-danger">Danger Zone</h3><p className="mt-2 text-sm text-muted-foreground">Deleting a tournament cannot be undone.</p><Button variant="destructive" onClick={handleDelete} className="mt-6"><Trash2 className="size-4" />Delete Tournament</Button></div>
  </motion.div>;
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-border bg-card p-6 sm:p-8"><div className="mb-7 flex items-start gap-3 border-b border-border/50 pb-5"><div className="rounded-lg bg-primary/10 p-2"><Settings className="size-5 text-primary" /></div><div><h2 className="font-display text-2xl font-bold uppercase text-white">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></div><div className="space-y-5">{children}</div></section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function Toggle({ label, description, checked, onCheckedChange }: { label: string; description: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between rounded-xl border border-border p-4"><div><p className="font-medium text-white">{label}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}
