import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { gameId } from "./schema";
import { rulesFor, type GameModuleId } from "./gameModules";
import type { Id } from "./_generated/dataModel";
import { requireTournamentAdmin } from "./tournamentAuth";
import { requireIdentity } from "./model/auth";

const rosterMember = v.object({
  displayName: v.string(),
  role: v.union(v.literal("captain"), v.literal("player"), v.literal("coach"), v.literal("substitute")),
  countryCode: v.optional(v.string()),
});

type CompetitorInput = {
  userId?: Id<"users">;
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

  if (args.userId) {
    const user = await ctx.db.get("users", args.userId);
    if (!user) throw new Error("The selected registered user no longer exists.");
    const existingParticipant = await ctx.db
      .query("participants")
      .withIndex("by_tournamentId_and_userId", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("userId", args.userId),
      )
      .unique();
    if (existingParticipant) throw new Error("This registered user is already a participant in the tournament.");
  }

  let teamId = args.teamId;
  if (teamId) {
    const [identity, team] = await Promise.all([requireIdentity(ctx), ctx.db.get("teams", teamId)]);
    if (!team || team.ownerToken !== identity.tokenIdentifier) {
      throw new Error("You do not have permission to use this team.");
    }
  }
  if (selectedGame === "valorant" && !teamId) {
    const identity = await requireIdentity(ctx);
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
      ownerToken: identity.tokenIdentifier,
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
    userId: args.userId,
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
    name: v.string(), tournamentId: v.id("tournaments"), userId: v.optional(v.id("users")), adminCode: v.optional(v.string()), slug: v.optional(v.string()), gameId: v.optional(gameId),
    kind: v.optional(v.union(v.literal("player"), v.literal("team"))), teamId: v.optional(v.id("teams")),
    teamName: v.optional(v.string()), logoUrl: v.optional(v.string()), avatarUrl: v.optional(v.string()),
    countryCode: v.optional(v.string()), flag: v.optional(v.string()), captain: v.optional(v.string()),
    seed: v.optional(v.number()), roster: v.optional(v.array(rosterMember)),
  },
  returns: v.id("participants"),
  handler: async (ctx, args) => {
    await requireTournamentAdmin(ctx, args.tournamentId, args.adminCode);
    const { adminCode: _adminCode, ...competitor } = args;
    return await insertCompetitor(ctx, competitor);
  },
});

export const getByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const participants = await ctx.db.query("participants").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(128);
    return await Promise.all(participants.map(async (participant) => {
      const { userId: _userId, ...publicParticipant } = participant;
      if (!participant.teamId) return { ...publicParticipant, roster: [] };
      const [team, roster] = await Promise.all([
        ctx.db.get("teams", participant.teamId),
        ctx.db.query("teamMembers").withIndex("by_teamId", (q) => q.eq("teamId", participant.teamId!)).take(16),
      ]);
      if (!team) return { ...publicParticipant, team: null, roster };
      const { ownerToken: _ownerToken, ...publicTeam } = team;
      return { ...publicParticipant, team: publicTeam, roster };
    }));
  },
});

export const getAllUnique = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const rows = await ctx.db.query("participants").take(500);
    const unique = [...new Map(rows.map((participant) => [`${participant.gameId ?? "efootball"}:${participant.name.toLowerCase()}`, participant])).values()];
    return await Promise.all(unique.map(async (participant) => {
      const { userId: _userId, ...publicParticipant } = participant;
      return {
      ...publicParticipant,
      roster: participant.teamId
        ? await ctx.db.query("teamMembers").withIndex("by_teamId", (q) => q.eq("teamId", participant.teamId!)).take(16)
        : [],
      };
    }));
  },
});

export const assignToGroup = mutation({
  args: { participantId: v.id("participants"), groupId: v.optional(v.id("groups")), adminCode: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const participant = await ctx.db.get("participants", args.participantId);
    if (!participant) throw new Error("Participant not found.");
    await requireTournamentAdmin(ctx, participant.tournamentId, args.adminCode);
    if (args.groupId) {
      const group = await ctx.db.get("groups", args.groupId);
      if (!group || group.tournamentId !== participant.tournamentId) throw new Error("Group does not belong to this tournament.");
    }
    await ctx.db.patch(args.participantId, { groupId: args.groupId });
    return null;
  },
});

export const setCheckIn = mutation({
  args: { participantId: v.id("participants"), checkedIn: v.boolean(), adminCode: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => { const participant = await ctx.db.get("participants", args.participantId); if (!participant) throw new Error("Participant not found."); await requireTournamentAdmin(ctx, participant.tournamentId, args.adminCode); await ctx.db.patch(args.participantId, { checkedIn: args.checkedIn }); return null; },
});

export const remove = mutation({
  args: { id: v.id("participants"), adminCode: v.optional(v.string()) },
  returns: v.null(),
  handler: async (ctx, args) => { const participant = await ctx.db.get("participants", args.id); if (!participant) throw new Error("Participant not found."); await requireTournamentAdmin(ctx, participant.tournamentId, args.adminCode); await ctx.db.delete(args.id); return null; },
});
