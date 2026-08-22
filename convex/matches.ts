import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { gameId, matchStatus, valorantMatchMode } from "./schema";
import { isKnockoutFormat, isKnockoutMatch, rulesFor, type GameModuleId } from "./gameModules";
import type { Doc, Id } from "./_generated/dataModel";
import { requireTournamentAdmin } from "./tournamentAuth";
import { competitorRankingKey } from "./participants";
import { parseYouTubeVideoId } from "./model/youtube";

type DbCtx = QueryCtx | MutationCtx;

function roundName(competitorCount: number) {
  if (competitorCount === 2) return "Final";
  if (competitorCount === 4) return "Semi-Final";
  if (competitorCount === 8) return "Quarter-Final";
  if (competitorCount === 16) return "Round of 16";
  if (competitorCount === 32) return "Round of 32";
  return `Round of ${competitorCount}`;
}

function isPowerOfTwo(value: number) {
  return value >= 2 && (value & (value - 1)) === 0;
}

async function tournamentData(ctx: DbCtx, tournamentId: Id<"tournaments">) {
  const [tournament, participants, matches, stats] = await Promise.all([
    ctx.db.get("tournaments", tournamentId),
    ctx.db.query("participants").withIndex("by_tournamentId", (q) => q.eq("tournamentId", tournamentId)).take(128),
    ctx.db.query("matches").withIndex("by_tournamentId", (q) => q.eq("tournamentId", tournamentId)).take(512),
    ctx.db.query("matchStats").withIndex("by_tournamentId", (q) => q.eq("tournamentId", tournamentId)).take(1024),
  ]);
  if (!tournament) throw new Error("Tournament not found.");
  return { tournament, participants, matches, stats };
}

function calculateStandings(
  participants: Doc<"participants">[],
  matches: Doc<"matches">[],
  stats: Doc<"matchStats">[],
  selectedGame: GameModuleId,
) {
  return participants.map((participant) => {
    let played = 0, won = 0, drawn = 0, lost = 0, scored = 0, conceded = 0, roundsWon = 0, roundsLost = 0;
    const form: string[] = [];
    for (const match of matches) {
      if (match.status !== "Completed" || match.player1Score === undefined || match.player2Score === undefined) continue;
      const isFirst = match.player1Id === participant._id;
      if (!isFirst && match.player2Id !== participant._id) continue;
      const own = isFirst ? match.player1Score : match.player2Score;
      const other = isFirst ? match.player2Score : match.player1Score;
      played += 1; scored += own; conceded += other;
      if (own > other) { won += 1; form.push("W"); }
      else if (own === other) { drawn += 1; form.push("D"); }
      else { lost += 1; form.push("L"); }
      if (selectedGame === "valorant") {
        const ownStat = stats.find((stat) => stat.matchId === match._id && stat.participantId === participant._id);
        const opponentId = isFirst ? match.player2Id : match.player1Id;
        const opponentStat = stats.find((stat) => stat.matchId === match._id && stat.participantId === opponentId);
        roundsWon += ownStat?.roundsWon ?? 0;
        roundsLost += opponentStat?.roundsWon ?? 0;
      }
    }
    const mapDifferential = scored - conceded;
    const roundDifferential = roundsWon - roundsLost;
    return {
      ...participant, played, won, drawn, lost, scored, conceded,
      roundsWon, roundsLost, mapDifferential, roundDifferential,
      differential: selectedGame === "valorant" ? roundDifferential : mapDifferential,
      points: selectedGame === "efootball" ? won * 3 + drawn : won,
      form: form.slice(-5),
    };
  }).sort((a, b) => b.points - a.points || b.differential - a.differential || b.mapDifferential - a.mapDifferential || b.scored - a.scored);
}

async function insertRoundRobin(ctx: MutationCtx, tournament: Doc<"tournaments">, participants: Doc<"participants">[], groupId?: Id<"groups">) {
  if (participants.length < 2) throw new Error("At least two competitors are required.");
  let count = 0;
  for (let i = 0; i < participants.length; i += 1) {
    for (let j = i + 1; j < participants.length; j += 1) {
      await ctx.db.insert("matches", {
        tournamentId: tournament._id, groupId, gameId: tournament.gameId ?? "efootball",
        player1Id: participants[i]._id, player2Id: participants[j]._id,
        status: "Scheduled", date: tournament.startDate,
        round: groupId ? "Group Stage" : "League", matchMode: tournament.matchMode,
        bestOf: tournament.bestOf ?? rulesFor(tournament.gameId).defaultBestOf,
      });
      count += 1;
    }
  }
  return count;
}

async function insertBracketRound(ctx: MutationCtx, tournament: Doc<"tournaments">, participants: Doc<"participants">[], bracketRound: number) {
  if (!isPowerOfTwo(participants.length)) throw new Error("Elimination brackets require 2, 4, 8, 16, or 32 approved competitors.");
  const seeded = [...participants].sort((a, b) => (a.seed ?? 999) - (b.seed ?? 999));
  const label = tournament.format === "Double Elimination" && bracketRound > 1 ? `Elimination Round ${bracketRound}` : roundName(seeded.length);
  for (let index = 0; index < seeded.length / 2; index += 1) {
    const first = seeded[index];
    const second = seeded[seeded.length - 1 - index];
    await ctx.db.insert("matches", {
      tournamentId: tournament._id, gameId: tournament.gameId ?? "efootball",
      player1Id: first._id, player2Id: second._id, status: "Scheduled",
      date: tournament.endDate ?? tournament.startDate, round: label,
      bracketRound, bracketPosition: index, bracketKind: bracketRound === 1 ? "upper" : "lower", matchMode: tournament.matchMode,
      bestOf: tournament.bestOf ?? rulesFor(tournament.gameId).defaultBestOf,
    });
  }
  return seeded.length / 2;
}

async function insertDoubleEliminationWave(
  ctx: MutationCtx,
  tournament: Doc<"tournaments">,
  participants: Doc<"participants">[],
  losses: Map<Id<"participants">, number>,
  bracketRound: number,
) {
  const sorted = [...participants].sort((a, b) => (losses.get(a._id) ?? 0) - (losses.get(b._id) ?? 0) || (a.seed ?? 999) - (b.seed ?? 999));
  let created = 0;
  for (let index = 0; index + 1 < sorted.length; index += 2) {
    const first = sorted[index], second = sorted[index + 1];
    const firstLosses = losses.get(first._id) ?? 0, secondLosses = losses.get(second._id) ?? 0;
    await ctx.db.insert("matches", {
      tournamentId: tournament._id, gameId: tournament.gameId ?? "efootball",
      player1Id: first._id, player2Id: second._id, status: "Scheduled",
      date: tournament.endDate ?? tournament.startDate,
      round: sorted.length === 2 ? "Grand Final" : `Elimination Round ${bracketRound}`,
      bracketRound, bracketPosition: created, matchMode: tournament.matchMode,
      bracketKind: sorted.length === 2 ? "grand_final" : firstLosses === 0 && secondLosses === 0 ? "upper" : "lower",
      bestOf: tournament.bestOf ?? rulesFor(tournament.gameId).defaultBestOf,
    });
    created += 1;
  }
  return created;
}

async function updateRating(ctx: MutationCtx, participant: Doc<"participants">, game: GameModuleId, score: number, expected: number) {
  const key = competitorRankingKey(participant);
  const stable = await ctx.db.query("rankings").withIndex("by_competitorKey", (q) => q.eq("competitorKey", key)).unique();
  const existing = stable ?? await ctx.db.query("rankings").withIndex("by_competitorKey", (q) => q.eq("competitorKey", participant._id)).unique();
  const oldRating = existing?.rating ?? 1000;
  const rating = Math.round(oldRating + 32 * (score - expected));
  const patch = {
    gameId: game,
    competitorKey: key,
    displayName: participant.name,
    kind: participant.kind ?? (game === "valorant" ? "team" as const : "player" as const),
    slug: participant.slug,
    countryCode: participant.countryCode,
    rating,
    wins: (existing?.wins ?? 0) + (score === 1 ? 1 : 0),
    losses: (existing?.losses ?? 0) + (score === 0 ? 1 : 0),
    tournamentsWon: existing?.tournamentsWon ?? 0,
    updatedAt: Date.now(),
  };
  if (existing) await ctx.db.replace(existing._id, patch);
  else await ctx.db.insert("rankings", patch);
}

async function rateResult(ctx: MutationCtx, first: Doc<"participants">, second: Doc<"participants">, game: GameModuleId, firstScore: number, secondScore: number) {
  const [firstRank, secondRank] = await Promise.all([
    ctx.db.query("rankings").withIndex("by_competitorKey", (q) => q.eq("competitorKey", competitorRankingKey(first))).unique(),
    ctx.db.query("rankings").withIndex("by_competitorKey", (q) => q.eq("competitorKey", competitorRankingKey(second))).unique(),
  ]);
  const rating1 = firstRank?.rating ?? 1000, rating2 = secondRank?.rating ?? 1000;
  const expected1 = 1 / (1 + 10 ** ((rating2 - rating1) / 400));
  const actual1 = firstScore === secondScore ? 0.5 : firstScore > secondScore ? 1 : 0;
  await updateRating(ctx, first, game, actual1, expected1);
  await updateRating(ctx, second, game, 1 - actual1, 1 - expected1);
}

async function crownChampion(ctx: MutationCtx, tournament: Doc<"tournaments">, winnerId: Id<"participants">) {
  const existingChampion = await ctx.db.query("champions").withIndex("by_tournamentId", (q) => q.eq("tournamentId", tournament._id)).unique();
  if (existingChampion) return;
  const winner = await ctx.db.get("participants", winnerId);
  if (!winner) return;
  const selectedGame = tournament.gameId ?? "efootball";
  await ctx.db.insert("champions", {
    tournamentId: tournament._id, gameId: selectedGame, tournamentName: tournament.name,
    winnerName: winner.name, winnerSlug: winner.slug,
    winnerKind: winner.kind ?? (selectedGame === "valorant" ? "team" : "player"),
    countryCode: winner.countryCode, completedAt: Date.now(),
  });
  const ranking = await ctx.db.query("rankings").withIndex("by_competitorKey", (q) => q.eq("competitorKey", competitorRankingKey(winner))).unique();
  if (ranking) await ctx.db.patch(ranking._id, { tournamentsWon: ranking.tournamentsWon + 1, updatedAt: Date.now() });
  await ctx.db.patch(tournament._id, { status: "Completed", currentStage: "Champion" });
}

async function advanceBracket(ctx: MutationCtx, tournament: Doc<"tournaments">, completedMatch: Doc<"matches">) {
  if (completedMatch.bracketRound === undefined) return;
  const matches = await ctx.db.query("matches").withIndex("by_tournamentId", (q) => q.eq("tournamentId", tournament._id)).take(512);
  const current = matches.filter((match) => match.bracketRound === completedMatch.bracketRound);
  if (current.some((match) => match.status !== "Completed")) return;
  if (matches.some((match) => (match.bracketRound ?? 0) > completedMatch.bracketRound!)) return;

  if (tournament.format === "Double Elimination") {
    const participants = await ctx.db.query("participants").withIndex("by_tournamentId", (q) => q.eq("tournamentId", tournament._id)).take(64);
    const losses = new Map<Id<"participants">, number>(participants.map((participant) => [participant._id, 0]));
    for (const match of matches.filter((row) => row.bracketRound !== undefined && row.status === "Completed")) {
      if (!match.winnerId) continue;
      const loser = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
      losses.set(loser, (losses.get(loser) ?? 0) + 1);
    }
    const active = participants.filter((participant) => (losses.get(participant._id) ?? 0) < 2).sort((a, b) => (losses.get(a._id) ?? 0) - (losses.get(b._id) ?? 0) || (a.seed ?? 999) - (b.seed ?? 999));
    if (active.length === 1) { await crownChampion(ctx, tournament, active[0]._id); return; }
    await insertDoubleEliminationWave(ctx, tournament, active, losses, completedMatch.bracketRound + 1);
    return;
  }

  const winners = current.map((match) => match.winnerId).filter((id): id is Id<"participants"> => Boolean(id));
  if (winners.length === 1) { await crownChampion(ctx, tournament, winners[0]); return; }
  const participants = (await Promise.all(winners.map((id) => ctx.db.get("participants", id)))).filter((row): row is Doc<"participants"> => Boolean(row));
  await insertBracketRound(ctx, tournament, participants, completedMatch.bracketRound + 1);
}

export const getByTournament = query({
  args: { tournamentId: v.id("tournaments") }, returns: v.array(v.any()),
  handler: async (ctx, args) => await ctx.db.query("matches").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(512),
});

export const getByGroup = query({
  args: { groupId: v.id("groups") }, returns: v.array(v.any()),
  handler: async (ctx, args) => await ctx.db.query("matches").withIndex("by_groupId", (q) => q.eq("groupId", args.groupId)).take(256),
});

export const getById = query({
  args: { id: v.id("matches") }, returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const match = await ctx.db.get("matches", args.id); if (!match) return null;
    const [tournament, player1, player2, stats] = await Promise.all([
      ctx.db.get("tournaments", match.tournamentId), ctx.db.get("participants", match.player1Id), ctx.db.get("participants", match.player2Id),
      ctx.db.query("matchStats").withIndex("by_matchId", (q) => q.eq("matchId", match._id)).take(32),
    ]);
    return { ...match, tournament, player1, player2, stats, gameId: match.gameId ?? tournament?.gameId ?? "efootball" };
  },
});

export const getOverlayData = query({
  args: { tournamentId: v.id("tournaments"), matchId: v.optional(v.id("matches")) },
  returns: v.union(v.any(), v.null()),
  handler: async (ctx, args) => {
    const { tournament, participants, matches, stats } = await tournamentData(ctx, args.tournamentId);
    const selectedGame = (tournament.gameId ?? "efootball") as GameModuleId;
    const participantById = new Map(participants.map((participant) => [participant._id, participant]));
    const requested = args.matchId ? matches.find((match) => match._id === args.matchId) : undefined;
    const orderedMatches = [...matches].sort((first, second) => first.date.localeCompare(second.date) || first._creationTime - second._creationTime);
    const selectedMatch = requested
      ?? orderedMatches.find((match) => match.status === "Live")
      ?? orderedMatches.find((match) => match.status === "Scheduled")
      ?? [...orderedMatches].reverse().find((match) => match.status === "Completed")
      ?? null;
    const { adminCode: _adminCode, ownerToken: _ownerToken, ...publicTournament } = tournament;
    return {
      tournament: { ...publicTournament, gameId: selectedGame },
      match: selectedMatch,
      player1: selectedMatch ? participantById.get(selectedMatch.player1Id) ?? null : null,
      player2: selectedMatch ? participantById.get(selectedMatch.player2Id) ?? null : null,
      matchStats: selectedMatch ? stats.filter((stat) => stat.matchId === selectedMatch._id) : [],
      standings: calculateStandings(
        participants,
        matches.filter((match) => match.bracketRound === undefined),
        stats,
        selectedGame,
      ),
    };
  },
});

export const create = mutation({
  args: { tournamentId: v.id("tournaments"), adminCode: v.optional(v.string()), groupId: v.optional(v.id("groups")), gameId: v.optional(gameId), matchMode: v.optional(valorantMatchMode), player1Id: v.id("participants"), player2Id: v.id("participants"), status: matchStatus, date: v.string(), round: v.optional(v.string()), bracketRound: v.optional(v.number()), bracketPosition: v.optional(v.number()), bracketKind: v.optional(v.union(v.literal("upper"), v.literal("lower"), v.literal("grand_final"))), bestOf: v.optional(v.number()) },
  returns: v.id("matches"),
  handler: async (ctx, args) => {
    await requireTournamentAdmin(ctx, args.tournamentId, args.adminCode);
    const [first, second, group] = await Promise.all([
      ctx.db.get("participants", args.player1Id),
      ctx.db.get("participants", args.player2Id),
      args.groupId ? ctx.db.get("groups", args.groupId) : null,
    ]);
    if (!first || !second || first.tournamentId !== args.tournamentId || second.tournamentId !== args.tournamentId) throw new Error("Competitors must belong to this tournament.");
    if (args.groupId && (!group || group.tournamentId !== args.tournamentId)) throw new Error("Group does not belong to this tournament.");
    const { adminCode: _adminCode, ...match } = args;
    return await ctx.db.insert("matches", match);
  },
});

export const setStatus = mutation({
  args: { matchId: v.id("matches"), status: matchStatus, adminCode: v.optional(v.string()) }, returns: v.null(),
  handler: async (ctx, args) => { const match = await ctx.db.get("matches", args.matchId); if (!match) throw new Error("Match not found."); await requireTournamentAdmin(ctx, match.tournamentId, args.adminCode); await ctx.db.patch(args.matchId, { status: args.status }); return null; },
});

export const setYouTubeVideo = mutation({
  args: { matchId: v.id("matches"), videoUrl: v.string(), adminCode: v.optional(v.string()) },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const match = await ctx.db.get("matches", args.matchId);
    if (!match) throw new Error("Match not found.");
    await requireTournamentAdmin(ctx, match.tournamentId, args.adminCode);
    const youtubeVideoId = parseYouTubeVideoId(args.videoUrl);
    await ctx.db.patch(match._id, { youtubeVideoId: youtubeVideoId ?? undefined });
    return youtubeVideoId;
  },
});

export const updateScore = mutation({
  args: { matchId: v.id("matches"), player1Score: v.number(), player2Score: v.number(), adminCode: v.optional(v.string()) }, returns: v.null(),
  handler: async (ctx, args) => {
    if (![args.player1Score, args.player2Score].every((score) => Number.isInteger(score) && score >= 0)) throw new Error("Scores must be positive whole numbers.");
    const match = await ctx.db.get("matches", args.matchId); if (!match) throw new Error("Match not found.");
    await requireTournamentAdmin(ctx, match.tournamentId, args.adminCode);
    const tournament = await ctx.db.get("tournaments", match.tournamentId); if (!tournament) throw new Error("Tournament not found.");
    const selectedGame = (match.gameId ?? tournament.gameId ?? "efootball") as GameModuleId;
    const rules = rulesFor(selectedGame);
    const knockout = isKnockoutMatch(match.round, match.bracketRound) || isKnockoutFormat(tournament.format);
    if (args.player1Score === args.player2Score && (!rules.allowsDrawsInLeague || knockout)) throw new Error(`${rules.name} ${knockout ? "knockout " : ""}matches cannot end in a draw.`);
    if (selectedGame === "valorant") {
      const bestOf = match.bestOf ?? tournament.bestOf ?? rules.defaultBestOf;
      const mapsToWin = Math.floor(bestOf / 2) + 1;
      if (Math.max(args.player1Score, args.player2Score) !== mapsToWin || Math.min(args.player1Score, args.player2Score) >= mapsToWin) throw new Error(`A best-of-${bestOf} VALORANT result must be won with ${mapsToWin} maps.`);
    }
    const winnerId = args.player1Score === args.player2Score ? undefined : args.player1Score > args.player2Score ? match.player1Id : match.player2Id;
    const wasCompleted = match.status === "Completed";
    await ctx.db.patch(args.matchId, { player1Score: args.player1Score, player2Score: args.player2Score, winnerId, status: "Completed" });
    if (!wasCompleted) {
      const [first, second] = await Promise.all([ctx.db.get("participants", match.player1Id), ctx.db.get("participants", match.player2Id)]);
      if (first && second) await rateResult(ctx, first, second, selectedGame, args.player1Score, args.player2Score);
    }
    if (winnerId && match.bracketRound !== undefined) await advanceBracket(ctx, tournament, { ...match, player1Score: args.player1Score, player2Score: args.player2Score, winnerId, status: "Completed" });
    return null;
  },
});

export const upsertStats = mutation({
  args: { matchId: v.id("matches"), participantId: v.id("participants"), adminCode: v.optional(v.string()), gameId, goals: v.optional(v.number()), possession: v.optional(v.number()), shots: v.optional(v.number()), cards: v.optional(v.number()), mapsWon: v.optional(v.number()), roundsWon: v.optional(v.number()), kills: v.optional(v.number()), deaths: v.optional(v.number()), assists: v.optional(v.number()), acs: v.optional(v.number()) },
  returns: v.id("matchStats"),
  handler: async (ctx, args) => {
    const match = await ctx.db.get("matches", args.matchId); if (!match) throw new Error("Match not found.");
    await requireTournamentAdmin(ctx, match.tournamentId, args.adminCode);
    const participant = await ctx.db.get("participants", args.participantId);
    if (!participant || participant.tournamentId !== match.tournamentId || (participant._id !== match.player1Id && participant._id !== match.player2Id)) throw new Error("Competitor does not belong to this match.");
    const { matchId, participantId, adminCode: _adminCode, gameId: selectedGame, ...values } = args;
    const existing = (await ctx.db.query("matchStats").withIndex("by_matchId", (q) => q.eq("matchId", matchId)).take(32)).find((row) => row.participantId === participantId);
    const data = { matchId, participantId, tournamentId: match.tournamentId, gameId: selectedGame, ...values };
    if (existing) { await ctx.db.patch(existing._id, data); return existing._id; }
    return await ctx.db.insert("matchStats", data);
  },
});

export const getStandings = query({
  args: { tournamentId: v.id("tournaments") }, returns: v.object({ gameId, rows: v.array(v.any()) }),
  handler: async (ctx, args) => {
    const { tournament, participants, matches, stats } = await tournamentData(ctx, args.tournamentId);
    const selectedGame = (tournament.gameId ?? "efootball") as GameModuleId;
    return { gameId: selectedGame, rows: calculateStandings(participants, matches.filter((match) => match.bracketRound === undefined), stats, selectedGame) };
  },
});

export const getStatistics = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.object({ gameId, completedMatches: v.number(), totalScore: v.number(), leaders: v.array(v.any()), totals: v.any() }),
  handler: async (ctx, args) => {
    const { tournament, participants, matches, stats } = await tournamentData(ctx, args.tournamentId);
    const selectedGame = (tournament.gameId ?? "efootball") as GameModuleId;
    const completed = matches.filter((match) => match.status === "Completed");
    const leaders = participants.map((participant) => {
      const rows = stats.filter((stat) => stat.participantId === participant._id);
      const scoreGoals = completed.reduce((sum, match) => {
        if (match.player1Id === participant._id) return sum + (match.player1Score ?? 0);
        if (match.player2Id === participant._id) return sum + (match.player2Score ?? 0);
        return sum;
      }, 0);
      const recordedGoals = rows.reduce((sum, row) => sum + (row.goals ?? 0), 0);
      return {
        participantId: participant._id, name: participant.name,
        goals: recordedGoals || scoreGoals,
        kills: rows.reduce((sum, row) => sum + (row.kills ?? 0), 0),
        deaths: rows.reduce((sum, row) => sum + (row.deaths ?? 0), 0),
        assists: rows.reduce((sum, row) => sum + (row.assists ?? 0), 0),
        averageAcs: rows.length ? Math.round(rows.reduce((sum, row) => sum + (row.acs ?? 0), 0) / rows.length) : 0,
      };
    }).sort((a, b) => selectedGame === "valorant" ? b.kills - a.kills || b.averageAcs - a.averageAcs : b.goals - a.goals);
    return {
      gameId: selectedGame, completedMatches: completed.length,
      totalScore: completed.reduce((sum, match) => sum + (match.player1Score ?? 0) + (match.player2Score ?? 0), 0),
      leaders: leaders.slice(0, 10),
      totals: selectedGame === "valorant"
        ? { kills: stats.reduce((sum, row) => sum + (row.kills ?? 0), 0), rounds: stats.reduce((sum, row) => sum + (row.roundsWon ?? 0), 0), maps: completed.reduce((sum, match) => sum + (match.player1Score ?? 0) + (match.player2Score ?? 0), 0) }
        : { goals: stats.reduce((sum, row) => sum + (row.goals ?? 0), 0) || completed.reduce((sum, match) => sum + (match.player1Score ?? 0) + (match.player2Score ?? 0), 0), shots: stats.reduce((sum, row) => sum + (row.shots ?? 0), 0), cards: stats.reduce((sum, row) => sum + (row.cards ?? 0), 0) },
    };
  },
});

export const generateGroupMatches = mutation({
  args: { tournamentId: v.id("tournaments"), groupId: v.optional(v.id("groups")), adminCode: v.optional(v.string()) }, returns: v.number(),
  handler: async (ctx, args) => {
    const tournament = await requireTournamentAdmin(ctx, args.tournamentId, args.adminCode);
    const existing = args.groupId
      ? await ctx.db.query("matches").withIndex("by_groupId", (q) => q.eq("groupId", args.groupId)).take(1)
      : await ctx.db.query("matches").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(1);
    if (existing.length) throw new Error("Fixtures have already been generated for this stage.");
    const participants = args.groupId
      ? await ctx.db.query("participants").withIndex("by_groupId", (q) => q.eq("groupId", args.groupId)).take(64)
      : await ctx.db.query("participants").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(64);
    return await insertRoundRobin(ctx, tournament, participants, args.groupId);
  },
});

export const generateKnockout = mutation({
  args: { tournamentId: v.id("tournaments"), adminCode: v.optional(v.string()) }, returns: v.number(),
  handler: async (ctx, args) => {
    await requireTournamentAdmin(ctx, args.tournamentId, args.adminCode);
    const { tournament, participants, matches, stats } = await tournamentData(ctx, args.tournamentId);
    if (matches.some((match) => match.bracketRound !== undefined)) throw new Error("A knockout bracket already exists.");
    let qualified = participants;
    if (tournament.format === "Single Group + Finals") {
      const groupStageMatches = matches.filter((match) => match.bracketRound === undefined);
      if (!groupStageMatches.length || groupStageMatches.some((match) => match.status !== "Completed")) throw new Error("Complete every single-group fixture before generating the top-four finals.");
      qualified = calculateStandings(
        participants,
        groupStageMatches,
        stats,
        (tournament.gameId ?? "efootball") as GameModuleId,
      ).slice(0, 4).map((participant, index) => ({ ...participant, seed: index + 1 }));
      if (qualified.length < 4) throw new Error("At least four players are required for the finals.");
    } else if (tournament.format === "Groups + Knockout" || tournament.format === "Groups") {
      const groups = await ctx.db.query("groups").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(32);
      qualified = groups.flatMap((group) => {
        const groupParticipants = participants.filter((participant) => participant.groupId === group._id);
        const groupMatches = matches.filter((match) => match.groupId === group._id);
        return calculateStandings(groupParticipants, groupMatches, stats, (tournament.gameId ?? "efootball") as GameModuleId).slice(0, 2);
      });
    }
    return await insertBracketRound(ctx, tournament, qualified, 1);
  },
});

export const generateTournament = mutation({
  args: { tournamentId: v.id("tournaments"), adminCode: v.optional(v.string()) },
  returns: v.object({ mode: v.string(), created: v.number() }),
  handler: async (ctx, args) => {
    const tournament = await requireTournamentAdmin(ctx, args.tournamentId, args.adminCode);
    const participants = await ctx.db.query("participants").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(64);
    const existing = await ctx.db.query("matches").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(1);
    if (existing.length) throw new Error("This tournament already has fixtures.");
    if (["League", "Round Robin", "Single Group + Finals"].includes(tournament.format)) {
      return { mode: "league", created: await insertRoundRobin(ctx, tournament, participants) };
    }
    if (isKnockoutFormat(tournament.format)) {
      return { mode: "bracket", created: await insertBracketRound(ctx, tournament, participants, 1) };
    }
    const groups = await ctx.db.query("groups").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(32);
    if (!groups.length) throw new Error("Create groups and assign competitors before generating group fixtures.");
    let created = 0;
    for (const group of groups) {
      const groupParticipants = participants.filter((participant) => participant.groupId === group._id);
      created += await insertRoundRobin(ctx, tournament, groupParticipants, group._id);
    }
    return { mode: "groups", created };
  },
});

export const createFinal = mutation({
  args: { tournamentId: v.id("tournaments"), player1Id: v.id("participants"), player2Id: v.id("participants"), adminCode: v.optional(v.string()) }, returns: v.id("matches"),
  handler: async (ctx, args) => {
    const tournament = await requireTournamentAdmin(ctx, args.tournamentId, args.adminCode);
    const [first, second] = await Promise.all([ctx.db.get("participants", args.player1Id), ctx.db.get("participants", args.player2Id)]);
    if (!first || !second || first.tournamentId !== args.tournamentId || second.tournamentId !== args.tournamentId) throw new Error("Competitors must belong to this tournament.");
    const { adminCode: _adminCode, ...match } = args;
    return await ctx.db.insert("matches", { ...match, gameId: tournament.gameId ?? "efootball", status: "Scheduled", date: tournament.endDate ?? tournament.startDate, round: "Final", bracketRound: 2, bracketPosition: 0, bracketKind: "grand_final", bestOf: tournament.bestOf ?? rulesFor(tournament.gameId).defaultBestOf });
  },
});

export const resetKnockout = mutation({
  args: { tournamentId: v.id("tournaments"), adminCode: v.optional(v.string()) }, returns: v.number(),
  handler: async (ctx, args) => {
    await requireTournamentAdmin(ctx, args.tournamentId, args.adminCode);
    const matches = await ctx.db.query("matches").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(512);
    const knockout = matches.filter((match) => match.bracketRound !== undefined);
    for (const match of knockout) {
      const stats = await ctx.db.query("matchStats").withIndex("by_matchId", (q) => q.eq("matchId", match._id)).take(32);
      for (const stat of stats) await ctx.db.delete(stat._id);
      await ctx.db.delete(match._id);
    }
    return knockout.length;
  },
});
