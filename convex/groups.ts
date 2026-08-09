import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: { name: v.string(), tournamentId: v.id("tournaments"), order: v.optional(v.number()) },
  returns: v.id("groups"),
  handler: async (ctx, args) => await ctx.db.insert("groups", args),
});

export const getByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(v.any()),
  handler: async (ctx, args) => await ctx.db.query("groups").withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId)).take(64),
});

export const remove = mutation({
  args: { id: v.id("groups") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const participants = await ctx.db.query("participants").withIndex("by_groupId", (q) => q.eq("groupId", args.id)).take(256);
    for (const participant of participants) await ctx.db.patch(participant._id, { groupId: undefined });
    await ctx.db.delete(args.id);
    return null;
  },
});
