import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("groups", args);
  },
});

export const getByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groups")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();
  },
});

export const remove = mutation({
  args: { id: v.id("groups") },
  handler: async (ctx, args) => {
    // Optionally unassign teams first, or let them just point to a non-existent group (or clean up)
    const participants = await ctx.db
      .query("participants")
      .filter((q) => q.eq(q.field("groupId"), args.id))
      .collect();
    for (const participant of participants) {
      await ctx.db.patch(participant._id, { groupId: undefined });
    }
    return await ctx.db.delete(args.id);
  },
});
