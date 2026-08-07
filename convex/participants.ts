import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    tournamentId: v.id("tournaments"),
    teamName: v.optional(v.string()),
    flag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("participants", args);
  },
});

export const getByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("participants")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();
  },
});

export const getAllUnique = query({
  args: {},
  handler: async (ctx) => {
    const allParticipants = await ctx.db.query("participants").collect();
    
    // Deduplicate by name
    const uniqueMap = new Map();
    for (const p of allParticipants) {
      if (!uniqueMap.has(p.name)) {
        uniqueMap.set(p.name, p);
      }
    }
    
    return Array.from(uniqueMap.values());
  },
});

export const assignToGroup = mutation({
  args: {
    participantId: v.id("participants"),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.participantId, { groupId: args.groupId });
  },
});

export const remove = mutation({
  args: { id: v.id("participants") },
  handler: async (ctx, args) => {
    // Also remove matches involving this participant? For simplicity, we just delete the participant.
    return await ctx.db.delete(args.id);
  },
});
