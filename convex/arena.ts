import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { gameId } from "./schema";
import { rulesFor } from "./gameModules";
import { competitorRankingKey, insertCompetitor } from "./participants";
import { requireTournamentAdmin } from "./tournamentAuth";
import { requireIdentity } from "./model/auth";

export const listRankings = query({
  args: { gameId, limit: v.optional(v.number()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 50, 100);
    const [rankings, participants] = await Promise.all([
      ctx.db.query("rankings").withIndex("by_gameId_and_rating", (q) => q.eq("gameId", args.gameId)).order("desc").take(limit),
      ctx.db.query("participants").withIndex("by_gameId", (q) => q.eq("gameId", args.gameId)).order("desc").take(500),
    ]);
    const knownKeys = new Set(rankings.map((ranking) => ranking.competitorKey));
    const provisionalKeys = new Set<string>();
    const provisional = [];
    for (const participant of participants) {
      const competitorKey = competitorRankingKey(participant);
      if (knownKeys.has(competitorKey) || provisionalKeys.has(competitorKey)) continue;
      provisionalKeys.add(competitorKey);
      provisional.push({
        _id: participant._id,
        _creationTime: participant._creationTime,
        gameId: args.gameId,
        competitorKey,
        displayName: participant.name,
        kind: participant.kind ?? (args.gameId === "valorant" ? "team" : "player"),
        slug: participant.slug,
        countryCode: participant.countryCode,
        rating: 1000,
        wins: 0,
        losses: 0,
        tournamentsWon: 0,
        updatedAt: participant._creationTime,
      });
    }
    return [...rankings, ...provisional]
      .sort((a, b) => b.rating - a.rating || b.wins - a.wins || b.updatedAt - a.updatedAt)
      .slice(0, limit);
  },
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
    const { ownerToken: _ownerToken, ...publicTeam } = team;
    const [members, tournamentEntries] = await Promise.all([
      ctx.db.query("teamMembers").withIndex("by_teamId", (q) => q.eq("teamId", team._id)).take(32),
      ctx.db.query("participants").withIndex("by_teamId", (q) => q.eq("teamId", team._id)).take(100),
    ]);
    return {
      ...publicTeam,
      members,
      tournamentEntries: tournamentEntries.map(({ userId: _userId, ...entry }) => entry),
    };
  },
});

export const getPlayer = query({
  args: { username: v.string() },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const player = await ctx.db.query("participants").withIndex("by_slug", (q) => q.eq("slug", args.username)).first();
    if (!player) return null;
    const { userId: _userId, ...publicPlayer } = player;
    const [home, away] = await Promise.all([
      ctx.db.query("matches").withIndex("by_player1Id", (q) => q.eq("player1Id", player._id)).order("desc").take(50),
      ctx.db.query("matches").withIndex("by_player2Id", (q) => q.eq("player2Id", player._id)).order("desc").take(50),
    ]);
    const matches = [...home, ...away].sort((a, b) => b._creationTime - a._creationTime).slice(0, 50);
    const completed = matches.filter((match) => match.status === "Completed");
    const wins = completed.filter((match) => match.winnerId === player._id).length;
    return { ...publicPlayer, matches, wins, losses: completed.length - wins, winRate: completed.length ? Math.round((wins / completed.length) * 100) : 0 };
  },
});

export const register = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    applicantName: v.string(),
    applicantEmail: v.string(),
    phoneNumber: v.string(),
    teamId: v.optional(v.id("teams")),
    countryCode: v.optional(v.string()),
    acceptedRules: v.boolean(),
    captainName: v.optional(v.string()),
    roster: v.optional(v.array(v.object({
      displayName: v.string(),
      role: v.union(v.literal("captain"), v.literal("player"), v.literal("substitute"), v.literal("coach")),
      countryCode: v.optional(v.string()),
    }))),
  },
  returns: v.id("registrations"),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const tournament = await ctx.db.get("tournaments", args.tournamentId);
    if (!tournament || tournament.registrationEnabled === false || ["Draft", "Completed", "Cancelled"].includes(tournament.status)) throw new ConvexError("Registration is not available for this tournament.");
    if (!args.acceptedRules) throw new ConvexError("You must accept the tournament rules.");
    
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    const applicantName = (args.applicantName || currentUser?.gamerTag || currentUser?.name || "").trim();
    const applicantEmail = (args.applicantEmail || currentUser?.email || identity.email || "").trim().toLowerCase();
    const phoneNumber = (args.phoneNumber || currentUser?.phone || "").trim();
    const countryCode = (args.countryCode || currentUser?.countryCode || "").trim().toUpperCase();

    if (!applicantName) throw new ConvexError("Your name is required.");
    if (!countryCode) throw new ConvexError("Choose your country.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) throw new ConvexError("Enter a valid email address.");
    if (phoneNumber.replace(/\D/g, "").length < 7) throw new ConvexError("Enter a valid phone number.");
    
    const selectedGame = tournament.gameId ?? "efootball";
    if (tournament.maxSlots) {
      const participants = await ctx.db.query("participants").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(tournament.maxSlots);
      if (participants.length >= tournament.maxSlots) throw new ConvexError("Registration is not available because this tournament is full.");
    }
    const rules = rulesFor(selectedGame);
    const priorRegistration = await ctx.db
      .query("registrations")
      .withIndex("by_ownerToken_and_tournamentId", (q) =>
        q.eq("ownerToken", identity.tokenIdentifier).eq("tournamentId", args.tournamentId),
      )
      .first();
    if (priorRegistration && priorRegistration.status !== "rejected") {
      throw new ConvexError("You are already registered for this tournament.");
    }
    const roster = args.roster ?? currentUser?.defaultRoster ?? [];
    if (selectedGame === "valorant") {
      const starters = roster.filter((member) => member.role === "captain" || member.role === "player");
      if (starters.length !== rules.teamSize) throw new ConvexError(`VALORANT registration requires exactly ${rules.teamSize} starting players.`);
      if (!args.captainName || !roster.some((member) => member.role === "captain" && member.displayName === args.captainName)) throw new ConvexError("The captain must be included in the roster.");
    }
    const registrationId = await ctx.db.insert("registrations", {
      userId: currentUser?._id,
      ownerToken: identity.tokenIdentifier,
      tournamentId: args.tournamentId,
      applicantName,
      applicantEmail,
      phoneNumber,
      teamId: args.teamId,
      countryCode,
      acceptedRules: args.acceptedRules,
      captainName: args.captainName,
      gameId: selectedGame,
      competitorKind: rules.competitorKind,
      status: "approved",
      createdAt: Date.now(),
    });
    for (const member of roster) await ctx.db.insert("registrationRoster", { registrationId, ...member });
    const participantId = await insertCompetitor(ctx, {
      userId: currentUser?._id,
      tournamentId: args.tournamentId,
      name: applicantName,
      gameId: selectedGame,
      countryCode,
      captain: args.captainName,
      teamId: args.teamId,
      roster,
    });
    await ctx.db.patch(registrationId, { participantId });
    const invitation = await ctx.db
      .query("tournamentInvites")
      .withIndex("by_tournamentId_and_email", (q) =>
        q.eq("tournamentId", args.tournamentId).eq("email", applicantEmail),
      )
      .unique();
    if (invitation?.status === "pending") {
      await ctx.db.patch(invitation._id, { status: "accepted", inviteeUserId: currentUser?._id });
    }
    return registrationId;
  },
});

export const quickRegister = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    applicantName: v.optional(v.string()),
    applicantEmail: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    captainName: v.optional(v.string()),
    roster: v.optional(v.array(v.object({
      displayName: v.string(),
      role: v.union(v.literal("captain"), v.literal("player"), v.literal("substitute"), v.literal("coach")),
      countryCode: v.optional(v.string()),
    }))),
  },
  returns: v.id("registrations"),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const tournament = await ctx.db.get("tournaments", args.tournamentId);
    if (!tournament || tournament.registrationEnabled === false || ["Draft", "Completed", "Cancelled"].includes(tournament.status)) {
      throw new ConvexError("Registration is not available for this tournament.");
    }
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    const applicantName = (args.applicantName || currentUser?.gamerTag || currentUser?.name || identity.name || "").trim();
    const rawEmail = args.applicantEmail || currentUser?.email || identity.email || (identity.subject ? `${identity.subject.replace(/[^a-zA-Z0-9._-]/g, '')}@player.powerwex.com` : "");
    const applicantEmail = rawEmail.trim().toLowerCase();
    const phoneNumber = (args.phoneNumber || currentUser?.phone || "").trim();
    const countryCode = (args.countryCode || currentUser?.countryCode || "").trim().toUpperCase();

    if (!applicantName) throw new ConvexError("Please set up your player name or gamer tag in your profile.");
    if (!countryCode) throw new ConvexError("Please choose your country in your profile.");
    if (!applicantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicantEmail)) throw new ConvexError("A valid email address is required.");
    if (phoneNumber.replace(/\D/g, "").length < 7) throw new ConvexError("A valid contact phone number is required in your profile.");

    const selectedGame = tournament.gameId ?? "efootball";
    if (tournament.maxSlots) {
      const participants = await ctx.db.query("participants").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(tournament.maxSlots);
      if (participants.length >= tournament.maxSlots) throw new ConvexError("Registration is not available because this tournament is full.");
    }

    const priorRegistration = await ctx.db
      .query("registrations")
      .withIndex("by_ownerToken_and_tournamentId", (q) =>
        q.eq("ownerToken", identity.tokenIdentifier).eq("tournamentId", args.tournamentId),
      )
      .first();
    if (priorRegistration && priorRegistration.status !== "rejected") {
      throw new ConvexError("You are already registered for this tournament.");
    }

    const rules = rulesFor(selectedGame);
    let roster = args.roster ?? currentUser?.defaultRoster ?? [];
    let captainName = args.captainName ?? currentUser?.captainName ?? (selectedGame === "valorant" ? applicantName : undefined);

    if (selectedGame === "valorant") {
      if (!roster.length) {
        roster = [
          { displayName: captainName || applicantName, role: "captain" },
          { displayName: `${applicantName} Mate 2`, role: "player" },
          { displayName: `${applicantName} Mate 3`, role: "player" },
          { displayName: `${applicantName} Mate 4`, role: "player" },
          { displayName: `${applicantName} Mate 5`, role: "player" },
        ];
      }
      const starters = roster.filter((member) => member.role === "captain" || member.role === "player");
      if (starters.length !== rules.teamSize) throw new ConvexError(`VALORANT registration requires exactly ${rules.teamSize} starting players.`);
      if (!captainName) captainName = roster.find((m) => m.role === "captain")?.displayName || applicantName;
    }

    const registrationId = await ctx.db.insert("registrations", {
      userId: currentUser?._id,
      ownerToken: identity.tokenIdentifier,
      tournamentId: args.tournamentId,
      applicantName,
      applicantEmail,
      phoneNumber,
      countryCode,
      acceptedRules: true,
      captainName,
      gameId: selectedGame,
      competitorKind: rules.competitorKind,
      status: "approved",
      createdAt: Date.now(),
    });
    for (const member of roster) await ctx.db.insert("registrationRoster", { registrationId, ...member });
    const participantId = await insertCompetitor(ctx, {
      userId: currentUser?._id,
      tournamentId: args.tournamentId,
      name: applicantName,
      gameId: selectedGame,
      countryCode,
      captain: captainName,
      roster,
    });
    await ctx.db.patch(registrationId, { participantId });
    return registrationId;
  },
});

export const listRegistrations = query({
  args: { tournamentId: v.id("tournaments"), adminCode: v.optional(v.string()) },
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    await requireTournamentAdmin(ctx, args.tournamentId, args.adminCode);
    const registrations = await ctx.db.query("registrations").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).order("desc").take(100);
    return await Promise.all(registrations.map(async (registration) => ({
      ...registration,
      roster: await ctx.db.query("registrationRoster").withIndex("by_registrationId", (q) => q.eq("registrationId", registration._id)).take(16),
    })));
  },
});

export const reviewRegistration = mutation({
  args: { registrationId: v.id("registrations"), decision: v.union(v.literal("approved"), v.literal("rejected")), adminCode: v.optional(v.string()) },
  returns: v.union(v.id("participants"), v.null()),
  handler: async (ctx, args) => {
    const registration = await ctx.db.get("registrations", args.registrationId);
    if (!registration) throw new ConvexError("Registration not found.");
    await requireTournamentAdmin(ctx, registration.tournamentId, args.adminCode);
    if (registration.participantId) return registration.participantId;
    if (args.decision === "rejected") {
      await ctx.db.patch(registration._id, { status: "rejected" });
      return null;
    }
    const roster = await ctx.db.query("registrationRoster").withIndex("by_registrationId", (q) => q.eq("registrationId", registration._id)).take(16);
    const participantId = await insertCompetitor(ctx, {
      userId: registration.userId,
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
  args: { tournamentId: v.id("tournaments"), title: v.string(), body: v.string(), pinned: v.boolean(), adminCode: v.optional(v.string()) },
  returns: v.id("announcements"),
  handler: async (ctx, args) => { await requireTournamentAdmin(ctx, args.tournamentId, args.adminCode); const { adminCode: _adminCode, ...announcement } = args; return await ctx.db.insert("announcements", { ...announcement, createdAt: Date.now() }); },
});

export const reportDispute = mutation({
  args: { matchId: v.id("matches"), reporterName: v.string(), reason: v.string(), evidenceUrl: v.optional(v.string()) },
  returns: v.id("disputes"),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const match = await ctx.db.get("matches", args.matchId);
    if (!match) throw new ConvexError("Match not found.");
    const tournament = await ctx.db.get("tournaments", match.tournamentId);
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_ownerToken", (q) => q.eq("ownerToken", identity.tokenIdentifier))
      .take(100);
    const isOrganizer = tournament?.ownerToken === identity.tokenIdentifier;
    const isCompetitor = registrations.some((registration) => registration.participantId === match.player1Id || registration.participantId === match.player2Id);
    if (!isOrganizer && !isCompetitor) throw new ConvexError("Only a competitor in this match or the organizer can report a dispute.");
    const id = await ctx.db.insert("disputes", { ...args, reporterToken: identity.tokenIdentifier, status: "open", createdAt: Date.now() });
    await ctx.db.patch(args.matchId, { status: "Disputed" });
    return id;
  },
});

export const listMyRegistrations = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const registrations = await ctx.db
      .query("registrations")
      .withIndex("by_ownerToken", (q) => q.eq("ownerToken", identity.tokenIdentifier))
      .order("desc")
      .take(100);
    return await Promise.all(registrations.map(async (registration) => ({
      ...registration,
      roster: await ctx.db.query("registrationRoster").withIndex("by_registrationId", (q) => q.eq("registrationId", registration._id)).take(16),
    })));
  },
});
