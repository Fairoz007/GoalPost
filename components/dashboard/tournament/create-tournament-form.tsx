"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { ArrowLeft, ArrowRight, Check, Crosshair, Gamepad2, Info } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { gameModules, valorantMatchModes, type GameId, type ValorantMatchMode } from "@/lib/game-modules";

type TournamentFormat = "Knockout" | "League" | "Groups" | "Single Group + Finals" | "Round Robin" | "Single Elimination" | "Double Elimination" | "Groups + Knockout";
type FormState = {
  name: string; slug: string; description: string; organizer: string; format: TournamentFormat;
  matchMode: ValorantMatchMode; maxSlots: number; bestOf: number; prizePool: string;
  registrationGroupUrl: string; registrationInstructions: string; rules: string;
  startDate: string; endDate: string; adminCode: string;
};

const steps = ["Info", "Competition", "Participants", "Rules", "Schedule"];
const modeEntries = Object.entries(valorantMatchModes) as Array<[ValorantMatchMode, (typeof valorantMatchModes)[ValorantMatchMode]]>;

function makeInitial(gameId: GameId): FormState {
  return {
    name: "", slug: "", description: "", organizer: "D1 Arena",
    format: (gameId === "valorant" ? "Single Elimination" : "Groups + Knockout"),
    matchMode: "scrimmage", maxSlots: gameId === "valorant" ? 8 : 16,
    bestOf: gameId === "valorant" ? 3 : 1, prizePool: "", registrationGroupUrl: "",
    registrationInstructions: "", rules: gameId === "valorant" ? valorantMatchModes.scrimmage.rules : "",
    startDate: "", endDate: "", adminCode: "",
  };
}

export function CreateTournamentForm({ gameId }: { gameId: GameId }) {
  const game = gameModules[gameId];
  const isValorant = gameId === "valorant";
  const GameIcon = isValorant ? Crosshair : Gamepad2;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => makeInitial(gameId));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const create = useMutation(api.tournaments.create);
  const router = useRouter();
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((state) => ({ ...state, [key]: value }));

  const selectMode = (mode: ValorantMatchMode) => {
    setForm((state) => {
      const previousDefault = valorantMatchModes[state.matchMode].rules;
      return {
        ...state,
        matchMode: mode,
        bestOf: mode === "escalation" || mode === "deathmatch" ? 1 : state.bestOf,
        rules: !state.rules.trim() || state.rules === previousDefault ? valorantMatchModes[mode].rules : state.rules,
      };
    });
  };

  const finish = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const slug = (form.slug || form.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const id = await create({
        name: form.name, slug, description: form.description || undefined, organizer: form.organizer,
        gameId, matchMode: isValorant ? form.matchMode : undefined, format: form.format,
        maxSlots: form.maxSlots, teamSize: game.teamSize, bestOf: form.bestOf,
        prizePool: form.prizePool || undefined, registrationGroupUrl: form.registrationGroupUrl || undefined,
        registrationInstructions: form.registrationInstructions || undefined, rules: form.rules || undefined,
        startDate: new Date(form.startDate).toISOString(), endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        status: "Draft", currentStage: "Registration", adminCode: form.adminCode || undefined,
      });
      router.push(`/dashboard/tournaments/${id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create tournament.");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-10">
      <div className="flex flex-col justify-between gap-5 border-b border-border pb-8 sm:flex-row sm:items-end">
        <div>
          <Link href="/dashboard/tournaments/create" className="text-xs font-semibold text-muted-foreground hover:text-primary">← Switch game</Link>
          <p className="mt-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-primary"><GameIcon className="size-4" />D1 Arena · {game.name}</p>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase">Create {game.name} tournament</h1>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{step + 1}/{steps.length}</span>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {steps.map((item, index) => (
          <button key={item} type="button" onClick={() => index < step && setStep(index)} className={cn("flex min-w-32 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold", index === step ? "border-primary bg-primary/10 text-white" : index < step ? "border-primary/30 text-primary" : "border-border text-muted-foreground")}>
            <span className="flex size-5 items-center justify-center rounded-full border border-current">{index < step ? <Check className="size-3" /> : index + 1}</span>{item}
          </button>
        ))}
      </div>

      <form onSubmit={finish} className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="min-h-[410px]">
          {step === 0 && <Panel title="Tournament identity" copy={`Set up the public identity for this ${game.name} event.`}>
            <Field label="Tournament name"><Input value={form.name} onChange={(event) => { const name = event.target.value; update("name", name); if (!form.slug) update("slug", name.toLowerCase().replace(/[^a-z0-9]+/g, "-")); }} required /></Field>
            <div className="grid gap-5 sm:grid-cols-2"><Field label="Public URL"><Input value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder="summer-showdown" /></Field><Field label="Organizer"><Input value={form.organizer} onChange={(event) => update("organizer", event.target.value)} required /></Field></div>
            <Field label="Description"><Textarea value={form.description} onChange={(event) => update("description", event.target.value)} rows={4} /></Field>
          </Panel>}

          {step === 1 && <Panel title="Competition setup" copy={isValorant ? "Choose the match mode first, then the tournament structure." : "Choose how players progress through the tournament."}>
            {isValorant && <div><Label>Valorant match mode</Label><div className="mt-3 grid gap-3 sm:grid-cols-2">{modeEntries.map(([id, mode]) => <button type="button" key={id} onClick={() => selectMode(id)} className={cn("rounded-xl border p-4 text-left transition", form.matchMode === id ? "border-primary bg-primary/5" : "border-border hover:border-white/20")}><p className="font-semibold text-white">{mode.name}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{mode.summary}</p></button>)}</div></div>}
            <div><Label>Tournament format</Label><div className="mt-3 grid gap-3 sm:grid-cols-2">{game.formats.map((format) => <button type="button" key={format} onClick={() => update("format", format as TournamentFormat)} className={cn("rounded-xl border p-4 text-left font-semibold", form.format === format ? "border-primary bg-primary/5 text-white" : "border-border text-muted-foreground")}>{format}</button>)}</div></div>
            {isValorant && <Field label="Series length"><div className="flex gap-2">{[1, 3, 5].map((value) => <button type="button" key={value} disabled={form.matchMode === "escalation" || form.matchMode === "deathmatch"} onClick={() => update("bestOf", value)} className={cn("rounded-lg border px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40", form.bestOf === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>Best of {value}</button>)}</div></Field>}
          </Panel>}

          {step === 2 && <Panel title="Participant settings" copy={`Each registration represents one ${game.competitorLabel.toLowerCase()}${game.teamSize > 1 ? ` with ${game.teamSize} starters` : ""}.`}>
            <div className="grid gap-5 sm:grid-cols-2"><Field label="Maximum slots"><Input type="number" min={2} max={128} value={form.maxSlots} onChange={(event) => update("maxSlots", Number(event.target.value))} /></Field><Field label="Prize pool (optional)"><Input value={form.prizePool} onChange={(event) => update("prizePool", event.target.value)} placeholder="OMR 250 or Trophy" /></Field></div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5"><p className="font-semibold text-white">{game.competitorLabel} registration</p><p className="mt-1 text-sm text-muted-foreground">Applications remain pending until a D1 Arena organizer approves them for fixtures.</p></div>
          </Panel>}

          {step === 3 && <Panel title="Rules and registration" copy={isValorant ? "The selected match mode supplies its own rules. You can add event-specific details below." : "Define match conduct, eligibility, and result reporting."}>
            {isValorant && <div className="rounded-xl border border-primary/20 bg-primary/5 p-5"><p className="text-xs font-bold uppercase tracking-wider text-primary">{valorantMatchModes[form.matchMode].name} rules</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{valorantMatchModes[form.matchMode].rules}</p></div>}
            <Field label="Registration group/contact URL (optional)"><Input type="url" value={form.registrationGroupUrl} onChange={(event) => update("registrationGroupUrl", event.target.value)} placeholder="https://chat.whatsapp.com/…" /></Field>
            <Field label="Registration instructions (optional)"><Textarea value={form.registrationInstructions} onChange={(event) => update("registrationInstructions", event.target.value)} rows={3} /></Field>
            <Field label="Tournament rules"><Textarea value={form.rules} onChange={(event) => update("rules", event.target.value)} rows={7} placeholder="Eligibility, check-in, map veto, reporting, disputes…" /></Field>
            <Field label="Organizer passcode (optional)"><Input value={form.adminCode} onChange={(event) => update("adminCode", event.target.value.toUpperCase())} placeholder="ARENA24" /></Field>
          </Panel>}

          {step === 4 && <Panel title="Schedule" copy="Set the event window. Fixtures can be generated after participants are approved.">
            <div className="grid gap-5 sm:grid-cols-2"><Field label="Starts"><Input type="datetime-local" value={form.startDate} onChange={(event) => update("startDate", event.target.value)} required /></Field><Field label="Ends"><Input type="datetime-local" value={form.endDate} onChange={(event) => update("endDate", event.target.value)} /></Field></div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5"><p className="flex items-center gap-2 font-semibold"><Info className="size-4 text-primary" />Ready to create {form.name || "your tournament"}?</p><p className="mt-1 text-sm text-muted-foreground">It will be saved as a draft in D1 Arena.{isValorant ? ` Every generated fixture will use ${valorantMatchModes[form.matchMode].name} rules.` : ""}</p></div>
          </Panel>}
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        <div className="mt-8 flex justify-between border-t border-border pt-6">
          <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft className="size-4" />Back</Button>
          {step < steps.length - 1 ? <Button type="button" onClick={() => setStep((value) => value + 1)} disabled={step === 0 && !form.name}>Continue<ArrowRight className="size-4" /></Button> : <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create tournament"}<Check className="size-4" /></Button>}
        </div>
      </form>
    </div>
  );
}

function Panel({ title, copy, children }: { title: string; copy: string; children: React.ReactNode }) {
  return <div><h2 className="font-display text-3xl font-bold uppercase">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{copy}</p><div className="mt-7 space-y-5">{children}</div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
