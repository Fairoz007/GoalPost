import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    format: v.union(v.literal("Knockout"), v.literal("League"), v.literal("Groups"), v.literal("Single Group + Finals")),
    status: v.union(v.literal("Upcoming"), v.literal("Ongoing"), v.literal("Completed")),
    adminCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tournaments", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("tournaments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("Upcoming"), v.literal("Ongoing"), v.literal("Completed"))),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("tournaments") },
  handler: async (ctx, args) => {
    // In a real app we'd need to cascade delete matches, groups, participants. 
    // For now we just delete the tournament.
    await ctx.db.delete(args.id);
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").order("desc").collect();
    return tournaments.map((t) => {
      const { adminCode, ...rest } = t;
      return { ...rest, hasAdminCode: !!adminCode };
    });
  },
});

export const getById = query({
  args: { id: v.id("tournaments") },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.id);
    if (!tournament) return null;
    
    const { adminCode, ...rest } = tournament;
    return { ...rest, hasAdminCode: !!adminCode };
  },
});

export const verifyAdminCode = query({
  args: { id: v.id("tournaments"), code: v.string() },
  handler: async (ctx, args) => {
    const tournament = await ctx.db.get(args.id);
    if (!tournament || !tournament.adminCode) return false;
    return tournament.adminCode === args.code;
  },
});

export const backfillAdminCodes = mutation({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").collect();
    for (const t of tournaments) {
      if (!t.adminCode) {
        await ctx.db.patch(t._id, { adminCode: "000000" });
      }
    }
  }
});
