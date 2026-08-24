import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { gameId, tournamentFormat, tournamentStatus, valorantMatchMode } from "./schema";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { rulesFor, valorantModeRules } from "./gameModules";
import { codesMatch, generateTournamentAdminCode, requireTournamentAdmin } from "./tournamentAuth";
import { requireIdentity } from "./model/auth";
import { parseYouTubeVideoId } from "./model/youtube";
import { isPlatformAdmin, requirePlatformAdmin } from "./model/platformAuth";
import { adjustPlatformStats } from "./model/platformStats";
import { cleanOptional, cleanRequired, validIsoDate, validateBestOf, validateSlots, validateTimeZone, validateWhatsAppInvite } from "./model/validation";
import { canManageTournament } from "./model/tournamentAccess";

const DEFAULT_REGISTRATION_INSTRUCTIONS = "Your place is confirmed automatically after registration. Please join the WhatsApp group for check-in, fixtures, results, and announcements.";

const publicTournament = (tournament: Doc<"tournaments">, exposeRegistrationGroup = false) => {
  const { adminCode, ownerToken, ...rest } = tournament;
  const registrationGroupUrl = exposeRegistrationGroup ? rest.registrationGroupUrl : undefined;

  let registrationInstructions = rest.registrationInstructions;
  if (registrationInstructions && registrationInstructions.toLowerCase().includes("discord")) {
    registrationInstructions = registrationInstructions.replace(/discord/gi, "WhatsApp");
  }

  let rules = rest.rules;
  if (rules && rules.toLowerCase().includes("discord")) {
    rules = rules.replace(/discord/gi, "WhatsApp");
  }

  return {
    ...rest,
    gameId: rest.gameId ?? "efootball",
    hasAdminCode: Boolean(adminCode),
    registrationGroupUrl,
    registrationInstructions: registrationInstructions ?? DEFAULT_REGISTRATION_INSTRUCTIONS,
    rules: rules ?? defaultTournamentRules(rest.format),
  };
};

function defaultTournamentRules(format: Doc<"tournaments">["format"]) {
  const progression = format === "Single Group + Finals"
    ? "Group stage: every player faces every other player once. The top four qualify for the semifinals (1st vs 4th and 2nd vs 3rd); the semifinal winners play the final."
    : "The organizer will publish fixtures and progression before the first match.";
  return [
    progression,
    "Check in on WhatsApp at least 15 minutes before your scheduled match.",
    "Use a stable connection and the approved game settings. Deliberate disconnects or unfair play may result in a forfeit.",
    "Both competitors must report the result promptly. Keep a screenshot or recording as evidence.",
    "Raise disputes with evidence before the next round begins. The organizer's final ruling applies.",
    "Be respectful to opponents and staff. Harassment, cheating, and account sharing are prohibited.",
  ].join("\n\n");
}

async function canViewRegistrationGroup(ctx: QueryCtx, tournament: Doc<"tournaments">) {
  if (await canManageTournament(ctx, tournament)) return true;
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;
  const registration = await ctx.db
    .query("registrations")
    .withIndex("by_ownerToken_and_tournamentId", (q) => q.eq("ownerToken", identity.tokenIdentifier).eq("tournamentId", tournament._id))
    .first();
  return Boolean(registration && registration.status !== "rejected");
}

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    gameId: v.optional(gameId),
    matchMode: v.optional(valorantMatchMode),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    registrationClosesAt: v.optional(v.string()),
    timezone: v.optional(v.string()),
    format: tournamentFormat,
    status: tournamentStatus,
    organizer: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    prizePool: v.optional(v.string()),
    registrationGroupUrl: v.optional(v.string()),
    registrationInstructions: v.optional(v.string()),
    registrationEnabled: v.optional(v.boolean()),
    maxSlots: v.optional(v.number()),
    teamSize: v.optional(v.number()),
    bestOf: v.optional(v.number()),
    currentStage: v.optional(v.string()),
    rules: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  returns: v.object({ tournamentId: v.id("tournaments") }),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const name = cleanRequired(args.name, "Tournament name", 100);
    const slug = cleanOptional(args.slug, "Tournament URL", 80)?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const organizer = cleanOptional(args.organizer, "Organizer", 100);
    const startDate = validIsoDate(args.startDate, "Start date");
    const endDate = validIsoDate(args.endDate, "End date");
    const registrationClosesAt = validIsoDate(args.registrationClosesAt, "Registration close date");
    const timezone = validateTimeZone(args.timezone);
    if (!startDate) throw new Error("Start date is required.");
    if (endDate && Date.parse(endDate) < Date.parse(startDate)) throw new Error("End date cannot be before the start date.");
    if (registrationClosesAt && Date.parse(registrationClosesAt) > Date.parse(startDate)) throw new Error("Registration must close on or before the tournament starts.");
    validateSlots(args.maxSlots);
    validateBestOf(args.bestOf);
    const registrationGroupUrl = validateWhatsAppInvite(args.registrationGroupUrl);
    if (slug) {
      const existing = await ctx.db.query("tournaments").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
      if (existing) throw new Error("A tournament with this URL already exists.");
    }
    if (args.featured) await requirePlatformAdmin(ctx);
    const selectedGame = args.gameId ?? "efootball";
    const gameRules = rulesFor(selectedGame);
    if (!gameRules.formats.includes(args.format)) throw new Error(`${args.format} is not supported for ${gameRules.name}.`);
    if (selectedGame === "efootball" && args.matchMode) throw new Error("Valorant match modes cannot be used for E-Football tournaments.");
    const matchMode = selectedGame === "valorant" ? args.matchMode ?? "scrimmage" : undefined;
    const tournamentId = await ctx.db.insert("tournaments", {
      ...args,
      name,
      slug,
      organizer,
      startDate,
      endDate,
      registrationClosesAt,
      timezone,
      ownerToken: identity.tokenIdentifier,
      gameId: selectedGame,
      matchMode,
      registrationGroupUrl,
      registrationInstructions: args.registrationInstructions ?? DEFAULT_REGISTRATION_INSTRUCTIONS,
      rules: args.rules ?? (matchMode ? valorantModeRules(matchMode).rules : defaultTournamentRules(args.format)),
      registrationEnabled: args.registrationEnabled ?? true,
      teamSize: gameRules.teamSize,
      bestOf: args.bestOf ?? gameRules.defaultBestOf,
    });
    if (args.status === "Ongoing" || args.status === "Registration Open") await adjustPlatformStats(ctx, { activeTournaments: 1 });
    return { tournamentId };
  },
});

export const update = mutation({
  args: {
    id: v.id("tournaments"),
    adminCode: v.optional(v.string()),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(tournamentStatus),
    format: v.optional(tournamentFormat),
    matchMode: v.optional(valorantMatchMode),
    organizer: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    registrationClosesAt: v.optional(v.string()),
    timezone: v.optional(v.string()),
    currentStage: v.optional(v.string()),
    rules: v.optional(v.string()),
    prizePool: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    registrationGroupUrl: v.optional(v.string()),
    registrationInstructions: v.optional(v.string()),
    registrationEnabled: v.optional(v.boolean()),
    maxSlots: v.optional(v.number()),
    bestOf: v.optional(v.number()),
    featured: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, adminCode, ...updates } = args;
    const tournament = await requireTournamentAdmin(ctx, id, adminCode);
    const selectedGame = tournament.gameId ?? "efootball";
    const gameRules = rulesFor(selectedGame);
    if (args.slug && args.slug !== tournament.slug) {
      const existing = await ctx.db.query("tournaments").withIndex("by_slug", (q) => q.eq("slug", args.slug!)).unique();
      if (existing) throw new Error("A tournament with this public URL already exists.");
    }
    if (args.format && !gameRules.formats.includes(args.format)) throw new Error(`${args.format} is not supported for ${gameRules.name}.`);
    if (selectedGame === "efootball" && args.matchMode) throw new Error("VALORANT match modes cannot be used for eFootball tournaments.");
    validateSlots(args.maxSlots);
    validateBestOf(args.bestOf);
    if (args.featured !== undefined && args.featured !== (tournament.featured === true)) await requirePlatformAdmin(ctx);
    if (args.status === "Completed" && tournament.status !== "Completed") {
      const champion = await ctx.db.query("champions").withIndex("by_tournamentId", (q) => q.eq("tournamentId", id)).unique();
      if (!champion) throw new Error("A tournament can only be completed after a champion is recorded.");
    }
    const startDate = validIsoDate(args.startDate, "Start date");
    const endDate = validIsoDate(args.endDate, "End date");
    const registrationClosesAt = validIsoDate(args.registrationClosesAt, "Registration close date");
    const timezone = args.timezone === undefined ? undefined : validateTimeZone(args.timezone);
    const effectiveStart = startDate ?? tournament.startDate;
    if (endDate && Date.parse(endDate) < Date.parse(effectiveStart)) throw new Error("End date cannot be before the start date.");
    if (registrationClosesAt && Date.parse(registrationClosesAt) > Date.parse(effectiveStart)) throw new Error("Registration must close on or before the tournament starts.");
    const registrationGroupUrl = args.registrationGroupUrl === undefined ? undefined : validateWhatsAppInvite(args.registrationGroupUrl);
    const changesStructure = (args.format !== undefined && args.format !== tournament.format)
      || (args.matchMode !== undefined && args.matchMode !== tournament.matchMode);
    if (changesStructure) {
      const existingMatches = await ctx.db.query("matches").withIndex("by_tournamentId", (q) => q.eq("tournamentId", id)).take(1);
      if (existingMatches.length) throw new Error("Tournament format and match mode cannot be changed after fixtures are generated.");
    }
    const wasActive = tournament.status === "Ongoing" || tournament.status === "Registration Open";
    const willBeActive = (args.status ?? tournament.status) === "Ongoing" || (args.status ?? tournament.status) === "Registration Open";
    const safeUpdates = { ...updates };
    if (args.startDate !== undefined) safeUpdates.startDate = startDate;
    if (args.endDate !== undefined) safeUpdates.endDate = endDate;
    if (args.registrationClosesAt !== undefined) safeUpdates.registrationClosesAt = registrationClosesAt;
    if (args.registrationGroupUrl !== undefined) safeUpdates.registrationGroupUrl = registrationGroupUrl;
    if (args.timezone !== undefined) safeUpdates.timezone = timezone;
    await ctx.db.patch(id, safeUpdates);
    if (wasActive !== willBeActive) await adjustPlatformStats(ctx, { activeTournaments: willBeActive ? 1 : -1 });
    return null;
  },
});

export const setYouTubeVideo = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    videoUrl: v.string(),
    adminCode: v.optional(v.string()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await requireTournamentAdmin(ctx, args.tournamentId, args.adminCode);
    const youtubeVideoId = parseYouTubeVideoId(args.videoUrl);
    await ctx.db.patch(args.tournamentId, {
      youtubeVideoId: youtubeVideoId ?? undefined,
    });
    return youtubeVideoId;
  },
});

export const remove = mutation({
  args: { id: v.id("tournaments"), adminCode: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tournament = await requireTournamentAdmin(ctx, args.id, args.adminCode);
    const dependencies = await Promise.all([
      ctx.db.query("participants").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.id)).take(1),
      ctx.db.query("groups").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.id)).take(1),
      ctx.db.query("matches").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.id)).take(1),
      ctx.db.query("registrations").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.id)).take(1),
      ctx.db.query("announcements").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.id)).take(1),
      ctx.db.query("tournamentInvites").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.id)).take(1),
      ctx.db.query("champions").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.id)).take(1),
    ]);
    if (dependencies.some((rows) => rows.length)) throw new Error("This tournament contains related data and cannot be deleted. Cancel it or remove its data safely first.");
    await ctx.db.delete(args.id);
    if (tournament.status === "Ongoing" || tournament.status === "Registration Open") await adjustPlatformStats(ctx, { activeTournaments: -1 });
    return null;
  },
});

export const get = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const statuses = ["Upcoming", "Registration Open", "Ongoing", "Completed", "Cancelled"] as const;
    const groups = await Promise.all(statuses.map((status) => ctx.db.query("tournaments").withIndex("by_status", (q) => q.eq("status", status)).order("desc").take(100)));
    return groups.flat().sort((a, b) => b._creationTime - a._creationTime).slice(0, 100).map((tournament) => publicTournament(tournament));
  },
});

export const getMine = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    if (await isPlatformAdmin(ctx)) {
      const tournaments = await ctx.db.query("tournaments").order("desc").take(100);
      return tournaments.map((tournament) => publicTournament(tournament, true));
    }
    const tournaments = await ctx.db
      .query("tournaments")
      .withIndex("by_ownerToken", (q) => q.eq("ownerToken", identity.tokenIdentifier))
      .order("desc")
      .take(100);
    return tournaments.map((tournament) => publicTournament(tournament, true));
  },
});

export const getOwnedById = query({
  args: { id: v.id("tournaments") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const tournament = await ctx.db.get("tournaments", args.id);
    if (!tournament || (tournament.ownerToken !== identity.tokenIdentifier && !(await canManageTournament(ctx, tournament)))) return null;
    return publicTournament(tournament, true);
  },
});

export const claimLegacy = mutation({
  args: { id: v.id("tournaments"), editCode: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const tournament = await ctx.db.get("tournaments", args.id);
    if (!tournament) return false;
    if (tournament.ownerToken) return tournament.ownerToken === identity.tokenIdentifier;
    const suppliedCode = args.editCode.trim().toUpperCase();
    if (!tournament.adminCode || !codesMatch(tournament.adminCode, suppliedCode)) {
      throw new Error("The legacy tournament edit code is invalid.");
    }
    await ctx.db.patch(tournament._id, { ownerToken: identity.tokenIdentifier, adminCode: undefined });
    return true;
  },
});

export const getById = query({
  args: { id: v.id("tournaments") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get("tournaments", args.id);
    if (tournament?.status === "Draft") {
      if (!(await canManageTournament(ctx, tournament))) return null;
    }
    return tournament ? publicTournament(tournament, await canViewRegistrationGroup(ctx, tournament)) : null;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const tournament = await ctx.db.query("tournaments").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
    if (tournament?.status === "Draft") {
      if (!(await canManageTournament(ctx, tournament))) return null;
    }
    return tournament ? publicTournament(tournament, await canViewRegistrationGroup(ctx, tournament)) : null;
  },
});

export const getDiscovery = query({
  args: {},
  returns: v.object({
    tournaments: v.array(v.any()),
    stats: v.object({ activeTournaments: v.number(), registeredCompetitors: v.number(), completedMatches: v.number(), games: v.number() }),
  }),
  handler: async (ctx) => {
    const statuses = ["Upcoming", "Registration Open", "Ongoing", "Completed", "Cancelled"] as const;
    const grouped = await Promise.all(statuses.map((status) => ctx.db.query("tournaments").withIndex("by_status", (q) => q.eq("status", status)).order("desc").take(100)));
    const tournaments = grouped.flat().sort((a, b) => b._creationTime - a._creationTime).slice(0, 100);
    const stats = await ctx.db.query("platformStats").withIndex("by_key", (q) => q.eq("key", "global")).unique();
    return {
      tournaments: tournaments.map((tournament) => publicTournament(tournament)),
      stats: {
        activeTournaments: stats?.activeTournaments ?? tournaments.filter((t) => t.status === "Ongoing" || t.status === "Registration Open").length,
        registeredCompetitors: stats?.registeredCompetitors ?? 0,
        completedMatches: stats?.completedMatches ?? 0,
        games: 2,
      },
    };
  },
});

export const verifyAdminCode = query({
  args: { id: v.id("tournaments"), code: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    try {
      await requireTournamentAdmin(ctx, args.id, args.code);
      return true;
    } catch {
      return false;
    }
  },
});

export const backfillAdminCodes = internalMutation({
  args: {},
  returns: v.array(v.object({ tournamentId: v.id("tournaments"), editCode: v.string() })),
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").take(100);
    const generated: Array<{ tournamentId: Doc<"tournaments">["_id"]; editCode: string }> = [];
    for (const tournament of tournaments) {
      if (!tournament.adminCode) {
        const editCode = generateTournamentAdminCode();
        await ctx.db.patch(tournament._id, { adminCode: editCode });
        generated.push({ tournamentId: tournament._id, editCode });
      }
    }
    return generated;
  },
});
