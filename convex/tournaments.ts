import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { gameId, tournamentFormat, tournamentStatus } from "./schema";
import type { Doc } from "./_generated/dataModel";
import { rulesFor } from "./gameModules";

const publicTournament = (tournament: Doc<"tournaments">) => {
  const { adminCode, ...rest } = tournament;
  return { ...rest, gameId: rest.gameId ?? "efootball", hasAdminCode: Boolean(adminCode) };
};

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    gameId: v.optional(gameId),
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
    maxSlots: v.optional(v.number()),
    teamSize: v.optional(v.number()),
    bestOf: v.optional(v.number()),
    currentStage: v.optional(v.string()),
    rules: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    adminCode: v.optional(v.string()),
  },
  returns: v.id("tournaments"),
  handler: async (ctx, args) => {
    if (args.slug) {
      const existing = await ctx.db.query("tournaments").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
      if (existing) throw new Error("A tournament with this URL already exists.");
    }
    const selectedGame = args.gameId ?? "efootball";
    const rules = rulesFor(selectedGame);
    if (!rules.formats.includes(args.format)) throw new Error(`${args.format} is not supported for ${rules.name}.`);
    return await ctx.db.insert("tournaments", {
      ...args,
      gameId: selectedGame,
      teamSize: rules.teamSize,
      bestOf: args.bestOf ?? rules.defaultBestOf,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tournaments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(tournamentStatus),
    currentStage: v.optional(v.string()),
    rules: v.optional(v.string()),
    prizePool: v.optional(v.string()),
    registrationGroupUrl: v.optional(v.string()),
    registrationInstructions: v.optional(v.string()),
    maxSlots: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("tournaments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

export const get = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").order("desc").take(100);
    return tournaments.map(publicTournament);
  },
});

export const getById = query({
  args: { id: v.id("tournaments") },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get("tournaments", args.id);
    return tournament ? publicTournament(tournament) : null;
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const tournament = await ctx.db.query("tournaments").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
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
      tournaments: tournaments.map(publicTournament),
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
    const tournament = await ctx.db.get("tournaments", args.id);
    return Boolean(tournament?.adminCode && tournament.adminCode === args.code);
  },
});

export const backfillAdminCodes = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").take(100);
    let updated = 0;
    for (const tournament of tournaments) {
      if (!tournament.adminCode) {
        await ctx.db.patch(tournament._id, { adminCode: "000000" });
        updated += 1;
      }
    }
    return updated;
  },
});
