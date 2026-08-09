import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { gameId } from "./schema";
import { rulesFor, type GameModuleId } from "./gameModules";
import type { Id } from "./_generated/dataModel";

const rosterMember = v.object({
  displayName: v.string(),
  role: v.union(v.literal("captain"), v.literal("player"), v.literal("coach"), v.literal("substitute")),
  countryCode: v.optional(v.string()),
});

type CompetitorInput = {
  name: string;
  tournamentId: Id<"tournaments">;
  slug?: string;
  gameId?: GameModuleId;
  kind?: "player" | "team";
  teamId?: Id<"teams">;
  teamName?: string;
  logoUrl?: string;
  avatarUrl?: string;
  countryCode?: string;
  flag?: string;
  captain?: string;
  seed?: number;
  roster?: Array<{ displayName: string; role: "captain" | "player" | "coach" | "substitute"; countryCode?: string }>;
};

export async function insertCompetitor(ctx: MutationCtx, args: CompetitorInput) {
  const tournament = await ctx.db.get("tournaments", args.tournamentId);
  if (!tournament) throw new Error("Tournament not found.");
  const selectedGame = (tournament.gameId ?? args.gameId ?? "efootball") as GameModuleId;
  const rules = rulesFor(selectedGame);
  if (args.gameId && args.gameId !== selectedGame) throw new Error("Competitor game does not match the tournament game.");

  let teamId = args.teamId;
  if (selectedGame === "valorant" && !teamId) {
    const roster = args.roster ?? [];
    const starters = roster.filter((member) => member.role === "captain" || member.role === "player");
    if (starters.length !== rules.teamSize) throw new Error(`VALORANT teams require exactly ${rules.teamSize} starting players.`);
    if (roster.length > 8) throw new Error("A VALORANT roster can contain at most 8 members including substitutes and coach.");
    const captain = args.captain ?? roster.find((member) => member.role === "captain")?.displayName;
    if (!captain) throw new Error("A VALORANT team captain is required.");
    const baseSlug = (args.slug || args.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const existing = await ctx.db.query("teams").withIndex("by_slug", (q) => q.eq("slug", baseSlug)).unique();
    const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;
    teamId = await ctx.db.insert("teams", {
      name: args.name,
      slug,
      gameId: "valorant",
      logoUrl: args.logoUrl,
      countryCode: args.countryCode,
      captainName: captain,
      createdAt: Date.now(),
    });
    for (const member of roster) await ctx.db.insert("teamMembers", { teamId, ...member });
  }

  if (selectedGame === "valorant" && teamId) {
    const members = await ctx.db.query("teamMembers").withIndex("by_teamId", (q) => q.eq("teamId", teamId)).take(16);
    const starters = members.filter((member) => member.role === "captain" || member.role === "player");
    if (starters.length !== rules.teamSize) throw new Error(`VALORANT teams require exactly ${rules.teamSize} starting players.`);
  }

  return await ctx.db.insert("participants", {
    name: args.name,
    tournamentId: args.tournamentId,
    slug: args.slug,
    gameId: selectedGame,
    kind: rules.competitorKind,
    teamId,
    teamName: args.teamName,
    logoUrl: args.logoUrl,
    avatarUrl: args.avatarUrl,
    countryCode: args.countryCode,
    flag: args.flag,
    captain: args.captain,
    seed: args.seed,
    registrationStatus: "approved",
    checkedIn: false,
  });
}

export const create = mutation({
  args: {
    name: v.string(), tournamentId: v.id("tournaments"), slug: v.optional(v.string()), gameId: v.optional(gameId),
    kind: v.optional(v.union(v.literal("player"), v.literal("team"))), teamId: v.optional(v.id("teams")),
    teamName: v.optional(v.string()), logoUrl: v.optional(v.string()), avatarUrl: v.optional(v.string()),
    countryCode: v.optional(v.string()), flag: v.optional(v.string()), captain: v.optional(v.string()),
    seed: v.optional(v.number()), roster: v.optional(v.array(rosterMember)),
  },
  returns: v.id("participants"),
  handler: async (ctx, args) => await insertCompetitor(ctx, args),
});

export const getByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const participants = await ctx.db.query("participants").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(128);
    return await Promise.all(participants.map(async (participant) => {
      if (!participant.teamId) return { ...participant, roster: [] };
      const [team, roster] = await Promise.all([
        ctx.db.get("teams", participant.teamId),
        ctx.db.query("teamMembers").withIndex("by_teamId", (q) => q.eq("teamId", participant.teamId!)).take(16),
      ]);
      return { ...participant, team, roster };
    }));
  },
});

export const getAllUnique = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const rows = await ctx.db.query("participants").take(500);
    return [...new Map(rows.map((participant) => [participant.name, participant])).values()];
  },
});

export const assignToGroup = mutation({
  args: { participantId: v.id("participants"), groupId: v.optional(v.id("groups")) },
  returns: v.null(),
  handler: async (ctx, args) => { await ctx.db.patch(args.participantId, { groupId: args.groupId }); return null; },
});

export const setCheckIn = mutation({
  args: { participantId: v.id("participants"), checkedIn: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => { await ctx.db.patch(args.participantId, { checkedIn: args.checkedIn }); return null; },
});

export const remove = mutation({
  args: { id: v.id("participants") },
  returns: v.null(),
  handler: async (ctx, args) => { await ctx.db.delete(args.id); return null; },
});
