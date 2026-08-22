import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { gameId, tournamentFormat, tournamentStatus, valorantMatchMode } from "./schema";
import type { Doc } from "./_generated/dataModel";
import { rulesFor, valorantModeRules } from "./gameModules";
import { codesMatch, generateTournamentAdminCode, requireTournamentAdmin } from "./tournamentAuth";
import { requireIdentity } from "./model/auth";
import { parseYouTubeVideoId } from "./model/youtube";

const publicTournament = (tournament: Doc<"tournaments">) => {
  const { adminCode, ownerToken, ...rest } = tournament;
  return { ...rest, gameId: rest.gameId ?? "efootball", hasAdminCode: Boolean(adminCode) };
};

const DEFAULT_DISCORD_URL = "https://discord.gg/kbEtE5h6nt";
const DEFAULT_REGISTRATION_INSTRUCTIONS = "Your place is confirmed automatically after registration. Please join the Discord for check-in, fixtures, results, and announcements.";

function defaultTournamentRules(format: Doc<"tournaments">["format"]) {
  const progression = format === "Single Group + Finals"
    ? "Group stage: every player faces every other player once. The top four qualify for the semifinals (1st vs 4th and 2nd vs 3rd); the semifinal winners play the final."
    : "The organizer will publish fixtures and progression before the first match.";
  return [
    progression,
    "Check in on Discord at least 15 minutes before your scheduled match.",
    "Use a stable connection and the approved game settings. Deliberate disconnects or unfair play may result in a forfeit.",
    "Both competitors must report the result promptly. Keep a screenshot or recording as evidence.",
    "Raise disputes with evidence before the next round begins. The organizer's final ruling applies.",
    "Be respectful to opponents and staff. Harassment, cheating, and account sharing are prohibited.",
  ].join("\n\n");
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
    if (args.slug) {
      const existing = await ctx.db.query("tournaments").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
      if (existing) throw new Error("A tournament with this URL already exists.");
    }
    const selectedGame = args.gameId ?? "efootball";
    const gameRules = rulesFor(selectedGame);
    if (!gameRules.formats.includes(args.format)) throw new Error(`${args.format} is not supported for ${gameRules.name}.`);
    if (selectedGame === "efootball" && args.matchMode) throw new Error("Valorant match modes cannot be used for E-Football tournaments.");
    const matchMode = selectedGame === "valorant" ? args.matchMode ?? "scrimmage" : undefined;
    const tournamentId = await ctx.db.insert("tournaments", {
      ...args,
      ownerToken: identity.tokenIdentifier,
      gameId: selectedGame,
      matchMode,
      registrationGroupUrl: args.registrationGroupUrl ?? DEFAULT_DISCORD_URL,
      registrationInstructions: args.registrationInstructions ?? DEFAULT_REGISTRATION_INSTRUCTIONS,
      rules: args.rules ?? (matchMode ? valorantModeRules(matchMode).rules : defaultTournamentRules(args.format)),
      registrationEnabled: args.registrationEnabled ?? true,
      teamSize: gameRules.teamSize,
      bestOf: args.bestOf ?? gameRules.defaultBestOf,
    });
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
    if (args.maxSlots !== undefined && (!Number.isInteger(args.maxSlots) || args.maxSlots < 2 || args.maxSlots > 128)) throw new Error("Maximum slots must be a whole number between 2 and 128.");
    if (args.bestOf !== undefined && (![1, 3, 5].includes(args.bestOf))) throw new Error("Series length must be best-of-1, best-of-3, or best-of-5.");
    const changesStructure = (args.format !== undefined && args.format !== tournament.format)
      || (args.matchMode !== undefined && args.matchMode !== tournament.matchMode);
    if (changesStructure) {
      const existingMatches = await ctx.db.query("matches").withIndex("by_tournamentId", (q) => q.eq("tournamentId", id)).take(1);
      if (existingMatches.length) throw new Error("Tournament format and match mode cannot be changed after fixtures are generated.");
    }
    await ctx.db.patch(id, updates);
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
    await requireTournamentAdmin(ctx, args.id, args.adminCode);
    await ctx.db.delete(args.id);
    return null;
  },
});

export const get = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").order("desc").take(100);
    return tournaments.filter((tournament) => tournament.status !== "Draft").map(publicTournament);
  },
});

export const getMine = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const tournaments = await ctx.db
      .query("tournaments")
      .withIndex("by_ownerToken", (q) => q.eq("ownerToken", identity.tokenIdentifier))
      .order("desc")
      .take(100);
    return tournaments.map(publicTournament);
  },
});

export const getOwnedById = query({
  args: { id: v.id("tournaments") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const tournament = await ctx.db.get("tournaments", args.id);
    if (!tournament || tournament.ownerToken !== identity.tokenIdentifier) return null;
    return publicTournament(tournament);
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
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || tournament.ownerToken !== identity.tokenIdentifier) return null;
    }
    return tournament ? publicTournament(tournament) : null;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const tournament = await ctx.db.query("tournaments").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
    if (tournament?.status === "Draft") {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || tournament.ownerToken !== identity.tokenIdentifier) return null;
    }
    return tournament ? publicTournament(tournament) : null;
  },
});

export const getDiscovery = query({
  args: {},
  returns: v.object({
    tournaments: v.array(v.any()),
    stats: v.object({ activeTournaments: v.number(), registeredCompetitors: v.number(), completedMatches: v.number(), games: v.number() }),
  }),
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").order("desc").take(100);
    const competitors = await ctx.db.query("participants").take(500);
    const completed = await ctx.db.query("matches").withIndex("by_tournamentId_and_status").take(500);
    return {
      tournaments: tournaments.filter((tournament) => tournament.status !== "Draft").map(publicTournament),
      stats: {
        activeTournaments: tournaments.filter((t) => t.status === "Ongoing" || t.status === "Registration Open").length,
        registeredCompetitors: competitors.length,
        completedMatches: completed.filter((m) => m.status === "Completed").length,
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
