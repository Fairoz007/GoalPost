import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { gameId } from "./schema";
import { rulesFor } from "./gameModules";
import { insertCompetitor } from "./participants";

export const listRankings = query({
  args: { gameId, limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => await ctx.db.query("rankings").withIndex("by_gameId_and_rating", (q) => q.eq("gameId", args.gameId)).order("desc").take(Math.min(args.limit ?? 50, 100)),
});

export const listChampions = query({
  args: { gameId: v.optional(gameId) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    if (args.gameId) return await ctx.db.query("champions").withIndex("by_gameId_and_completedAt", (q) => q.eq("gameId", args.gameId!)).order("desc").take(100);
    return await ctx.db.query("champions").order("desc").take(100);
  },
});

export const getTeam = query({
  args: { slug: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const team = await ctx.db.query("teams").withIndex("by_slug", (q) => q.eq("slug", args.slug)).unique();
    if (!team) return null;
    const [members, tournamentEntries] = await Promise.all([
      ctx.db.query("teamMembers").withIndex("by_teamId", (q) => q.eq("teamId", team._id)).take(32),
      ctx.db.query("participants").withIndex("by_teamId", (q) => q.eq("teamId", team._id)).take(100),
    ]);
    return { ...team, members, tournamentEntries };
  },
});

export const getPlayer = query({
  args: { username: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const player = await ctx.db.query("participants").withIndex("by_slug", (q) => q.eq("slug", args.username)).first();
    if (!player) return null;
    const [home, away] = await Promise.all([
      ctx.db.query("matches").withIndex("by_player1Id", (q) => q.eq("player1Id", player._id)).order("desc").take(50),
      ctx.db.query("matches").withIndex("by_player2Id", (q) => q.eq("player2Id", player._id)).order("desc").take(50),
    ]);
    const matches = [...home, ...away].sort((a, b) => b._creationTime - a._creationTime).slice(0, 50);
    const completed = matches.filter((match) => match.status === "Completed");
    const wins = completed.filter((match) => match.winnerId === player._id).length;
    return { ...player, matches, wins, losses: completed.length - wins, winRate: completed.length ? Math.round((wins / completed.length) * 100) : 0 };
  },
});

export const register = mutation({
  args: {
    tournamentId: v.id("tournaments"), applicantName: v.string(), applicantEmail: v.string(), phoneNumber: v.string(),
    teamId: v.optional(v.id("teams")), countryCode: v.optional(v.string()), acceptedRules: v.boolean(),
    captainName: v.optional(v.string()),
    roster: v.optional(v.array(v.object({
      displayName: v.string(),
      role: v.union(v.literal("captain"), v.literal("player"), v.literal("substitute"), v.literal("coach")),
    }))),
  },
  returns: v.id("registrations"),
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get("tournaments", args.tournamentId);
    if (!tournament || ["Draft", "Completed", "Cancelled"].includes(tournament.status)) throw new Error("Registration is not available for this tournament.");
    if (!args.acceptedRules) throw new Error("You must accept the tournament rules.");
    const applicantName = args.applicantName.trim();
    const applicantEmail = args.applicantEmail.trim().toLowerCase();
    const phoneNumber = args.phoneNumber.trim();
    if (!applicantName) throw new Error("Your name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) throw new Error("Enter a valid email address.");
    if (phoneNumber.replace(/\D/g, "").length < 7) throw new Error("Enter a valid phone number.");
    const selectedGame = tournament.gameId ?? "efootball";
    const rules = rulesFor(selectedGame);
    const roster = args.roster ?? [];
    if (selectedGame === "valorant") {
      const starters = roster.filter((member) => member.role === "captain" || member.role === "player");
      if (starters.length !== rules.teamSize) throw new Error(`VALORANT registration requires exactly ${rules.teamSize} starting players.`);
      if (!args.captainName || !roster.some((member) => member.role === "captain" && member.displayName === args.captainName)) throw new Error("The captain must be included in the roster.");
    }
    const registrationId = await ctx.db.insert("registrations", {
      tournamentId: args.tournamentId,
      applicantName,
      applicantEmail,
      phoneNumber,
      teamId: args.teamId,
      countryCode: args.countryCode,
      acceptedRules: args.acceptedRules,
      captainName: args.captainName,
      gameId: selectedGame,
      competitorKind: rules.competitorKind,
      status: "pending",
      createdAt: Date.now(),
    });
    for (const member of roster) await ctx.db.insert("registrationRoster", { registrationId, ...member });
    return registrationId;
  },
});

export const listRegistrations = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const registrations = await ctx.db.query("registrations").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).order("desc").take(100);
    return await Promise.all(registrations.map(async (registration) => ({
      ...registration,
      roster: await ctx.db.query("registrationRoster").withIndex("by_registrationId", (q) => q.eq("registrationId", registration._id)).take(16),
    })));
  },
});

export const reviewRegistration = mutation({
  args: { registrationId: v.id("registrations"), decision: v.union(v.literal("approved"), v.literal("rejected")) },
  returns: v.union(v.id("participants"), v.null()),
  handler: async (ctx, args) => {
    const registration = await ctx.db.get("registrations", args.registrationId);
    if (!registration) throw new Error("Registration not found.");
    if (registration.participantId) return registration.participantId;
    if (args.decision === "rejected") {
      await ctx.db.patch(registration._id, { status: "rejected" });
      return null;
    }
    const roster = await ctx.db.query("registrationRoster").withIndex("by_registrationId", (q) => q.eq("registrationId", registration._id)).take(16);
    const participantId = await insertCompetitor(ctx, {
      tournamentId: registration.tournamentId,
      name: registration.applicantName,
      gameId: registration.gameId ?? "efootball",
      countryCode: registration.countryCode,
      captain: registration.captainName,
      teamId: registration.teamId,
      roster: roster.map((member) => ({ displayName: member.displayName, role: member.role })),
    });
    await ctx.db.patch(registration._id, { status: "approved", participantId });
    return participantId;
  },
});

export const listAnnouncements = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => await ctx.db.query("announcements").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).order("desc").take(50),
});

export const createAnnouncement = mutation({
  args: { tournamentId: v.id("tournaments"), title: v.string(), body: v.string(), pinned: v.boolean() },
  returns: v.id("announcements"),
  handler: async (ctx, args) => await ctx.db.insert("announcements", { ...args, createdAt: Date.now() }),
});

export const reportDispute = mutation({
  args: { matchId: v.id("matches"), reporterName: v.string(), reason: v.string(), evidenceUrl: v.optional(v.string()) },
  returns: v.id("disputes"),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("disputes", { ...args, status: "open", createdAt: Date.now() });
    await ctx.db.patch(args.matchId, { status: "Disputed" });
    return id;
  },
});
