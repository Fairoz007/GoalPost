import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const gameId = v.union(v.literal("efootball"), v.literal("valorant"));
export const valorantMatchMode = v.union(
  v.literal("scrimmage"),
  v.literal("escalation"),
  v.literal("unrated_competitive"),
  v.literal("standard_unrated"),
  v.literal("deathmatch"),
);
export const tournamentStatus = v.union(
  v.literal("Draft"),
  v.literal("Upcoming"),
  v.literal("Registration Open"),
  v.literal("Ongoing"),
  v.literal("Completed"),
  v.literal("Cancelled"),
);
export const tournamentFormat = v.union(
  v.literal("Knockout"),
  v.literal("League"),
  v.literal("Groups"),
  v.literal("Single Group + Finals"),
  v.literal("Round Robin"),
  v.literal("Single Elimination"),
  v.literal("Double Elimination"),
  v.literal("Groups + Knockout"),
);
export const matchStatus = v.union(
  v.literal("Scheduled"),
  v.literal("Live"),
  v.literal("Completed"),
  v.literal("Disputed"),
  v.literal("Cancelled"),
);

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    gamerTag: v.optional(v.string()),
    phone: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    discordTag: v.optional(v.string()),
    captainName: v.optional(v.string()),
    efootballId: v.optional(v.string()),
    valorantId: v.optional(v.string()),
    defaultRoster: v.optional(
      v.array(
        v.object({
          displayName: v.string(),
          role: v.union(v.literal("captain"), v.literal("player"), v.literal("coach"), v.literal("substitute")),
          countryCode: v.optional(v.string()),
        }),
      ),
    ),
    profileCompleted: v.optional(v.boolean()),
    lastSeenAt: v.number(),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  tournaments: defineTable({
    ownerToken: v.optional(v.string()),
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
    youtubeVideoId: v.optional(v.string()),
    adminCode: v.optional(v.string()),
  })
    .index("by_ownerToken", ["ownerToken"])
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_gameId_and_status", ["gameId", "status"]),

  groups: defineTable({
    name: v.string(),
    tournamentId: v.id("tournaments"),
    order: v.optional(v.number()),
  }).index("by_tournamentId", ["tournamentId"]),

  participants: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    slug: v.optional(v.string()),
    tournamentId: v.id("tournaments"),
    groupId: v.optional(v.id("groups")),
    gameId: v.optional(gameId),
    kind: v.optional(v.union(v.literal("player"), v.literal("team"))),
    teamId: v.optional(v.id("teams")),
    teamName: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    flag: v.optional(v.string()),
    captain: v.optional(v.string()),
    efootballId: v.optional(v.string()),
    konamiId: v.optional(v.string()),
    valorantId: v.optional(v.string()),
    seed: v.optional(v.number()),
    checkedIn: v.optional(v.boolean()),
    registrationStatus: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    ),
  })
    .index("by_tournamentId", ["tournamentId"])
    .index("by_tournamentId_and_userId", ["tournamentId", "userId"])
    .index("by_gameId", ["gameId"])
    .index("by_groupId", ["groupId"])
    .index("by_teamId", ["teamId"])
    .index("by_slug", ["slug"]),

  teams: defineTable({
    ownerToken: v.optional(v.string()),
    name: v.string(),
    slug: v.string(),
    gameId,
    logoUrl: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    captainName: v.string(),
    bio: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_gameId", ["gameId"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    displayName: v.string(),
    username: v.optional(v.string()),
    role: v.union(v.literal("captain"), v.literal("player"), v.literal("coach"), v.literal("substitute")),
    countryCode: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  }).index("by_teamId", ["teamId"]),

  matches: defineTable({
    tournamentId: v.id("tournaments"),
    groupId: v.optional(v.id("groups")),
    gameId: v.optional(gameId),
    matchMode: v.optional(valorantMatchMode),
    player1Id: v.id("participants"),
    player2Id: v.id("participants"),
    player1Score: v.optional(v.number()),
    player2Score: v.optional(v.number()),
    status: matchStatus,
    date: v.string(),
    round: v.optional(v.string()),
    bracketRound: v.optional(v.number()),
    bracketPosition: v.optional(v.number()),
    bracketKind: v.optional(v.union(v.literal("upper"), v.literal("lower"), v.literal("grand_final"))),
    bestOf: v.optional(v.number()),
    youtubeVideoId: v.optional(v.string()),
    winnerId: v.optional(v.id("participants")),
    nextMatchId: v.optional(v.id("matches")),
  })
    .index("by_tournamentId", ["tournamentId"])
    .index("by_tournamentId_and_status", ["tournamentId", "status"])
    .index("by_groupId", ["groupId"])
    .index("by_player1Id", ["player1Id"])
    .index("by_player2Id", ["player2Id"]),

  matchStats: defineTable({
    matchId: v.id("matches"),
    tournamentId: v.optional(v.id("tournaments")),
    participantId: v.id("participants"),
    gameId,
    goals: v.optional(v.number()),
    possession: v.optional(v.number()),
    possessionPercentage: v.optional(v.number()),
    shots: v.optional(v.number()),
    shotsOnTarget: v.optional(v.number()),
    passAccuracyPercentage: v.optional(v.number()),
    fouls: v.optional(v.number()),
    yellowCards: v.optional(v.number()),
    redCards: v.optional(v.number()),
    cards: v.optional(v.number()),
    mapsWon: v.optional(v.number()),
    roundsWon: v.optional(v.number()),
    kills: v.optional(v.number()),
    deaths: v.optional(v.number()),
    assists: v.optional(v.number()),
    assistsVal: v.optional(v.number()),
    acs: v.optional(v.number()),
  })
    .index("by_matchId", ["matchId"])
    .index("by_tournamentId", ["tournamentId"]),

  registrations: defineTable({
    userId: v.optional(v.id("users")),
    ownerToken: v.optional(v.string()),
    tournamentId: v.id("tournaments"),
    applicantName: v.string(),
    applicantEmail: v.string(),
    phoneNumber: v.optional(v.string()),
    efootballId: v.optional(v.string()),
    konamiId: v.optional(v.string()),
    valorantId: v.optional(v.string()),
    playerRating: v.optional(v.number()),
    teamId: v.optional(v.id("teams")),
    countryCode: v.optional(v.string()),
    gameId: v.optional(gameId),
    competitorKind: v.optional(v.union(v.literal("player"), v.literal("team"))),
    captainName: v.optional(v.string()),
    participantId: v.optional(v.id("participants")),
    acceptedRules: v.boolean(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    createdAt: v.number(),
  })
    .index("by_tournamentId", ["tournamentId"])
    .index("by_ownerToken", ["ownerToken"])
    .index("by_ownerToken_and_tournamentId", ["ownerToken", "tournamentId"])
    .index("by_tournamentId_and_status", ["tournamentId", "status"]),

  tournamentInvites: defineTable({
    tournamentId: v.id("tournaments"),
    inviterToken: v.string(),
    inviteeUserId: v.optional(v.id("users")),
    email: v.string(),
    displayName: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("cancelled")),
    createdAt: v.number(),
  })
    .index("by_tournamentId", ["tournamentId"])
    .index("by_tournamentId_and_email", ["tournamentId", "email"])
    .index("by_inviteeUserId", ["inviteeUserId"])
    .index("by_email", ["email"]),

  registrationRoster: defineTable({
    registrationId: v.id("registrations"),
    displayName: v.string(),
    role: v.union(v.literal("captain"), v.literal("player"), v.literal("substitute"), v.literal("coach")),
  }).index("by_registrationId", ["registrationId"]),

  disputes: defineTable({
    reporterToken: v.optional(v.string()),
    matchId: v.id("matches"),
    reporterName: v.string(),
    reason: v.string(),
    evidenceUrl: v.optional(v.string()),
    status: v.union(v.literal("open"), v.literal("reviewing"), v.literal("resolved")),
    createdAt: v.number(),
  }).index("by_matchId", ["matchId"]),

  announcements: defineTable({
    tournamentId: v.id("tournaments"),
    title: v.string(),
    body: v.string(),
    pinned: v.boolean(),
    createdAt: v.number(),
  }).index("by_tournamentId", ["tournamentId"]),

  rankings: defineTable({
    gameId,
    competitorKey: v.string(),
    displayName: v.string(),
    kind: v.union(v.literal("player"), v.literal("team")),
    slug: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    rating: v.number(),
    wins: v.number(),
    losses: v.number(),
    tournamentsWon: v.number(),
    updatedAt: v.number(),
  })
    .index("by_gameId_and_rating", ["gameId", "rating"])
    .index("by_competitorKey", ["competitorKey"]),

  champions: defineTable({
    tournamentId: v.id("tournaments"),
    gameId,
    tournamentName: v.string(),
    winnerName: v.string(),
    winnerSlug: v.optional(v.string()),
    winnerKind: v.union(v.literal("player"), v.literal("team")),
    countryCode: v.optional(v.string()),
    completedAt: v.number(),
  })
    .index("by_gameId_and_completedAt", ["gameId", "completedAt"])
    .index("by_tournamentId", ["tournamentId"]),
});
