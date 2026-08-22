"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import {
  Download,
  Mail,
  MessageCircle,
  Search,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTournamentEditCode } from "@/lib/tournament-admin";
import type { SheetData } from "write-excel-file/browser";

type Registration = {
  _id: Id<"registrations">;
  applicantName: string;
  applicantEmail: string;
  phoneNumber?: string;
  efootballId?: string;
  konamiId?: string;
  valorantId?: string;
  playerRating?: number;
  countryCode?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  roster: Array<{ _id: string; displayName: string; role: string }>;
};

function whatsAppHref(phoneNumber?: string) {
  const digits = phoneNumber?.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export default function RegistrationsPage() {
  const params = useParams<{ id: string }>();
  const tournamentId = params.id as Id<"tournaments">;
  const registrations = useQuery(api.arena.listRegistrations, {
    tournamentId,
    adminCode: getTournamentEditCode(tournamentId),
  }) as Registration[] | undefined;
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return registrations ?? [];
    return (registrations ?? []).filter((registration) =>
      [
        registration.applicantName,
        registration.applicantEmail,
        registration.phoneNumber,
        registration.konamiId ?? registration.efootballId,
        registration.valorantId,
        registration.countryCode,
      ].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [registrations, search]);

  const downloadContacts = async () => {
    if (!registrations?.length) return;
    setExporting(true);
    setExportError("");
    try {
      const { default: writeXlsxFile } = await import("write-excel-file/browser");
      const headers = ["Name", "Email", "WhatsApp", "Country", "Konami ID", "VALORANT ID", "eFootball rating", "Status", "Registered at", "Roster"];
      const headerCells = headers.map((value) => ({
        value,
        type: String,
        fontWeight: "bold" as const,
        textColor: "#FFFFFF",
        backgroundColor: "#EF233C",
        align: "center" as const,
        alignVertical: "center" as const,
        borderColor: "#C9182E",
        borderStyle: "thin" as const,
        wrap: true,
      }));
      const sheetData: SheetData = [
        headerCells,
        ...registrations.map((registration, index) => {
          const cellStyle = {
            backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F4F5F7",
            borderColor: "#D9DCE1",
            borderStyle: "thin" as const,
            alignVertical: "center" as const,
            wrap: true,
          };
          return [
            { value: registration.applicantName, type: String, ...cellStyle },
            { value: registration.applicantEmail, type: String, ...cellStyle },
            { value: registration.phoneNumber ?? "", type: String, ...cellStyle },
            { value: registration.countryCode ?? "", type: String, align: "center" as const, ...cellStyle },
            { value: registration.konamiId ?? registration.efootballId ?? "", type: String, ...cellStyle },
            { value: registration.valorantId ?? "", type: String, ...cellStyle },
            { value: registration.playerRating, type: Number, format: "#,##0", align: "right" as const, ...cellStyle },
            { value: registration.status, type: String, align: "center" as const, ...cellStyle },
            { value: new Date(registration.createdAt), type: Date, format: "yyyy-mm-dd hh:mm", ...cellStyle },
            { value: registration.roster.map((member) => `${member.displayName} (${member.role})`).join("; "), type: String, ...cellStyle },
          ];
        }),
      ];
      await writeXlsxFile(sheetData, {
        sheet: "Registrations",
        columns: [
          { width: 24 },
          { width: 30 },
          { width: 20 },
          { width: 12 },
          { width: 22 },
          { width: 24 },
          { width: 18 },
          { width: 14 },
          { width: 21 },
          { width: 48 },
        ],
        stickyRowsCount: 1,
        stickyColumnsCount: 1,
        orientation: "landscape",
        showGridLines: false,
      }).toFile(`tournament-${tournamentId}-registrations.xlsx`);
    } catch (cause) {
      setExportError(cause instanceof Error ? cause.message : "Could not create the Excel workbook.");
    } finally {
      setExporting(false);
    }
  };

  if (registrations === undefined) {
    return <div className="h-96 animate-pulse rounded-2xl bg-card" />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-primary"><ShieldCheck className="size-4" />Organizer-only contacts</p>
            <h1 className="mt-3 font-display text-3xl font-bold uppercase sm:text-4xl">Tournament registrations</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Review private contact details, open a WhatsApp chat, or download the complete registration list for tournament operations.</p>
          </div>
          <Button onClick={() => void downloadContacts()} disabled={!registrations.length || exporting} size="lg" className="w-full sm:w-auto"><Download />{exporting ? "Creating Excel…" : "Download contacts Excel"}</Button>
        </div>
        {exportError && <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">{exportError}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Registrations" value={registrations.length} />
          <Metric label="WhatsApp ready" value={registrations.filter((registration) => registration.phoneNumber).length} />
          <Metric label="Showing" value={filtered.length} className="col-span-2 sm:col-span-1" />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, WhatsApp, or Konami ID" className="pl-10" />
        </div>

        <div className="mt-5 grid gap-3 md:hidden">
          {filtered.map((registration) => <RegistrationCard key={registration._id} registration={registration} />)}
        </div>

        <div className="mt-5 hidden overflow-hidden rounded-xl border border-border md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-background/60">
                <TableHead>Player</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>eFootball profile</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((registration) => {
                const whatsApp = whatsAppHref(registration.phoneNumber);
                return (
                  <TableRow key={registration._id}>
                    <TableCell><p className="font-semibold text-white">{registration.applicantName}</p><a href={`mailto:${registration.applicantEmail}`} className="mt-1 block text-xs text-muted-foreground hover:text-white">{registration.applicantEmail}</a></TableCell>
                    <TableCell className="font-mono text-sm">{registration.phoneNumber ?? "Legacy entry"}</TableCell>
                    <TableCell><p>{registration.konamiId ?? registration.efootballId ?? registration.valorantId ?? "—"}</p><p className="mt-1 text-xs text-muted-foreground">{registration.playerRating === undefined ? (registration.valorantId ? "VALORANT ID" : "No rating") : `Rating ${registration.playerRating}`}</p></TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{registration.status}</Badge><p className="mt-1 text-xs text-muted-foreground">{new Date(registration.createdAt).toLocaleDateString()}</p></TableCell>
                    <TableCell className="text-right">{whatsApp && <Button size="sm" variant="outline" render={<a href={whatsApp} target="_blank" rel="noreferrer" />}><MessageCircle />WhatsApp</Button>}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {!filtered.length && <div className="py-16 text-center"><UserRound className="mx-auto size-9 text-muted-foreground" /><p className="mt-4 font-semibold">No registrations found</p><p className="mt-2 text-sm text-muted-foreground">New public registrations will appear here automatically.</p></div>}
      </section>
    </div>
  );
}

function Metric({ label, value, className = "" }: { label: string; value: number; className?: string }) {
  return <div className={`rounded-xl border border-border bg-background/50 p-4 ${className}`}><p className="font-display text-3xl font-bold">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p></div>;
}

function RegistrationCard({ registration }: { registration: Registration }) {
  const whatsApp = whatsAppHref(registration.phoneNumber);
  return (
    <article className="rounded-xl border border-border bg-background/50 p-4">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-white">{registration.applicantName}</p><p className="mt-1 text-xs text-muted-foreground">{registration.countryCode ?? "Country unavailable"}</p></div><Badge variant="outline" className="capitalize">{registration.status}</Badge></div>
      <div className="mt-4 space-y-2 text-sm"><a href={`mailto:${registration.applicantEmail}`} className="flex items-center gap-2 break-all text-muted-foreground hover:text-white"><Mail className="size-4 shrink-0" />{registration.applicantEmail}</a><p className="flex items-center gap-2 font-mono"><Smartphone className="size-4 shrink-0 text-primary" />{registration.phoneNumber ?? "Legacy entry without WhatsApp"}</p>{(registration.konamiId ?? registration.efootballId) && <p className="text-muted-foreground">Konami ID: <span className="text-white">{registration.konamiId ?? registration.efootballId}</span>{registration.playerRating !== undefined && ` · Rating ${registration.playerRating}`}</p>}{registration.valorantId && <p className="text-muted-foreground">VALORANT ID: <span className="text-white">{registration.valorantId}</span></p>}</div>
      {whatsApp && <Button variant="outline" className="mt-4 w-full" render={<a href={whatsApp} target="_blank" rel="noreferrer" />}><MessageCircle />Open WhatsApp</Button>}
    </article>
  );
}
