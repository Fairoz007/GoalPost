import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tournaments: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    format: v.union(v.literal("Knockout"), v.literal("League"), v.literal("Groups"), v.literal("Single Group + Finals")),
    status: v.union(v.literal("Upcoming"), v.literal("Ongoing"), v.literal("Completed")),
    adminCode: v.optional(v.string()),
  }),
  groups: defineTable({
    name: v.string(),
    tournamentId: v.id("tournaments"),
  }),
  participants: defineTable({
    name: v.string(),
    tournamentId: v.id("tournaments"),
    groupId: v.optional(v.id("groups")),
    teamName: v.optional(v.string()), // e.g. Real Madrid
    flag: v.optional(v.string()), // e.g. 🇧🇷, 🇦🇷
  }),
  matches: defineTable({
    tournamentId: v.id("tournaments"),
    groupId: v.optional(v.id("groups")),
    player1Id: v.id("participants"),
    player2Id: v.id("participants"),
    player1Score: v.optional(v.number()),
    player2Score: v.optional(v.number()),
    status: v.union(v.literal("Scheduled"), v.literal("Live"), v.literal("Completed")),
    date: v.string(),
    round: v.optional(v.string()),
  }),
});
