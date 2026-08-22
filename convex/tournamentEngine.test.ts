/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const organizerIdentity = {
  subject: "clerk-organizer",
  issuer: "https://clerk.test",
  tokenIdentifier: "https://clerk.test|clerk-organizer",
};

function editCodeFor(_tournamentId: string) {
  return "legacy-code-is-not-an-auth-factor";
}

function authenticatedTest() {
  return convexTest(schema, modules).withIdentity(organizerIdentity);
}

async function createTournament(t: ReturnType<typeof authenticatedTest>, gameId: "efootball" | "valorant", format: "League" | "Single Group + Finals" | "Single Elimination" | "Double Elimination") {
  const result = await t.mutation(api.tournaments.create, {
    name: `${gameId} test`, slug: `${gameId}-${format.toLowerCase().replaceAll(" ", "-")}`,
    gameId, format, status: "Upcoming", startDate: "2026-08-10T10:00:00.000Z",
  });
  return result.tournamentId;
}

function valorantRoster(prefix: string) {
  return [
    { displayName: `${prefix} Captain`, role: "captain" as const },
    ...[2, 3, 4, 5].map((number) => ({ displayName: `${prefix} Player ${number}`, role: "player" as const })),
  ];
}

describe("game-aware tournament engine", () => {
  test("Clerk identity owns organizer data and blocks other users", async () => {
    const base = convexTest(schema, modules);
    const t = base.withIdentity(organizerIdentity);
    const first = await t.mutation(api.tournaments.create, { name: "Secure One", slug: "secure-one", gameId: "efootball", format: "League", status: "Upcoming", startDate: "2026-08-10T10:00:00.000Z" });
    const second = await t.mutation(api.tournaments.create, { name: "Secure Two", slug: "secure-two", gameId: "efootball", format: "League", status: "Upcoming", startDate: "2026-08-10T10:00:00.000Z" });
    expect(second.tournamentId).not.toBe(first.tournamentId);
    const publicTournament = await t.query(api.tournaments.getById, { id: first.tournamentId });
    expect(publicTournament).not.toHaveProperty("adminCode");
    expect(publicTournament).not.toHaveProperty("ownerToken");
    const legacyUserId = await t.run(async (ctx) => await ctx.db.insert("users", {
      tokenIdentifier: "https://clerk.test|legacy-profile",
      clerkUserId: "legacy-profile",
      name: "Legacy Profile",
      gamerTag: "Legacy Gamer",
      phone: "9249049337",
      countryCode: "IN",
      captainName: "Legacy Captain",
      discordTag: "legacy-user",
      efootballId: "858-157-496",
      valorantId: "legacy#001",
      defaultRoster: [{ displayName: "Legacy Captain", role: "captain", countryCode: "IN" }],
      profileCompleted: true,
      lastSeenAt: Date.now(),
    }));
    expect(await t.run(async (ctx) => await ctx.db.get("users", legacyUserId))).toMatchObject({ profileCompleted: true, gamerTag: "Legacy Gamer", discordTag: "legacy-user" });
    const otherUser = base.withIdentity({ subject: "clerk-other", issuer: "https://clerk.test", tokenIdentifier: "https://clerk.test|clerk-other" });
    await expect(otherUser.mutation(api.tournaments.update, { id: first.tournamentId, name: "Hijacked" })).rejects.toThrow("permission");
    await expect(otherUser.mutation(api.participants.create, { tournamentId: first.tournamentId, name: "Injected Player", gameId: "efootball" })).rejects.toThrow("permission");
    await t.mutation(api.tournaments.update, { id: first.tournamentId, name: "Secure Updated" });
  });

  test("registration contact data is isolated by Clerk user while standings stay public", async () => {
    const base = convexTest(schema, modules);
    const organizer = base.withIdentity(organizerIdentity);
    const applicant = base.withIdentity({ subject: "clerk-applicant", issuer: "https://clerk.test", tokenIdentifier: "https://clerk.test|clerk-applicant" });
    const outsider = base.withIdentity({ subject: "clerk-outsider", issuer: "https://clerk.test", tokenIdentifier: "https://clerk.test|clerk-outsider" });
    const { tournamentId } = await organizer.mutation(api.tournaments.create, {
      name: "Public table, private entry",
      gameId: "efootball",
      format: "League",
      status: "Upcoming",
      startDate: "2026-08-10T10:00:00.000Z",
    });
    await applicant.mutation(api.arena.register, {
      tournamentId,
      applicantName: "Private Applicant",
      applicantEmail: "private@example.com",
      phoneNumber: "+968 9000 0000",
      konamiId: "private-player",
      playerRating: 1850,
      countryCode: "OM",
      acceptedRules: true,
    });
    expect(await applicant.query(api.arena.listMyRegistrations, {})).toHaveLength(1);
    expect(await outsider.query(api.arena.listMyRegistrations, {})).toHaveLength(0);
    expect(await organizer.query(api.arena.listRegistrations, { tournamentId })).toMatchObject([
      { applicantEmail: "private@example.com" },
    ]);
    expect((await base.query(api.matches.getStandings, { tournamentId })).rows).toHaveLength(1);
  });

  test("organizers can invite registered users and public participant data hides account links", async () => {
    const base = convexTest(schema, modules);
    const organizer = base.withIdentity(organizerIdentity);
    const outsider = base.withIdentity({ subject: "clerk-outsider", issuer: "https://clerk.test", tokenIdentifier: "https://clerk.test|clerk-outsider" });
    const registeredUserId = await base.run(async (ctx) => await ctx.db.insert("users", {
      tokenIdentifier: "https://clerk.test|clerk-player",
      clerkUserId: "clerk-player",
      name: "Registered Player",
      email: "registered@example.com",
      lastSeenAt: Date.now(),
    }));
    const { tournamentId } = await organizer.mutation(api.tournaments.create, {
      name: "Invitation Cup",
      gameId: "efootball",
      format: "League",
      status: "Upcoming",
      startDate: "2026-08-10T10:00:00.000Z",
    });

    expect(await organizer.query(api.users.listDirectory, { tournamentId })).toMatchObject([
      { _id: registeredUserId, name: "Registered Player", email: "registered@example.com", alreadyParticipant: false },
    ]);
    await expect(outsider.query(api.users.listDirectory, { tournamentId })).rejects.toThrow("permission");
    const inviteId = await organizer.mutation(api.invitations.create, {
      tournamentId,
      userId: registeredUserId,
      email: "registered@example.com",
    });
    expect(await organizer.query(api.invitations.listForTournament, { tournamentId })).toMatchObject([
      { _id: inviteId, inviteeUserId: registeredUserId, status: "pending" },
    ]);
    await expect(outsider.query(api.invitations.listForTournament, { tournamentId })).rejects.toThrow("permission");

    await organizer.mutation(api.participants.create, {
      tournamentId,
      userId: registeredUserId,
      name: "Registered Player",
      gameId: "efootball",
    });
    expect(await organizer.query(api.users.listDirectory, { tournamentId })).toMatchObject([
      { _id: registeredUserId, alreadyParticipant: true },
    ]);
    const [participant] = await base.query(api.participants.getByTournament, { tournamentId });
    expect(participant).not.toHaveProperty("userId");
    await expect(organizer.mutation(api.participants.create, {
      tournamentId,
      userId: registeredUserId,
      name: "Duplicate Account",
      gameId: "efootball",
    })).rejects.toMatchObject({ data: expect.stringContaining("already been added") });
  });

  test("a legacy edit code can bind an unowned tournament only once", async () => {
    const base = convexTest(schema, modules);
    const legacyId = await base.run(async (ctx) => await ctx.db.insert("tournaments", {
      name: "Legacy tournament",
      format: "League",
      status: "Upcoming",
      startDate: "2026-08-10T10:00:00.000Z",
      adminCode: "LEGACYOWNER1234",
    }));
    const owner = base.withIdentity(organizerIdentity);
    const outsider = base.withIdentity({ subject: "clerk-outsider", issuer: "https://clerk.test", tokenIdentifier: "https://clerk.test|clerk-outsider" });
    await expect(outsider.mutation(api.tournaments.claimLegacy, { id: legacyId, editCode: "WRONG" })).rejects.toThrow("invalid");
    expect(await owner.mutation(api.tournaments.claimLegacy, { id: legacyId, editCode: "LEGACYOWNER1234" })).toBe(true);
    expect(await outsider.mutation(api.tournaments.claimLegacy, { id: legacyId, editCode: "LEGACYOWNER1234" })).toBe(false);
  });

  test("organizers can edit game-aligned formats before fixtures exist", async () => {
    const t = authenticatedTest();
    const tournamentId = await createTournament(t, "efootball", "League");
    await t.mutation(api.tournaments.update, { id: tournamentId, adminCode: editCodeFor(tournamentId), format: "Groups + Knockout", bestOf: 3, maxSlots: 24 });
    expect(await t.query(api.tournaments.getById, { id: tournamentId })).toMatchObject({ format: "Groups + Knockout", bestOf: 3, maxSlots: 24 });

    const valorantId = await createTournament(t, "valorant", "League");
    await expect(t.mutation(api.tournaments.update, { id: valorantId, adminCode: editCodeFor(valorantId), format: "Round Robin" })).rejects.toThrow("not supported for VALORANT");

    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Format One", gameId: "efootball" });
    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Format Two", gameId: "efootball" });
    await t.mutation(api.matches.generateGroupMatches, { tournamentId, adminCode: editCodeFor(tournamentId) });
    await expect(t.mutation(api.tournaments.update, { id: tournamentId, adminCode: editCodeFor(tournamentId), format: "Single Elimination" })).rejects.toThrow("cannot be changed after fixtures");
  });

  test("eFootball league accepts draws and awards one point", async () => {
    const t = authenticatedTest();
    const tournamentId = await createTournament(t, "efootball", "League");
    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Player One", gameId: "efootball" });
    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Player Two", gameId: "efootball" });
    await t.mutation(api.matches.generateTournament, { tournamentId, adminCode: editCodeFor(tournamentId) });
    const [match] = await t.query(api.matches.getByTournament, { tournamentId });
    await t.mutation(api.matches.updateScore, { matchId: match._id, adminCode: editCodeFor(tournamentId), player1Score: 2, player2Score: 2 });
    const standings = await t.query(api.matches.getStandings, { tournamentId });
    expect(standings.gameId).toBe("efootball");
    expect(standings.rows.map((row) => row.points)).toEqual([1, 1]);
    expect(standings.rows.map((row) => row.differential)).toEqual([0, 0]);
  });

  test("VALORANT requires a five-player starting roster", async () => {
    const t = authenticatedTest();
    const tournamentId = await createTournament(t, "valorant", "League");
    await expect(t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Incomplete Team", gameId: "valorant", captain: "Solo", roster: [{ displayName: "Solo", role: "captain" }] })).rejects.toThrow("exactly 5 starting players");
  });

  test("VALORANT mode rules are stored and copied to generated matches", async () => {
    const t = authenticatedTest();
    const created = await t.mutation(api.tournaments.create, {
      name: "Escalation Night", slug: "escalation-night", gameId: "valorant",
      matchMode: "escalation", format: "League", status: "Upcoming",
      startDate: "2026-08-10T10:00:00.000Z",
    });
    const { tournamentId } = created;
    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Alpha", gameId: "valorant", captain: "Alpha Captain", roster: valorantRoster("Alpha") });
    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Bravo", gameId: "valorant", captain: "Bravo Captain", roster: valorantRoster("Bravo") });
    await t.mutation(api.matches.generateTournament, { tournamentId, adminCode: editCodeFor(tournamentId) });
    const tournament = await t.query(api.tournaments.getById, { id: tournamentId });
    const [match] = await t.query(api.matches.getByTournament, { tournamentId });
    expect(tournament).toMatchObject({ matchMode: "escalation" });
    expect(tournament?.rules).toContain("weapon levels");
    expect(match).toMatchObject({ matchMode: "escalation" });
  });

  test("VALORANT validates map scores and ranks by maps and rounds", async () => {
    const t = authenticatedTest();
    const tournamentId = await createTournament(t, "valorant", "League");
    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Alpha", gameId: "valorant", captain: "Alpha Captain", roster: valorantRoster("Alpha") });
    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Bravo", gameId: "valorant", captain: "Bravo Captain", roster: valorantRoster("Bravo") });
    await t.mutation(api.matches.generateTournament, { tournamentId, adminCode: editCodeFor(tournamentId) });
    const [match] = await t.query(api.matches.getByTournament, { tournamentId });
    await expect(t.mutation(api.matches.updateScore, { matchId: match._id, adminCode: editCodeFor(tournamentId), player1Score: 1, player2Score: 1 })).rejects.toThrow("cannot end in a draw");
    await t.mutation(api.matches.updateScore, { matchId: match._id, adminCode: editCodeFor(tournamentId), player1Score: 2, player2Score: 1 });
    await t.mutation(api.matches.upsertStats, { matchId: match._id, adminCode: editCodeFor(tournamentId), participantId: match.player1Id, gameId: "valorant", roundsWon: 28, kills: 74, deaths: 58, assists: 22, acs: 241 });
    await t.mutation(api.matches.upsertStats, { matchId: match._id, adminCode: editCodeFor(tournamentId), participantId: match.player2Id, gameId: "valorant", roundsWon: 23, kills: 58, deaths: 74, assists: 19, acs: 198 });
    const standings = await t.query(api.matches.getStandings, { tournamentId });
    expect(standings.rows[0]).toMatchObject({ name: "Alpha", points: 1, scored: 2, conceded: 1, mapDifferential: 1, roundDifferential: 5 });
    const stats = await t.query(api.matches.getStatistics, { tournamentId });
    expect(stats.leaders[0]).toMatchObject({ name: "Alpha", kills: 74, averageAcs: 241 });
  });

  test("public VALORANT registration works without an account for an upcoming tournament", async () => {
    const t = authenticatedTest();
    const created = await t.mutation(api.tournaments.create, { name: "Open Valorant", slug: "open-valorant", gameId: "valorant", format: "League", status: "Upcoming", startDate: "2026-08-10T10:00:00.000Z", registrationGroupUrl: "https://chat.whatsapp.com/example" });
    const { tournamentId } = created;
    const roster = valorantRoster("Public");
    const registrationId = await t.mutation(api.arena.register, { tournamentId, applicantName: "Public Five", applicantEmail: "captain@example.com", phoneNumber: "+91 98765 43210", countryCode: "IN", captainName: "Public Captain", acceptedRules: true, roster });
    const registrations = await t.query(api.arena.listRegistrations, { tournamentId, adminCode: editCodeFor(tournamentId) });
    expect(registrations[0]).toMatchObject({ _id: registrationId, status: "approved", applicantEmail: "captain@example.com", phoneNumber: "+919876543210", countryCode: "IN" });
    expect(registrations[0].participantId).toBeTruthy();
    expect(registrations[0].roster).toHaveLength(5);
    const participants = await t.query(api.participants.getByTournament, { tournamentId });
    expect(participants[0]).toMatchObject({ name: "Public Five", kind: "team", captain: "Public Captain" });
    expect(participants[0].roster).toHaveLength(5);
  });

  test("public eFootball registration stores required contact details without a roster", async () => {
    const t = authenticatedTest();
    const tournamentId = await createTournament(t, "efootball", "League");
    const registrationId = await t.mutation(api.arena.register, {
      tournamentId,
      applicantName: "Public Player",
      applicantEmail: "PLAYER@example.com",
      phoneNumber: "+968 9123 4567",
      konamiId: "public-player-01",
      playerRating: 1924,
      countryCode: "OM",
      acceptedRules: true,
    });
    const [registration] = await t.query(api.arena.listRegistrations, { tournamentId, adminCode: editCodeFor(tournamentId) });
    expect(registration).toMatchObject({
      _id: registrationId,
      applicantName: "Public Player",
      applicantEmail: "player@example.com",
      phoneNumber: "+96891234567",
      konamiId: "public-player-01",
      playerRating: 1924,
      gameId: "efootball",
      competitorKind: "player",
      countryCode: "OM",
      status: "approved",
    });
    expect(registration.roster).toEqual([]);
    const [participant] = await t.query(api.participants.getByTournament, { tournamentId });
    expect(participant).toMatchObject({ name: "Public Player", countryCode: "OM", registrationStatus: "approved" });

    const legacyRegistrationId = await t.run(async (ctx) => await ctx.db.insert("registrations", {
      tournamentId,
      applicantName: "Legacy Player",
      applicantEmail: "legacy@example.com",
      phoneNumber: "9249049337",
      efootballId: "858-157-496",
      valorantId: "legacy-player#001",
      gameId: "efootball",
      competitorKind: "player",
      acceptedRules: true,
      status: "approved",
      createdAt: Date.now(),
    }));
    const withLegacyRegistration = await t.query(api.arena.listRegistrations, { tournamentId });
    expect(withLegacyRegistration.find((entry) => entry._id === legacyRegistrationId)).toMatchObject({
      efootballId: "858-157-496",
      valorantId: "legacy-player#001",
      phoneNumber: "9249049337",
    });

    await expect(t.mutation(api.arena.register, {
      tournamentId,
      applicantName: "Fake Contact",
      applicantEmail: "fake@example.com",
      phoneNumber: "12345678",
      konamiId: "fake-player",
      playerRating: 1000,
      countryCode: "OM",
      acceptedRules: true,
    })).rejects.toThrow("WhatsApp");
  });

  test("registration can be marked unavailable", async () => {
    const t = authenticatedTest();
    const tournamentId = await createTournament(t, "efootball", "League");
    await t.mutation(api.tournaments.update, { id: tournamentId, adminCode: editCodeFor(tournamentId), registrationEnabled: false });
    await expect(t.mutation(api.arena.register, {
      tournamentId, applicantName: "Late Player", applicantEmail: "late@example.com",
      phoneNumber: "+968 9000 0000", countryCode: "OM", acceptedRules: true,
    })).rejects.toThrow("Registration is not available");
  });

  test("single group sends the top four to seeded semifinals", async () => {
    const t = authenticatedTest();
    const tournamentId = await createTournament(t, "efootball", "Single Group + Finals");
    for (const name of ["First", "Second", "Third", "Fourth"]) await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name, gameId: "efootball" });
    await t.mutation(api.matches.generateTournament, { tournamentId, adminCode: editCodeFor(tournamentId) });
    const groupMatches = await t.query(api.matches.getByTournament, { tournamentId });
    for (const match of groupMatches) await t.mutation(api.matches.updateScore, { matchId: match._id, adminCode: editCodeFor(tournamentId), player1Score: 1, player2Score: 0 });
    const standings = await t.query(api.matches.getStandings, { tournamentId });
    await t.mutation(api.matches.generateKnockout, { tournamentId, adminCode: editCodeFor(tournamentId) });
    const allMatches = await t.query(api.matches.getByTournament, { tournamentId });
    const semifinals = allMatches.filter((match) => match.bracketRound === 1);
    expect(semifinals).toHaveLength(2);
    expect(semifinals[0]).toMatchObject({ player1Id: standings.rows[0]._id, player2Id: standings.rows[3]._id, round: "Semi-Final" });
    expect(semifinals[1]).toMatchObject({ player1Id: standings.rows[1]._id, player2Id: standings.rows[2]._id, round: "Semi-Final" });
  });

  test("OBS overlay data auto-selects a live match and uses game-aware standings", async () => {
    const t = authenticatedTest();
    const tournamentId = await createTournament(t, "valorant", "League");
    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Overlay Alpha", gameId: "valorant", captain: "Alpha Captain", roster: valorantRoster("Alpha") });
    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Overlay Bravo", gameId: "valorant", captain: "Bravo Captain", roster: valorantRoster("Bravo") });
    await t.mutation(api.matches.generateTournament, { tournamentId, adminCode: editCodeFor(tournamentId) });
    const [match] = await t.query(api.matches.getByTournament, { tournamentId });
    await t.mutation(api.matches.setStatus, { matchId: match._id, adminCode: editCodeFor(tournamentId), status: "Live" });
    const overlay = await t.query(api.matches.getOverlayData, { tournamentId });
    expect(overlay.match).toMatchObject({ _id: match._id, status: "Live" });
    expect(overlay.tournament).not.toHaveProperty("adminCode");
    expect(overlay.tournament.gameId).toBe("valorant");
    expect(overlay.standings).toHaveLength(2);
    expect(overlay.standings[0]).toHaveProperty("mapDifferential");
  });

  test("rankings include provisional competitors and matches accept safe YouTube URLs", async () => {
    const base = convexTest(schema, modules);
    const t = base.withIdentity(organizerIdentity);
    const tournamentId = await createTournament(t, "efootball", "League");
    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Video Alpha", gameId: "efootball" });
    await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Video Bravo", gameId: "efootball" });

    const rankings = await t.query(api.arena.listRankings, { gameId: "efootball", limit: 10 });
    expect(rankings).toHaveLength(2);
    expect(rankings.every((ranking) => ranking.rating === 1000 && ranking.wins === 0 && ranking.losses === 0)).toBe(true);

    await t.mutation(api.tournaments.setYouTubeVideo, {
      tournamentId,
      videoUrl: "https://www.youtube.com/live/dQw4w9WgXcQ",
    });
    expect(await t.query(api.tournaments.getById, { id: tournamentId })).toMatchObject({ youtubeVideoId: "dQw4w9WgXcQ" });

    await t.mutation(api.matches.generateTournament, { tournamentId, adminCode: editCodeFor(tournamentId) });
    const [match] = await t.query(api.matches.getByTournament, { tournamentId });
    await t.mutation(api.matches.setYouTubeVideo, {
      matchId: match._id,
      videoUrl: "https://youtu.be/dQw4w9WgXcQ?t=43",
      adminCode: editCodeFor(tournamentId),
    });
    expect(await t.query(api.matches.getById, { id: match._id })).toMatchObject({ youtubeVideoId: "dQw4w9WgXcQ" });
    const outsider = base.withIdentity({ subject: "clerk-stream-outsider", issuer: "https://clerk.test", tokenIdentifier: "https://clerk.test|clerk-stream-outsider" });
    await expect(outsider.mutation(api.matches.setYouTubeVideo, {
      matchId: match._id,
      videoUrl: "https://youtu.be/9bZkp7q19f0",
    })).rejects.toThrow("permission");
    await expect(outsider.mutation(api.tournaments.setYouTubeVideo, {
      tournamentId,
      videoUrl: "https://youtu.be/9bZkp7q19f0",
    })).rejects.toThrow("permission");
    await expect(t.mutation(api.matches.setYouTubeVideo, {
      matchId: match._id,
      videoUrl: "https://example.com/not-youtube",
      adminCode: editCodeFor(tournamentId),
    })).rejects.toThrow("YouTube");
    await t.mutation(api.matches.setYouTubeVideo, { matchId: match._id, videoUrl: "", adminCode: editCodeFor(tournamentId) });
    expect(await t.query(api.matches.getById, { id: match._id })).not.toHaveProperty("youtubeVideoId");
  });

  test("single-elimination rounds auto-advance and publish a champion", async () => {
    const t = authenticatedTest();
    const tournamentId = await createTournament(t, "efootball", "Single Elimination");
    for (let index = 1; index <= 4; index += 1) await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: `Seed ${index}`, gameId: "efootball", seed: index });
    await t.mutation(api.matches.generateKnockout, { tournamentId, adminCode: editCodeFor(tournamentId) });
    const semifinals = await t.query(api.matches.getByTournament, { tournamentId });
    expect(semifinals).toHaveLength(2);
    await t.mutation(api.matches.updateScore, { matchId: semifinals[0]._id, adminCode: editCodeFor(tournamentId), player1Score: 3, player2Score: 0 });
    await t.mutation(api.matches.updateScore, { matchId: semifinals[1]._id, adminCode: editCodeFor(tournamentId), player1Score: 2, player2Score: 1 });
    const withFinal = await t.query(api.matches.getByTournament, { tournamentId });
    const final = withFinal.find((match) => match.round === "Final");
    expect(final).toBeDefined();
    await t.mutation(api.matches.updateScore, { matchId: final!._id, adminCode: editCodeFor(tournamentId), player1Score: 1, player2Score: 0 });
    const champions = await t.query(api.arena.listChampions, { gameId: "efootball" });
    expect(champions).toHaveLength(1);
    const tournament = await t.query(api.tournaments.getById, { id: tournamentId });
    expect(tournament?.status).toBe("Completed");
  });

  test("double elimination keeps teams alive until their second loss", async () => {
    const t = authenticatedTest();
    const tournamentId = await createTournament(t, "valorant", "Double Elimination");
    for (const name of ["Apex", "Blaze", "Cipher", "Drift"]) await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name, gameId: "valorant", captain: `${name} Captain`, roster: valorantRoster(name) });
    await t.mutation(api.matches.generateKnockout, { tournamentId, adminCode: editCodeFor(tournamentId) });
    for (let wave = 0; wave < 8; wave += 1) {
      const tournament = await t.query(api.tournaments.getById, { id: tournamentId });
      if (tournament?.status === "Completed") break;
      const matches = await t.query(api.matches.getByTournament, { tournamentId });
      const scheduled = matches.filter((match) => match.status === "Scheduled");
      expect(scheduled.length).toBeGreaterThan(0);
      for (const match of scheduled) await t.mutation(api.matches.updateScore, { matchId: match._id, adminCode: editCodeFor(tournamentId), player1Score: 2, player2Score: 0 });
    }
    const champions = await t.query(api.arena.listChampions, { gameId: "valorant" });
    expect(champions).toHaveLength(1);
  });

  test("user profile onboarding and instant 1-click tournament registration work seamlessly", async () => {
    const base = convexTest(schema, modules);
    const organizer = base.withIdentity(organizerIdentity);
    const tournamentId = await createTournament(organizer, "efootball", "League");

    const player = base.withIdentity({
      subject: "clerk-player-one",
      issuer: "https://clerk.test",
      tokenIdentifier: "https://clerk.test|clerk-player-one",
    });

    // 1. Initial user ensures record
    await player.mutation(api.users.ensureCurrent, {});
    const initialProfile = await player.query(api.users.getProfile, {});
    expect(initialProfile?.profileCompleted).toBe(false);

    // 2. Player completes profile onboarding including optional game IDs
    await player.mutation(api.users.updateProfile, {
      name: "Striker Ace",
      gamerTag: "Striker#99",
      phone: "+971501234567",
      countryCode: "AE",
      discordTag: "striker#0001",
      efootballId: "EF-998877",
      valorantId: "Striker#VAL",
    });

    const updatedProfile = await player.query(api.users.getProfile, {});
    expect(updatedProfile?.profileCompleted).toBe(true);
    expect(updatedProfile?.gamerTag).toBe("Striker#99");
    expect(updatedProfile?.phone).toBe("+971501234567");
    expect(updatedProfile?.efootballId).toBe("EF-998877");
    expect(updatedProfile?.valorantId).toBe("Striker#VAL");

    // 3. Instant 1-click registration without entering extra details
    const registrationId = await player.mutation(api.arena.quickRegister, {
      tournamentId,
      playerRating: 1450,
    });
    expect(registrationId).toBeDefined();

    const participants = await organizer.query(api.participants.getByTournament, { tournamentId });
    expect(participants).toHaveLength(1);
    expect(participants[0].name).toBe("Striker#99");
    expect(participants[0].countryCode).toBe("AE");
    expect(participants[0].efootballId).toBe("EF-998877");

    // Duplicate registration is rejected
    await expect(
      player.mutation(api.arena.quickRegister, { tournamentId, playerRating: 1450 }),
    ).rejects.toThrow("already registered");
  });

  test("manual match creation, batch creation, and deletion operate independently of auto generators", async () => {
    const t = authenticatedTest();
    const tournamentId = await createTournament(t, "efootball", "League");

    const p1 = await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Alpha", gameId: "efootball" });
    const p2 = await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Bravo", gameId: "efootball" });
    const p3 = await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Charlie", gameId: "efootball" });
    const p4 = await t.mutation(api.participants.create, { tournamentId, adminCode: editCodeFor(tournamentId), name: "Delta", gameId: "efootball" });

    // 1. Manually create a single custom fixture
    const singleMatchId = await t.mutation(api.matches.create, {
      tournamentId,
      adminCode: editCodeFor(tournamentId),
      player1Id: p1,
      player2Id: p2,
      round: "Exhibition Match",
      bestOf: 3,
    });
    expect(singleMatchId).toBeDefined();

    let matches = await t.query(api.matches.getByTournament, { tournamentId });
    expect(matches).toHaveLength(1);
    expect(matches[0].round).toBe("Exhibition Match");
    expect(matches[0].bestOf).toBe(3);

    // 2. Batch manual fixture creation (e.g. from random shuffle / draw)
    const batchCount = await t.mutation(api.matches.createBatch, {
      tournamentId,
      adminCode: editCodeFor(tournamentId),
      matches: [
        { player1Id: p3, player2Id: p4, round: "Showmatch" },
      ],
    });
    expect(batchCount).toBe(1);

    matches = await t.query(api.matches.getByTournament, { tournamentId });
    expect(matches).toHaveLength(2);

    // 3. Delete a match
    await t.mutation(api.matches.remove, { matchId: singleMatchId, adminCode: editCodeFor(tournamentId) });
    matches = await t.query(api.matches.getByTournament, { tournamentId });
    expect(matches).toHaveLength(1);
    expect(matches[0].round).toBe("Showmatch");
  });
});

