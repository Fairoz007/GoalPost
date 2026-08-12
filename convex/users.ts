import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./model/auth";

const publicUser = v.object({
  _id: v.id("users"),
  name: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
});

export const ensureCurrent = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    const values = {
      clerkUserId: identity.subject,
      name: identity.name,
      email: identity.email,
      imageUrl: identity.pictureUrl,
      lastSeenAt: Date.now(),
    };
    if (existing) {
      await ctx.db.patch(existing._id, values);
      return existing._id;
    }
    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      ...values,
    });
  },
});

export const current = query({
  args: {},
  returns: v.union(publicUser, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    return user ? { _id: user._id, name: user.name, imageUrl: user.imageUrl } : null;
  },
});

export const listDirectory = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(v.object({
    _id: v.id("users"),
    name: v.optional(v.string()),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  })),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const tournament = await ctx.db.get("tournaments", args.tournamentId);
    if (!tournament || tournament.ownerToken !== identity.tokenIdentifier) {
      throw new Error("You do not have permission to view the user directory for this tournament.");
    }
    const users = await ctx.db.query("users").order("desc").take(250);
    return users
      .filter((user): user is typeof user & { email: string } => Boolean(user.email))
      .map((user) => ({ _id: user._id, name: user.name, email: user.email, imageUrl: user.imageUrl }));
  },
});
