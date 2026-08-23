import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { validateTimeZone } from "./model/validation";

export const backfillTournamentTimezones = internalMutation({
  args: { paginationOpts: paginationOptsValidator, timezone: v.optional(v.string()) },
  returns: v.object({ updated: v.number(), continueCursor: v.string(), isDone: v.boolean() }),
  handler: async (ctx, args) => {
    const timezone = validateTimeZone(args.timezone);
    const page = await ctx.db.query("tournaments").paginate(args.paginationOpts);
    let updated = 0;
    for (const tournament of page.page) {
      if (!tournament.timezone) {
        await ctx.db.patch(tournament._id, { timezone });
        updated += 1;
      }
    }
    return { updated, continueCursor: page.continueCursor, isDone: page.isDone };
  },
});

export const rebuildPlatformStats = internalMutation({
  args: {},
  returns: v.object({ activeTournaments: v.number(), registeredCompetitors: v.number(), completedMatches: v.number() }),
  handler: async (ctx) => {
    const [registrationOpen, ongoing, participants, completed] = await Promise.all([
      ctx.db.query("tournaments").withIndex("by_status", (q) => q.eq("status", "Registration Open")).take(1000),
      ctx.db.query("tournaments").withIndex("by_status", (q) => q.eq("status", "Ongoing")).take(1000),
      ctx.db.query("participants").take(4000),
      ctx.db.query("matches").take(4000),
    ]);
    if (participants.length === 4000 || completed.length === 4000) throw new Error("Dataset exceeds the one-shot rebuild limit; use a batched migration.");
    const values = {
      activeTournaments: registrationOpen.length + ongoing.length,
      registeredCompetitors: participants.length,
      completedMatches: completed.filter((match) => match.status === "Completed").length,
    };
    const existing = await ctx.db.query("platformStats").withIndex("by_key", (q) => q.eq("key", "global")).unique();
    if (existing) await ctx.db.patch(existing._id, { ...values, updatedAt: Date.now() });
    else await ctx.db.insert("platformStats", { key: "global", ...values, updatedAt: Date.now() });
    return values;
  },
});

export const auditIntegrity = internalQuery({
  args: {},
  returns: v.object({
    orphanParticipants: v.number(), orphanGroups: v.number(), orphanMatches: v.number(),
    crossTournamentMatches: v.number(), orphanRegistrations: v.number(), orphanAnnouncements: v.number(),
  }),
  handler: async (ctx) => {
    const [tournaments, participants, groups, matches, registrations, announcements] = await Promise.all([
      ctx.db.query("tournaments").take(1000), ctx.db.query("participants").take(4000),
      ctx.db.query("groups").take(1000), ctx.db.query("matches").take(4000),
      ctx.db.query("registrations").take(4000), ctx.db.query("announcements").take(1000),
    ]);
    if ([tournaments.length, groups.length, announcements.length].includes(1000) || [participants.length, matches.length, registrations.length].includes(4000)) {
      throw new Error("Dataset exceeds the one-shot integrity audit limit; use a paginated audit.");
    }
    const tournamentIds = new Set(tournaments.map((row) => row._id));
    const participantById = new Map(participants.map((row) => [row._id, row]));
    const groupById = new Map(groups.map((row) => [row._id, row]));
    return {
      orphanParticipants: participants.filter((row) => !tournamentIds.has(row.tournamentId)).length,
      orphanGroups: groups.filter((row) => !tournamentIds.has(row.tournamentId)).length,
      orphanMatches: matches.filter((row) => !tournamentIds.has(row.tournamentId) || !participantById.has(row.player1Id) || !participantById.has(row.player2Id)).length,
      crossTournamentMatches: matches.filter((row) => participantById.get(row.player1Id)?.tournamentId !== row.tournamentId || participantById.get(row.player2Id)?.tournamentId !== row.tournamentId || (row.groupId && groupById.get(row.groupId)?.tournamentId !== row.tournamentId)).length,
      orphanRegistrations: registrations.filter((row) => !tournamentIds.has(row.tournamentId) || (row.participantId && !participantById.has(row.participantId))).length,
      orphanAnnouncements: announcements.filter((row) => !tournamentIds.has(row.tournamentId)).length,
    };
  },
});
