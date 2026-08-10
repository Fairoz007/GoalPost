/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

async function createTournament(t: ReturnType<typeof convexTest>, gameId: "efootball" | "valorant", format: "League" | "Single Elimination" | "Double Elimination") {
  return await t.mutation(api.tournaments.create, {
    name: `${gameId} test`, slug: `${gameId}-${format.toLowerCase().replaceAll(" ", "-")}`,
    gameId, format, status: "Upcoming", startDate: "2026-08-10T10:00:00.000Z",
  });
}

function valorantRoster(prefix: string) {
  return [
    { displayName: `${prefix} Captain`, role: "captain" as const },
    ...[2, 3, 4, 5].map((number) => ({ displayName: `${prefix} Player ${number}`, role: "player" as const })),
  ];
}

describe("game-aware tournament engine", () => {
  test("eFootball league accepts draws and awards one point", async () => {
    const t = convexTest(schema, modules);
    const tournamentId = await createTournament(t, "efootball", "League");
    await t.mutation(api.participants.create, { tournamentId, name: "Player One", gameId: "efootball" });
    await t.mutation(api.participants.create, { tournamentId, name: "Player Two", gameId: "efootball" });
    await t.mutation(api.matches.generateTournament, { tournamentId });
    const [match] = await t.query(api.matches.getByTournament, { tournamentId });
    await t.mutation(api.matches.updateScore, { matchId: match._id, player1Score: 2, player2Score: 2 });
    const standings = await t.query(api.matches.getStandings, { tournamentId });
    expect(standings.gameId).toBe("efootball");
    expect(standings.rows.map((row) => row.points)).toEqual([1, 1]);
    expect(standings.rows.map((row) => row.differential)).toEqual([0, 0]);
  });

  test("VALORANT requires a five-player starting roster", async () => {
    const t = convexTest(schema, modules);
    const tournamentId = await createTournament(t, "valorant", "League");
    await expect(t.mutation(api.participants.create, { tournamentId, name: "Incomplete Team", gameId: "valorant", captain: "Solo", roster: [{ displayName: "Solo", role: "captain" }] })).rejects.toThrow("exactly 5 starting players");
  });

  test("VALORANT mode rules are stored and copied to generated matches", async () => {
    const t = convexTest(schema, modules);
    const tournamentId = await t.mutation(api.tournaments.create, {
      name: "Escalation Night", slug: "escalation-night", gameId: "valorant",
      matchMode: "escalation", format: "League", status: "Upcoming",
      startDate: "2026-08-10T10:00:00.000Z",
    });
    await t.mutation(api.participants.create, { tournamentId, name: "Alpha", gameId: "valorant", captain: "Alpha Captain", roster: valorantRoster("Alpha") });
    await t.mutation(api.participants.create, { tournamentId, name: "Bravo", gameId: "valorant", captain: "Bravo Captain", roster: valorantRoster("Bravo") });
    await t.mutation(api.matches.generateTournament, { tournamentId });
    const tournament = await t.query(api.tournaments.getById, { id: tournamentId });
    const [match] = await t.query(api.matches.getByTournament, { tournamentId });
    expect(tournament).toMatchObject({ matchMode: "escalation" });
    expect(tournament?.rules).toContain("weapon levels");
    expect(match).toMatchObject({ matchMode: "escalation" });
  });

  test("VALORANT validates map scores and ranks by maps and rounds", async () => {
    const t = convexTest(schema, modules);
    const tournamentId = await createTournament(t, "valorant", "League");
    await t.mutation(api.participants.create, { tournamentId, name: "Alpha", gameId: "valorant", captain: "Alpha Captain", roster: valorantRoster("Alpha") });
    await t.mutation(api.participants.create, { tournamentId, name: "Bravo", gameId: "valorant", captain: "Bravo Captain", roster: valorantRoster("Bravo") });
    await t.mutation(api.matches.generateTournament, { tournamentId });
    const [match] = await t.query(api.matches.getByTournament, { tournamentId });
    await expect(t.mutation(api.matches.updateScore, { matchId: match._id, player1Score: 1, player2Score: 1 })).rejects.toThrow("cannot end in a draw");
    await t.mutation(api.matches.updateScore, { matchId: match._id, player1Score: 2, player2Score: 1 });
    await t.mutation(api.matches.upsertStats, { matchId: match._id, participantId: match.player1Id, gameId: "valorant", roundsWon: 28, kills: 74, deaths: 58, assists: 22, acs: 241 });
    await t.mutation(api.matches.upsertStats, { matchId: match._id, participantId: match.player2Id, gameId: "valorant", roundsWon: 23, kills: 58, deaths: 74, assists: 19, acs: 198 });
    const standings = await t.query(api.matches.getStandings, { tournamentId });
    expect(standings.rows[0]).toMatchObject({ name: "Alpha", points: 1, scored: 2, conceded: 1, mapDifferential: 1, roundDifferential: 5 });
    const stats = await t.query(api.matches.getStatistics, { tournamentId });
    expect(stats.leaders[0]).toMatchObject({ name: "Alpha", kills: 74, averageAcs: 241 });
  });

  test("public VALORANT registration works without an account for an upcoming tournament", async () => {
    const t = convexTest(schema, modules);
    const tournamentId = await t.mutation(api.tournaments.create, { name: "Open Valorant", slug: "open-valorant", gameId: "valorant", format: "League", status: "Upcoming", startDate: "2026-08-10T10:00:00.000Z", registrationGroupUrl: "https://chat.whatsapp.com/example" });
    const roster = valorantRoster("Public");
    const registrationId = await t.mutation(api.arena.register, { tournamentId, applicantName: "Public Five", applicantEmail: "captain@example.com", phoneNumber: "+91 98765 43210", captainName: "Public Captain", acceptedRules: true, roster });
    const pending = await t.query(api.arena.listRegistrations, { tournamentId });
    expect(pending[0]).toMatchObject({ _id: registrationId, status: "pending", applicantEmail: "captain@example.com", phoneNumber: "+91 98765 43210" });
    expect(pending[0].roster).toHaveLength(5);
    await t.mutation(api.arena.reviewRegistration, { registrationId, decision: "approved" });
    const participants = await t.query(api.participants.getByTournament, { tournamentId });
    expect(participants[0]).toMatchObject({ name: "Public Five", kind: "team", captain: "Public Captain" });
    expect(participants[0].roster).toHaveLength(5);
  });

  test("public eFootball registration stores required contact details without a roster", async () => {
    const t = convexTest(schema, modules);
    const tournamentId = await createTournament(t, "efootball", "League");
    const registrationId = await t.mutation(api.arena.register, {
      tournamentId,
      applicantName: "Public Player",
      applicantEmail: "PLAYER@example.com",
      phoneNumber: "+968 9123 4567",
      acceptedRules: true,
    });
    const [registration] = await t.query(api.arena.listRegistrations, { tournamentId });
    expect(registration).toMatchObject({
      _id: registrationId,
      applicantName: "Public Player",
      applicantEmail: "player@example.com",
      phoneNumber: "+968 9123 4567",
      gameId: "efootball",
      competitorKind: "player",
    });
    expect(registration.roster).toEqual([]);
  });

  test("OBS overlay data auto-selects a live match and uses game-aware standings", async () => {
    const t = convexTest(schema, modules);
    const tournamentId = await createTournament(t, "valorant", "League");
    await t.mutation(api.participants.create, { tournamentId, name: "Overlay Alpha", gameId: "valorant", captain: "Alpha Captain", roster: valorantRoster("Alpha") });
    await t.mutation(api.participants.create, { tournamentId, name: "Overlay Bravo", gameId: "valorant", captain: "Bravo Captain", roster: valorantRoster("Bravo") });
    await t.mutation(api.matches.generateTournament, { tournamentId });
    const [match] = await t.query(api.matches.getByTournament, { tournamentId });
    await t.mutation(api.matches.setStatus, { matchId: match._id, status: "Live" });
    const overlay = await t.query(api.matches.getOverlayData, { tournamentId });
    expect(overlay.match).toMatchObject({ _id: match._id, status: "Live" });
    expect(overlay.tournament).not.toHaveProperty("adminCode");
    expect(overlay.tournament.gameId).toBe("valorant");
    expect(overlay.standings).toHaveLength(2);
    expect(overlay.standings[0]).toHaveProperty("mapDifferential");
  });

  test("single-elimination rounds auto-advance and publish a champion", async () => {
    const t = convexTest(schema, modules);
    const tournamentId = await createTournament(t, "efootball", "Single Elimination");
    for (let index = 1; index <= 4; index += 1) await t.mutation(api.participants.create, { tournamentId, name: `Seed ${index}`, gameId: "efootball", seed: index });
    await t.mutation(api.matches.generateKnockout, { tournamentId });
    const semifinals = await t.query(api.matches.getByTournament, { tournamentId });
    expect(semifinals).toHaveLength(2);
    await t.mutation(api.matches.updateScore, { matchId: semifinals[0]._id, player1Score: 3, player2Score: 0 });
    await t.mutation(api.matches.updateScore, { matchId: semifinals[1]._id, player1Score: 2, player2Score: 1 });
    const withFinal = await t.query(api.matches.getByTournament, { tournamentId });
    const final = withFinal.find((match) => match.round === "Final");
    expect(final).toBeDefined();
    await t.mutation(api.matches.updateScore, { matchId: final!._id, player1Score: 1, player2Score: 0 });
    const champions = await t.query(api.arena.listChampions, { gameId: "efootball" });
    expect(champions).toHaveLength(1);
    const tournament = await t.query(api.tournaments.getById, { id: tournamentId });
    expect(tournament?.status).toBe("Completed");
  });

  test("double elimination keeps teams alive until their second loss", async () => {
    const t = convexTest(schema, modules);
    const tournamentId = await createTournament(t, "valorant", "Double Elimination");
    for (const name of ["Apex", "Blaze", "Cipher", "Drift"]) await t.mutation(api.participants.create, { tournamentId, name, gameId: "valorant", captain: `${name} Captain`, roster: valorantRoster(name) });
    await t.mutation(api.matches.generateKnockout, { tournamentId });
    for (let wave = 0; wave < 8; wave += 1) {
      const tournament = await t.query(api.tournaments.getById, { id: tournamentId });
      if (tournament?.status === "Completed") break;
      const matches = await t.query(api.matches.getByTournament, { tournamentId });
      const scheduled = matches.filter((match) => match.status === "Scheduled");
      expect(scheduled.length).toBeGreaterThan(0);
      for (const match of scheduled) await t.mutation(api.matches.updateScore, { matchId: match._id, player1Score: 2, player2Score: 0 });
    }
    const champions = await t.query(api.arena.listChampions, { gameId: "valorant" });
    expect(champions).toHaveLength(1);
    const completed = (await t.query(api.matches.getByTournament, { tournamentId })).filter((match) => match.status === "Completed");
    expect(completed.length).toBeGreaterThan(3);
  });
});
