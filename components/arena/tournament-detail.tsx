"use client";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useConvex, useConvexAuth, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Radio,
  MessagesSquare,
  Shield,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { getGameModule } from "@/lib/game-modules";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { ObsOverlayPanel } from "@/components/arena/obs-overlay-panel";
import { formatEventDate } from "@/lib/date-time";

const tabs = [
  "Overview",
  "Registration",
  "Participants",
  "Fixtures",
  "Standings",
  "Bracket",
  "Statistics",
  "Broadcast",
  "Rules",
] as const;
const VALORANT_DISCORD_URL = "https://discord.gg/6NuSvEgbBG";

function getRegistrationGroupUrl(url?: string | null) {
  const trimmed = url?.trim() ?? "";
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" && parsed.hostname === "chat.whatsapp.com" ? parsed.toString() : undefined;
  } catch { return undefined; }
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function countryName(countryCode: string) {
  return COUNTRY_OPTIONS.find((country) => country.code === countryCode)?.name ?? "";
}

type ValorantRosterInput = {
  displayName: string;
  valorantId: string;
  role: "captain" | "player" | "substitute";
};

function valorantRosterFromForm(form: FormData): ValorantRosterInput[] {
  const starters = [1, 2, 3, 4, 5].map((number) => ({
    displayName: String(form.get(`valorantName${number}`) || "").trim(),
    valorantId: String(form.get(`valorantId${number}`) || "").trim(),
    role: number === 1 ? "captain" as const : "player" as const,
  }));
  const substitutes = [6, 7].map((number) => ({
    displayName: String(form.get(`valorantName${number}`) || "").trim(),
    valorantId: String(form.get(`valorantId${number}`) || "").trim(),
    role: "substitute" as const,
  }));
  const substituteValues = substitutes.flatMap((member) => [member.displayName, member.valorantId]);
  const hasAnySubstituteValue = substituteValues.some(Boolean);
  if (hasAnySubstituteValue && substituteValues.some((value) => !value)) {
    throw new Error("Add both substitute names and Riot IDs, or leave all substitute fields empty.");
  }
  return hasAnySubstituteValue ? [...starters, ...substitutes] : starters;
}

export function TournamentDetail({
  id,
  slug,
}: {
  id?: Id<"tournaments">;
  slug?: string;
}) {
  const byId = useQuery(api.tournaments.getById, id ? { id } : "skip");
  const bySlug = useQuery(api.tournaments.getBySlug, slug ? { slug } : "skip");
  const tournament = id ? byId : bySlug;
  const tournamentId = tournament?._id as Id<"tournaments"> | undefined;
  const participants = useQuery(
    api.participants.getByTournament,
    tournamentId ? { tournamentId } : "skip",
  );
  const matches = useQuery(
    api.matches.getByTournament,
    tournamentId ? { tournamentId } : "skip",
  );
  const standings = useQuery(
    api.matches.getStandings,
    tournamentId ? { tournamentId } : "skip",
  );
  const statistics = useQuery(
    api.matches.getStatistics,
    tournamentId ? { tournamentId } : "skip",
  );
  const announcements = useQuery(
    api.arena.listAnnouncements,
    tournamentId ? { tournamentId } : "skip",
  );
  const { isAuthenticated } = useConvexAuth();
  const profile = useQuery(api.users.getProfile, isAuthenticated ? {} : "skip");
  const convex = useConvex();
  const register = useMutation(api.arena.register);
  const quickRegister = useMutation(api.arena.quickRegister);
  const withdrawRegistration = useMutation(api.arena.withdrawRegistration);
  const userRegistration = useQuery(
    api.arena.getRegistrationStatus,
    tournamentId && isAuthenticated ? { tournamentId } : "skip",
  );
  const isUserRegistered = Boolean(userRegistration?.registered);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");
  const registerParam = searchParams?.get("register") === "true";

  const [tab, setTab] = useState<(typeof tabs)[number]>(() => {
    if (tabParam && (tabs as readonly string[]).includes(tabParam)) {
      return tabParam as (typeof tabs)[number];
    }
    return registerParam ? "Registration" : "Overview";
  });
  const [registering, setRegistering] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quickRegistering, setQuickRegistering] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const [error, setError] = useState("");
  const [registerCountry, setRegisterCountry] = useState("");
  const [gameIdInput, setGameIdInput] = useState("");
  const [acceptedRules, setAcceptedRules] = useState(false);

  const byParticipant = useMemo(
    () => new Map((participants ?? []).map((p) => [p._id, p])),
    [participants],
  );
  const registrationAvailable = tournament
    ? tournament.registrationEnabled !== false &&
    !["Draft", "Completed", "Cancelled"].includes(tournament.status)
    : false;

  const handleQuickRegister = async () => {
    if (!tournamentId) return;
    if (!acceptedRules) { setError("Accept the tournament rules and privacy policy before registering."); return; }
    setError("");
    setQuickRegistering(true);
    try {
      const selectedGameId = tournament?.gameId ?? "efootball";
      await quickRegister({
        tournamentId,
        acceptedRules,
        efootballId: selectedGameId === "efootball" ? gameIdInput.trim() || undefined : undefined,
        valorantId: selectedGameId === "valorant" ? gameIdInput.trim() || undefined : undefined,
      });
      setSubmitted(true);
      setRegistering(true);
    } catch (cause) {
      if (cause instanceof ConvexError) {
        setError(typeof cause.data === "string" ? cause.data : "Registration failed.");
      } else {
        setError(cause instanceof Error ? cause.message : "Registration failed.");
      }
    } finally {
      setQuickRegistering(false);
    }
  };

  const currentPath =
    pathname || (slug ? `/tournament/${slug}` : id ? `/tournaments/${id}` : "/");
  const signInUrlHero = `/sign-in?redirect_url=${encodeURIComponent(`${currentPath}?register=true`)}`;
  const signInUrlRegistration = `/sign-in?redirect_url=${encodeURIComponent(`${currentPath}?tab=Registration&register=true`)}`;
  const game = getGameModule(tournament?.gameId);
  const selectTab = (nextTab: (typeof tabs)[number]) => {
    setTab(nextTab);
    const params = new URLSearchParams(searchParams?.toString());
    params.set("tab", nextTab);
    params.delete("register");
    router.replace(`${currentPath}?${params.toString()}`, { scroll: false });
  };
  const handleWithdraw = async () => {
    if (!tournamentId || !window.confirm("Withdraw this registration and remove your competitor entry?")) return;
    setWithdrawing(true); setError("");
    try { await withdrawRegistration({ tournamentId }); setSubmitted(false); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not withdraw registration."); }
    finally { setWithdrawing(false); }
  };

  useEffect(() => {
    if (tabParam && (tabs as readonly string[]).includes(tabParam)) {
      setTab(tabParam as (typeof tabs)[number]);
    }
  }, [tabParam]);

  useEffect(() => {
    if (registerParam && isAuthenticated && registrationAvailable && !isUserRegistered) {
      setRegistering(true);
    }
  }, [registerParam, isAuthenticated, registrationAvailable, isUserRegistered]);

  useEffect(() => {
    if (profile && tournament) {
      if (tournament.gameId === "valorant" && profile.valorantId) {
        setGameIdInput(profile.valorantId);
      } else if (profile.efootballId) {
        setGameIdInput(profile.efootballId);
      }
    }
  }, [profile, tournament]);

  if (tournament === undefined)
    return (
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="h-80 animate-pulse rounded-2xl bg-card" />
      </div>
    );
  if (tournament === null)
    return (
      <div className="mx-auto max-w-7xl px-4 py-32 text-center">
        <Trophy className="mx-auto size-10 text-muted-foreground" />
        <h1 className="mt-5 font-display text-4xl font-bold uppercase">
          Tournament not found
        </h1>
      </div>
    );

  const completed = (matches ?? []).filter(
    (match) => match.status === "Completed",
  );
  const live = (matches ?? []).filter((match) => match.status === "Live");
  const scheduled = (matches ?? []).filter(
    (match) => match.status === "Scheduled",
  );
  const submitRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tournamentId) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const whatsappWindow = game.id === "valorant" ? window.open("about:blank", "_blank") : null;
    if (whatsappWindow) whatsappWindow.opener = null;
    try {
      const roster = game.id === "valorant" ? valorantRosterFromForm(form) : undefined;
      const captainName = roster?.[0].displayName;
      const rawGameId = String(form.get("gameIdInput") || "").trim();
      await register({
        tournamentId,
        applicantName: String(form.get("name")),
        applicantEmail: String(form.get("email")),
        phoneNumber: String(form.get("phone")),
        konamiId:
          game.id === "efootball"
            ? String(form.get("konamiId"))
            : undefined,
        playerRating:
          game.id === "efootball"
            ? Number(form.get("playerRating"))
            : undefined,
        countryCode: String(form.get("country") || "") || undefined,
        efootballId: game.id === "efootball" ? rawGameId || undefined : undefined,
        valorantId: game.id === "valorant" ? roster?.[0].valorantId : undefined,
        acceptedRules: form.get("acceptedRules") === "on",
        captainName,
        roster,
      });
      setSubmitted(true);
      setRegisterCountry("");
      if (game.id === "valorant") {
        try {
          const confirmedTournament = await convex.query(api.tournaments.getById, { id: tournamentId });
          const whatsappUrl = getRegistrationGroupUrl(confirmedTournament?.registrationGroupUrl);
          if (whatsappUrl && whatsappWindow) whatsappWindow.location.replace(whatsappUrl);
          else if (whatsappUrl) window.open(whatsappUrl, "_blank", "noopener,noreferrer");
          else whatsappWindow?.close();
        } catch {
          whatsappWindow?.close();
        }
      }
    } catch (cause) {
      whatsappWindow?.close();
      if (cause instanceof ConvexError) {
        setError(typeof cause.data === "string" ? cause.data : "Registration failed.");
      } else {
        setError(cause instanceof Error ? cause.message : "Registration failed.");
      }
    }
  };
  return (
    <div className="pb-20">
      <section className="relative overflow-hidden border-b border-border">
        <div className="field-grid absolute inset-0 opacity-40" />
        {tournament.bannerUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 grayscale"
            style={{ backgroundImage: `url(${tournament.bannerUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6 sm:pt-28">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="uppercase tracking-wider">{game.name}</Badge>
            <span
              className={cn(
                "flex items-center gap-2 text-xs font-bold uppercase tracking-wider",
                tournament.status === "Ongoing"
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {tournament.status === "Ongoing" && (
                <span className="live-pulse size-1.5 rounded-full bg-primary" />
              )}
              {tournament.status}
            </span>
          </div>
          <h1 className="mt-6 max-w-5xl font-display text-5xl font-bold uppercase leading-[.92] sm:text-7xl">
            {tournament.name}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            {tournament.description ??
              `${game.name} competition hosted on D-One Arena.`}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
            <span className="flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              {tournament.organizer ?? "DoneStudio"}
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              {formatEventDate(tournament.startDate, tournament.timezone)} · {tournament.timezone ?? "Asia/Muscat"}
            </span>
            <span className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              {participants?.length ?? 0}
              {tournament.maxSlots ? ` / ${tournament.maxSlots}` : ""}{" "}
              {game.competitorLabel}s
            </span>
            {tournament.prizePool && (
              <span className="flex items-center gap-2">
                <Trophy className="size-4 text-primary" />
                {tournament.prizePool}
              </span>
            )}
          </div>
          {isUserRegistered ? (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-400 shadow-lg shadow-emerald-500/10">
                <Check className="size-4 text-emerald-400" />
                Already Registered ({userRegistration?.gamerTag || userRegistration?.name || "Confirmed"})
              </div>
              <a
                href={getRegistrationGroupUrl(tournament.registrationGroupUrl)}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold border-none shadow-md shadow-[#25D366]/20",
                )}
              >
                <WhatsAppIcon className="size-4" />
                Open WhatsApp Group
                <ArrowRight className="size-4" />
              </a>
              {game.id === "valorant" && <a
                href={VALORANT_DISCORD_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "gap-2 border-none bg-[#5865F2] font-bold text-white shadow-md shadow-[#5865F2]/20 hover:bg-[#4752C4]")}
              >
                <MessagesSquare className="size-4" />
                Open Discord
                <ArrowRight className="size-4" />
              </a>}
            </div>
          ) : registrationAvailable ? (
            isAuthenticated ? (
              <Button onClick={() => setRegistering(true)} size="lg" className="mt-8">
                Register free <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Link href={signInUrlHero} className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
                Sign in to register <ArrowRight className="size-4" />
              </Link>
            )
          ) : null}
        </div>
      </section>
      {tournament.youtubeVideoId && (
        <section className="border-b border-border bg-card/40">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-center lg:py-8">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-primary">
                <span className="live-pulse size-2 rounded-full bg-primary" />
                Tournament broadcast
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold uppercase sm:text-3xl">
                Watch the tournament live
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The organizer&apos;s main YouTube channel stays here throughout the tournament, including between individual fixtures.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl shadow-black/30">
              <iframe
                className="aspect-video w-full"
                src={`https://www.youtube-nocookie.com/embed/${tournament.youtubeVideoId}?autoplay=1&mute=1&playsinline=1&rel=0`}
                title={`${tournament.name} tournament stream`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}
      <div className="sticky top-[72px] z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" role="tablist" aria-label="Tournament sections">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => selectTab(item)}
              role="tab"
              aria-selected={tab === item}
              className={cn(
                "inline-flex items-center gap-1.5 shrink-0 border-b-2 px-4 py-4 text-sm font-semibold transition",
                tab === item
                  ? "border-primary text-white"
                  : "border-transparent text-muted-foreground hover:text-white",
              )}
            >
              {item}
              {item === "Registration" && isUserRegistered && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  <Check className="size-2.5" /> Registered
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {tab === "Overview" && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              {isUserRegistered && (
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5">
                  <div className="flex items-center gap-3.5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <Check className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Player Entry Confirmed
                      </p>
                      <p className="font-semibold text-white">
                        You are registered for this tournament. No further registration is required.
                      </p>
                    </div>
                  </div>
                  <a
                    href={getRegistrationGroupUrl(tournament.registrationGroupUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "shrink-0 gap-2 font-bold bg-[#25D366] hover:bg-[#20bd5a] text-black border-none shadow-sm",
                    )}
                  >
                    <WhatsAppIcon className="size-4" />
                    WhatsApp Group
                    <ArrowRight className="size-3.5" />
                  </a>
                </div>
              )}
              <SectionTitle
                eyebrow="Tournament progress"
                title={
                  tournament.currentStage ??
                  (tournament.status === "Completed"
                    ? "Champion crowned"
                    : "The road to glory")
                }
              />
              <div className="mt-7 grid gap-3 sm:grid-cols-4">
                {["Registration", "Groups", "Knockouts", "Champion"].map(
                  (stage, index) => {
                    const current =
                      tournament.status === "Completed"
                        ? 3
                        : tournament.status === "Ongoing"
                          ? 2
                          : tournament.status === "Registration Open"
                            ? 0
                            : 1;
                    return (
                      <div
                        key={stage}
                        className={cn(
                          "rounded-xl border p-4",
                          index <= current
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-card",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                            index < current
                              ? "bg-primary text-white"
                              : "border border-border text-muted-foreground",
                          )}
                        >
                          {index < current ? (
                            <Check className="size-3.5" />
                          ) : (
                            index + 1
                          )}
                        </span>
                        <p className="mt-5 font-display font-semibold uppercase">
                          {stage}
                        </p>
                      </div>
                    );
                  },
                )}
              </div>
              <h2 className="mt-12 font-display text-2xl font-bold uppercase">
                Next matches
              </h2>
              <div className="mt-4 grid gap-3">
                {scheduled.slice(0, 4).map((match) => (
                  <MatchRow
                    key={match._id}
                    match={match}
                    names={byParticipant}
                  />
                ))}
                {scheduled.length === 0 && (
                  <Empty text="No scheduled matches yet." />
                )}
              </div>
              <div className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6 transition hover:border-[#25D366]/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#25D366]">
                      Tournament Community
                    </p>
                    <h3 className="mt-1 font-display text-xl font-bold uppercase text-white">
                      Join WhatsApp Group
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Check in for matches, get live scheduling updates, and connect with tournament organizers and players.
                    </p>
                  </div>
                  <a
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "shrink-0 gap-2 font-semibold bg-[#25D366] hover:bg-[#20bd5a] text-black border-none shadow-md shadow-[#25D366]/20",
                    )}
                    href={getRegistrationGroupUrl(tournament.registrationGroupUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <WhatsAppIcon className="size-4" />
                    Join WhatsApp Group
                    <ArrowRight className="size-4" />
                  </a>
                </div>
              </div>
            </div>
            <aside>
              <h2 className="font-display text-xl font-bold uppercase">
                Announcements
              </h2>
              <div className="mt-4 space-y-3">
                {announcements?.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <p className="font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                ))}
                {announcements?.length === 0 && (
                  <Empty text="No announcements yet." />
                )}
              </div>
            </aside>
          </div>
        )}
        {tab === "Registration" && (
          <RegistrationSection
            tournament={tournament}
            game={game}
            available={registrationAvailable}
            isAuthenticated={isAuthenticated}
            isRegistered={isUserRegistered}
            userRegistration={userRegistration}
            signInUrl={signInUrlRegistration}
            profile={profile}
            onRegister={() => setRegistering(true)}
            onWithdraw={handleWithdraw}
            withdrawing={withdrawing}
            error={error}
          />
        )}
        {tab === "Participants" && (
          <div>
            <SectionTitle
              eyebrow={game.competitorLabel + " roster"}
              title={`${participants?.length ?? 0} competitors confirmed`}
            />
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {participants?.map((participant, index) => (
                <div
                  key={participant._id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 font-display text-lg font-bold text-primary">
                      {participant.logoUrl ? (
                        <img
                          src={participant.logoUrl}
                          alt=""
                          className="size-full rounded-lg object-cover"
                        />
                      ) : (
                        participant.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {participant.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {participant.countryCode ??
                          participant.flag ??
                          "Global"}{" "}
                        {participant.captain
                          ? `· Captain: ${participant.captain}`
                          : ""}
                      </p>
                    </div>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      #{participant.seed ?? index + 1}
                    </span>
                  </div>
                  {participant.roster?.length > 0 && (
                    <div className="mt-4 border-t border-border pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Starting roster
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {participant.roster.map((member: any) => (
                          <span
                            key={member._id}
                            className="rounded-md bg-muted px-2 py-1 text-xs"
                          >
                            {member.displayName}{member.valorantId ? ` · ${member.valorantId}` : ""} · {member.role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "Fixtures" && (
          <div>
            <SectionTitle
              eyebrow="Real-time match center"
              title={`${live.length} live · ${scheduled.length} upcoming · ${completed.length} complete`}
            />
            <div className="mt-7 grid gap-3">
              {(matches ?? []).map((match) => (
                <MatchRow key={match._id} match={match} names={byParticipant} />
              ))}
              {matches?.length === 0 && (
                <Empty text="Fixtures will appear after the organizer generates the schedule." />
              )}
            </div>
          </div>
        )}
        {tab === "Standings" && (
          <Standings game={game} data={standings?.rows ?? []} />
        )}
        {tab === "Bracket" && (
          <Bracket matches={matches ?? []} names={byParticipant} />
        )}
        {tab === "Statistics" && (
          <Statistics gameId={game.id} statistics={statistics} />
        )}
        {tab === "Broadcast" && tournamentId && (
          <ObsOverlayPanel
            tournamentId={tournamentId}
            gameId={game.id}
            matches={matches ?? []}
            participants={participants ?? []}
          />
        )}
        {tab === "Rules" && (
          <div className="max-w-3xl">
            <SectionTitle
              eyebrow="Competition rules"
              title="Play fair. Play to win."
            />
            <div className="mt-7 whitespace-pre-wrap rounded-xl border border-border bg-card p-6 text-sm leading-7 text-muted-foreground">
              {tournament.rules ??
                `All competitors must check in before their assigned match. Results are final after organizer approval. Disputes must include evidence and be submitted promptly. ${game.name} game-specific competitive rules apply.`}
            </div>
          </div>
        )}
      </div>
      {registering && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6">
            <button
              type="button"
              onClick={() => {
                setRegistering(false);
                setSubmitted(false);
              }}
              className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full bg-white/10 text-muted-foreground transition hover:bg-white/20 hover:text-white active:scale-95"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            {submitted || isUserRegistered ? (
              <div className="py-4 sm:py-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366]">
                  <Check className="size-7 text-[#25D366]" />
                </div>
                <h2 className="mt-4 font-display text-2xl font-bold uppercase sm:text-3xl">
                  {submitted ? "You're registered!" : "You are already registered"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {submitted
                    ? "Your place was confirmed automatically and added to the participant list."
                    : "Your player entry is already confirmed on the participant list."}
                </p>
                {submitted && game.id === "valorant" && <p className="mt-2 text-xs text-[#25D366]">WhatsApp opens automatically. Your Discord invitation is available below.</p>}
                <div className="mt-5 rounded-2xl border border-border bg-background/90 p-4 text-left text-sm text-muted-foreground">
                  <p className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
                    <span className="inline-block size-2.5 rounded-full bg-[#25D366] animate-pulse" />
                    Next Step: Join Tournament Communities
                  </p>
                  <ol className="mt-3 space-y-2.5 text-xs sm:text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#25D366]">1.</span>
                      <span><strong className="text-white">Join the WhatsApp group</strong> now for match check-in, fixtures, and announcements.</span>
                    </li>
                    {game.id === "valorant" && <li className="flex items-start gap-2">
                      <span className="font-bold text-[#5865F2]">2.</span>
                      <span><strong className="text-white">Join the Discord server</strong> for VALORANT team coordination and community updates.</span>
                    </li>}
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#25D366]">{game.id === "valorant" ? "3." : "2."}</span>
                      <span>Check in at least 15 minutes before your match.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#25D366]">{game.id === "valorant" ? "4." : "3."}</span>
                      <span>Play the published fixture and keep result screenshot.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-[#25D366]">{game.id === "valorant" ? "5." : "4."}</span>
                      <span>Report your score; qualified players advance automatically.</span>
                    </li>
                  </ol>
                  {tournament.format === "Single Group + Finals" && (
                    <p className="mt-3 border-t border-border/80 pt-3 text-xs">
                      Everyone plays in one group. Top four qualify for semifinals; winners play the final.
                    </p>
                  )}
                </div>
                <div className={cn("mt-5 grid gap-3", game.id === "valorant" && "sm:grid-cols-2")}>
                  <a
                    className={cn(buttonVariants({ size: "lg" }), "w-full gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-base shadow-lg shadow-[#25D366]/25 border-none h-12")}
                    href={getRegistrationGroupUrl(tournament.registrationGroupUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <WhatsAppIcon className="size-5 shrink-0" />
                    Open WhatsApp
                    <ArrowRight className="size-4 shrink-0" />
                  </a>
                  {game.id === "valorant" && <a
                    className={cn(buttonVariants({ size: "lg" }), "w-full gap-2.5 border-none bg-[#5865F2] font-bold text-base text-white shadow-lg shadow-[#5865F2]/25 hover:bg-[#4752C4] h-12")}
                    href={VALORANT_DISCORD_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessagesSquare className="size-5 shrink-0" />
                    Open Discord
                    <ArrowRight className="size-4 shrink-0" />
                  </a>}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2.5 w-full text-xs text-muted-foreground hover:text-white"
                  onClick={() => {
                    setRegistering(false);
                    setSubmitted(false);
                  }}
                >
                  Close & View Tournament
                </Button>
              </div>
            ) : profile?.profileCompleted && !showFullForm && game.id === "valorant" && game.teamSize === 1 ? (
              <div className="space-y-5">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  ⚡ 1-Click Fast Entry · Secured by Clerk
                </p>
                <h2 className="font-display text-3xl font-bold uppercase">
                  Ready to compete
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Your player profile is verified. Click below to register instantly without re-typing your details.
                </p>

                <div className="rounded-2xl border border-primary/40 bg-primary/10 p-5 text-left space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                      <Zap className="size-4" /> Verified Player Entry
                    </div>
                    <h3 className="mt-1 font-display text-2xl font-bold uppercase text-foreground">
                      {profile.gamerTag || profile.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {countryName(profile.countryCode || "")} · {profile.phone} · {profile.email}
                    </p>
                    {game.id === "valorant" && (
                      <p className="mt-1 text-xs font-medium text-primary">
                        Captain: {profile.captainName || profile.gamerTag || profile.name}
                      </p>
                    )}
                  </div>

                  {/* Optional Game ID configuration */}
                  <div className="rounded-xl border border-primary/20 bg-background/80 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                      <span className="flex items-center gap-1.5 text-primary">
                        🎯 VALORANT Riot ID &amp; Tag
                      </span>
                      <span className="text-[10px] text-muted-foreground">Optional</span>
                    </div>
                    <Input
                      value={gameIdInput}
                      onChange={(e) => setGameIdInput(e.target.value)}
                      placeholder="e.g. Player#EUW"
                      className="h-9 text-xs bg-card"
                    />
                    <p className="text-[10px] text-muted-foreground">Saves automatically to your profile for this and future events.</p>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-xs leading-5 text-muted-foreground"><input type="checkbox" checked={acceptedRules} onChange={(event) => setAcceptedRules(event.target.checked)} className="mt-1 size-4 accent-primary" /><span>I accept the <button type="button" onClick={() => selectTab("Rules")} className="underline text-foreground">tournament rules</button> and acknowledge the <Link href="/privacy" className="underline text-foreground">Privacy Policy</Link>.</span></label>
                {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

                <Button
                  size="lg"
                  className="w-full gap-2 bg-gradient-to-r from-red-600 to-rose-600 font-bold shadow-lg shadow-red-500/20"
                  onClick={handleQuickRegister}
                  disabled={quickRegistering || !acceptedRules}
                >
                  <Zap className="size-4" />
                  {quickRegistering ? "Confirming Registration..." : `⚡ 1-Click Register for ${game.name}`}
                </Button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowFullForm(true)}
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    Need custom roster or details for this event? Edit details
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      Free · Secured by Clerk
                    </p>
                    <h2 className="mt-1 font-display text-3xl font-bold uppercase">
                      Enter the arena
                    </h2>
                  </div>
                  {profile?.profileCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFullForm(false)}
                      className="text-xs"
                    >
                      <Zap className="size-3 text-primary mr-1" /> Use 1-Click
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Your contact details stay private to you and the tournament organizer. Public pages show only competition information.
                </p>
                <form onSubmit={submitRegistration} className="mt-6 space-y-4">
                  <Input
                    name="name"
                    defaultValue={profile?.gamerTag || profile?.name || ""}
                    placeholder={
                      game.id === "valorant" ? "Team name" : "Player name"
                    }
                    required
                  />
                  <Input
                    name="email"
                    type="email"
                    defaultValue={profile?.email || ""}
                    placeholder="Contact email"
                    autoComplete="email"
                    required
                  />
                  <Input
                    name="phone"
                    type="tel"
                    defaultValue={profile?.phone || ""}
                    placeholder="WhatsApp number with country code, e.g. +968 9123 4567"
                    autoComplete="tel"
                    required
                  />
                  <Select
                    name="country"
                    value={registerCountry || profile?.countryCode || ""}
                    onValueChange={(value) => setRegisterCountry((value ?? "").toUpperCase())}
                    required
                  >
                    <SelectTrigger>
                      <span
                        className={cn(
                          "truncate text-left",
                          registerCountry || profile?.countryCode
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {countryName(registerCountry || profile?.countryCode || "") || "Choose your country"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>{COUNTRY_OPTIONS.map((country) => <SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>)}</SelectContent>
                  </Select>

                  {game.id === "efootball" && <div>
                    <Input
                      name="gameIdInput"
                      defaultValue={profile?.efootballId || ""}
                      placeholder="eFootball ID / Konami Name (Optional)"
                    />
                  </div>}

                  {game.id === "efootball" && (
                    <div className="space-y-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Required eFootball verification
                      </p>
                      <div>
                        <label htmlFor="konamiId" className="text-xs font-semibold text-foreground">
                          Konami ID
                        </label>
                        <Input
                          id="konamiId"
                          name="konamiId"
                          defaultValue={profile?.efootballId || ""}
                          placeholder="Enter your genuine Konami ID"
                          minLength={3}
                          maxLength={40}
                          className="mt-1.5"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="playerRating" className="text-xs font-semibold text-foreground">
                          Current eFootball rating
                        </label>
                        <Input
                          id="playerRating"
                          name="playerRating"
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={5000}
                          step={1}
                          placeholder="For example, 1450"
                          className="mt-1.5"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {game.id === "valorant" && (
                    <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Five or seven-player roster
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">Add five starters. You may also add exactly two substitutes. Every player needs their in-game name and Riot ID.</p>
                      {[1, 2, 3, 4, 5].map((number) => (
                        <div key={number} className="grid gap-2 sm:grid-cols-2">
                          <Input name={`valorantName${number}`} defaultValue={number === 1 ? profile?.captainName || profile?.gamerTag || profile?.name || "" : ""} placeholder={number === 1 ? "Captain / player 1 name" : `Starting player ${number} name`} required />
                          <Input name={`valorantId${number}`} defaultValue={number === 1 ? profile?.valorantId || "" : ""} placeholder="Riot ID, e.g. Player#EUW" pattern="[^#]+#[^#]+" title="Use the Riot ID format GameName#Tag." maxLength={40} required />
                        </div>
                      ))}
                      <div className="border-t border-border pt-3">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Optional — add both substitutes for a seven-player roster</p>
                        <div className="space-y-2">
                          {[6, 7].map((number) => (
                            <div key={number} className="grid gap-2 sm:grid-cols-2">
                              <Input name={`valorantName${number}`} placeholder={`Substitute ${number - 5} name`} />
                              <Input name={`valorantId${number}`} placeholder="Riot ID, e.g. Player#EUW" pattern="[^#]+#[^#]+" title="Use the Riot ID format GameName#Tag." maxLength={40} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {tournament.registrationInstructions && (
                    <p className="rounded-lg border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
                      {tournament.registrationInstructions}
                    </p>
                  )}
                  <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-3 text-xs leading-5 text-muted-foreground"><input name="acceptedRules" type="checkbox" required className="mt-1 size-4 accent-primary" /><span>I accept the tournament rules and organizer decisions and acknowledge the <Link href="/privacy" className="underline text-foreground">Privacy Policy</Link>.</span></label>
                  {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                  <Button className="w-full" type="submit">
                    Register and join automatically
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.22em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-3xl font-bold uppercase sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
function RegistrationSection({
  tournament,
  game,
  available,
  isAuthenticated,
  isRegistered,
  userRegistration,
  signInUrl,
  profile,
  onRegister,
  onWithdraw,
  withdrawing,
  error,
  onQuickRegister,
  quickRegistering,
}: {
  tournament: any;
  game: ReturnType<typeof getGameModule>;
  available: boolean;
  isAuthenticated: boolean;
  isRegistered?: boolean;
  userRegistration?: any;
  signInUrl: string;
  profile?: any;
  onRegister: () => void;
  onWithdraw?: () => void;
  withdrawing?: boolean;
  error?: string;
  onQuickRegister?: () => void;
  quickRegistering?: boolean;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <SectionTitle
          eyebrow={isRegistered ? "Entry status" : "Public registration"}
          title={
            isRegistered
              ? "You are registered"
              : available
                ? "Sign in and join securely"
                : "Registration is closed"
          }
        />
        <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
          {isRegistered
            ? `Your player entry has been approved and confirmed for ${tournament.name}. You are active on the competitor list.`
            : "Registration is free and automatic. Clerk links the entry to your account, while contact details remain visible only to you and the tournament organizer."}
        </p>
        {isRegistered ? (
          <div className="mt-7 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Check className="size-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Player Entry Confirmed
                </p>
                <h3 className="text-xl font-bold uppercase font-display text-white">
                  {userRegistration?.gamerTag || userRegistration?.name || "Player Verified"}
                </h3>
              </div>
            </div>
            <div className="mt-5 rounded-xl border border-border bg-background/90 p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-semibold text-white">Next Steps for Match Day:</p>
              <ol className="space-y-2 text-xs sm:text-sm">
                <li>1. Join the tournament WhatsApp group for live scheduling, fixtures, and announcements.</li>
                {game.id === "valorant" && <li>2. Join the VALORANT Discord server for team coordination and community updates.</li>}
                <li>{game.id === "valorant" ? "3." : "2."} Check in at least 15 minutes before your scheduled fixture.</li>
                <li>{game.id === "valorant" ? "4." : "3."} Play your match and submit screenshot evidence.</li>
              </ol>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a
                href={getRegistrationGroupUrl(tournament.registrationGroupUrl)}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold border-none shadow-md shadow-[#25D366]/20 sm:w-auto")}
              >
                <WhatsAppIcon className="size-5 shrink-0" />
                Open WhatsApp Group
                <ArrowRight className="size-4 shrink-0" />
              </a>
              {game.id === "valorant" && <a
                href={VALORANT_DISCORD_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "w-full gap-2 border-none bg-[#5865F2] font-bold text-white shadow-md shadow-[#5865F2]/20 hover:bg-[#4752C4] sm:w-auto")}
              >
                <MessagesSquare className="size-5 shrink-0" />
                Open Discord
                <ArrowRight className="size-4 shrink-0" />
              </a>}
            </div>
            {onWithdraw && <Button type="button" variant="outline" className="mt-3 w-full sm:w-auto" onClick={onWithdraw} disabled={withdrawing}>{withdrawing ? "Withdrawing…" : "Withdraw registration"}</Button>}
            {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
          </div>
        ) : !available ? (
          <p className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
            This tournament is not accepting registrations right now. You can still review fixtures, standings, and rules.
          </p>
        ) : isAuthenticated ? (
          profile?.profileCompleted && onQuickRegister && game.id === "efootball" ? (
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 max-w-md">
                <p className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
                  <Zap className="size-3.5" /> 1-Click Fast Registration Active
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  Player: {profile.gamerTag || profile.name} ({countryName(profile.countryCode)})
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={onQuickRegister}
                  size="lg"
                  disabled={quickRegistering}
                  className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 font-bold shadow-lg shadow-red-500/20"
                >
                  <Zap className="size-4" />
                  {quickRegistering ? "Registering..." : `⚡ 1-Click Register for ${game.name}`}
                </Button>
                <Button onClick={onRegister} variant="outline" size="lg">
                  Customize Details
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={onRegister} size="lg" className="mt-7">
              Register for {game.name}
              <ArrowRight className="size-4" />
            </Button>
          )
        ) : (
          <Link href={signInUrl} className={cn(buttonVariants({ size: "lg" }), "mt-7")}>
            Sign in to register
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      <aside className="rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          How it works
        </p>
        <ol className="mt-5 space-y-4 text-sm text-muted-foreground">
          <li>
            <strong className="text-white">1.</strong> Submit your personal and{" "}
            {game.id === "valorant" ? "team roster" : "player"} details.
          </li>
          <li>
            <strong className="text-white">2.</strong> You are approved and added to the participant list automatically.
          </li>
          <li>
            <strong className="text-white">3.</strong> Please join the WhatsApp group for check-in, fixtures, results, and announcements.
          </li>
          <li><strong className="text-white">4.</strong> Check in 15 minutes early, play your scheduled match, and report the result with evidence.</li>
        </ol>
        {tournament.registrationInstructions && (
          <p className="mt-5 border-t border-border pt-5 text-sm leading-6 text-muted-foreground">
            {tournament.registrationInstructions}
          </p>
        )}
        <a
          className={cn(
            buttonVariants({ variant: "outline" }),
            "mt-5 w-full gap-2 border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]",
          )}
          href={getRegistrationGroupUrl(tournament.registrationGroupUrl)}
          target="_blank"
          rel="noreferrer"
        >
          <WhatsAppIcon className="size-4" />
          Join WhatsApp Group
          <ArrowRight className="size-4" />
        </a>
        {tournament.prizePool && (
          <div className="mt-5 border-t border-border pt-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Prize pool
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-white">
              {tournament.prizePool}
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
function MatchRow({ match, names }: { match: any; names: Map<string, any> }) {
  const first = names.get(match.player1Id);
  const second = names.get(match.player2Id);
  return (
    <Link
      href={`/match/${match._id}`}
      className="grid items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 sm:grid-cols-[130px_1fr_auto]"
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {match.status === "Live" ? (
          <Radio className="size-3.5 text-primary" />
        ) : (
          <Clock3 className="size-3.5" />
        )}
        {match.status}
      </div>
      <div className="flex min-w-0 items-center justify-center gap-3 font-semibold">
        <span className="truncate text-right">{first?.name ?? "TBD"}</span>
        <span className="font-display text-xl tabular-nums">
          {match.player1Score ?? "–"} : {match.player2Score ?? "–"}
        </span>
        <span className="truncate">{second?.name ?? "TBD"}</span>
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {match.round ?? "Match"}
        <ChevronRight className="size-3" />
      </span>
    </Link>
  );
}
function Standings({
  game,
  data,
}: {
  game: ReturnType<typeof getGameModule>;
  data: any[];
}) {
  const valorant = game.id === "valorant";
  return (
    <div>
      <SectionTitle eyebrow={`${game.name} table`} title="Standings" />
      <div className="mt-7 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4 text-left">#</th>
              <th className="p-4 text-left">{game.competitorLabel}</th>
              <th>P</th>
              <th>W</th>
              {!valorant && <th>D</th>}
              <th>L</th>
              <th>{valorant ? "Map W" : "GF"}</th>
              <th>{valorant ? "Map L" : "GA"}</th>
              {valorant && <th>Map ±</th>}
              <th>{valorant ? "Round ±" : "GD"}</th>
              <th className="pr-5">PTS</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row._id} className="border-t border-border">
                <td className="p-4 font-mono text-muted-foreground">
                  {index + 1}
                </td>
                <td className="p-4 font-semibold">{row.name}</td>
                <td className="text-center">{row.played}</td>
                <td className="text-center">{row.won}</td>
                {!valorant && <td className="text-center">{row.drawn}</td>}
                <td className="text-center">{row.lost}</td>
                <td className="text-center">{row.scored}</td>
                <td className="text-center">{row.conceded}</td>
                {valorant && (
                  <td className="text-center">
                    {row.mapDifferential > 0
                      ? `+${row.mapDifferential}`
                      : row.mapDifferential}
                  </td>
                )}
                <td className="text-center">
                  {row.differential > 0
                    ? `+${row.differential}`
                    : row.differential}
                </td>
                <td className="pr-5 text-center font-display text-lg font-bold text-primary">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Statistics({
  gameId,
  statistics,
}: {
  gameId: string;
  statistics: any;
}) {
  if (!statistics)
    return <div className="h-64 animate-pulse rounded-xl bg-card" />;
  const valorant = gameId === "valorant";
  const cards = valorant
    ? [
      { label: "Maps", value: statistics.totals.maps },
      { label: "Rounds", value: statistics.totals.rounds },
      { label: "Kills", value: statistics.totals.kills },
    ]
    : [
      { label: "Goals", value: statistics.totals.goals },
      { label: "Shots", value: statistics.totals.shots },
      { label: "Cards", value: statistics.totals.cards },
    ];
  return (
    <div>
      <SectionTitle
        eyebrow={`${valorant ? "VALORANT" : "eFootball"} statistics`}
        title="The numbers behind the competition"
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-bold uppercase text-muted-foreground">
            Completed matches
          </p>
          <p className="mt-6 font-display text-4xl font-bold">
            {statistics.completedMatches}
          </p>
        </div>
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-6"
          >
            <p className="text-xs font-bold uppercase text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-6 font-display text-4xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h3 className="font-display text-xl font-bold uppercase">
          {valorant ? "Kill leaders" : "Top scorers"}
        </h3>
        <div className="mt-4 space-y-2">
          {statistics.leaders.map((leader: any, index: number) => (
            <div
              key={leader.participantId}
              className="flex justify-between rounded-lg bg-background px-4 py-3"
            >
              <span>
                {index + 1}. {leader.name}
              </span>
              <strong className="text-primary">
                {valorant
                  ? `${leader.kills} K · ${leader.averageAcs} ACS`
                  : `${leader.goals} goals`}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function Bracket({
  matches,
  names,
}: {
  matches: any[];
  names: Map<string, any>;
}) {
  const knockout = matches.filter(
    (m) =>
      m.bracketRound !== undefined ||
      ["Quarter-Final", "Semi-Final", "Final"].includes(m.round),
  );
  const rounds = [
    ...new Set(knockout.map((m) => m.round ?? `Round ${m.bracketRound}`)),
  ];
  return (
    <div>
      <SectionTitle eyebrow="Knockout stage" title="The road to champion" />
      {knockout.length ? (
        <div className="mt-7 overflow-x-auto rounded-xl border border-border bg-[#0a0a0a] p-5">
          <div className="flex min-w-max gap-10">
            {rounds.map((round) => (
              <div
                key={String(round)}
                className="flex w-64 flex-col justify-around gap-5"
              >
                <p className="text-center text-xs font-bold uppercase tracking-wider text-primary">
                  {String(round)}
                </p>
                {knockout
                  .filter(
                    (m) => (m.round ?? `Round ${m.bracketRound}`) === round,
                  )
                  .map((match) => (
                    <div
                      key={match._id}
                      className="overflow-hidden rounded-lg border border-border bg-card"
                    >
                      <div
                        className={cn(
                          "flex justify-between border-b border-border px-4 py-3 text-sm",
                          match.winnerId === match.player1Id &&
                          "font-bold text-primary",
                        )}
                      >
                        <span>{names.get(match.player1Id)?.name ?? "TBD"}</span>
                        <span>{match.player1Score ?? "–"}</span>
                      </div>
                      <div
                        className={cn(
                          "flex justify-between px-4 py-3 text-sm",
                          match.winnerId === match.player2Id &&
                          "font-bold text-primary",
                        )}
                      >
                        <span>{names.get(match.player2Id)?.name ?? "TBD"}</span>
                        <span>{match.player2Score ?? "–"}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
            <div className="flex w-56 flex-col items-center justify-center rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
              <Trophy className="size-8 text-primary" />
              <p className="mt-3 text-xs font-bold uppercase tracking-wider">
                Champion
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-7">
          <Empty text="The bracket will appear when the knockout stage is generated." />
        </div>
      )}
    </div>
  );
}
