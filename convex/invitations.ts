import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity, requireTournamentOwner } from "./model/auth";

const inviteValidator = v.object({
  _id: v.id("tournamentInvites"),
  _creationTime: v.number(),
  tournamentId: v.id("tournaments"),
  inviteeUserId: v.optional(v.id("users")),
  email: v.string(),
  displayName: v.optional(v.string()),
  status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("cancelled")),
  createdAt: v.number(),
});

export const create = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    email: v.string(),
    userId: v.optional(v.id("users")),
  },
  returns: v.id("tournamentInvites"),
  handler: async (ctx, args) => {
    const [identity] = await Promise.all([
      requireIdentity(ctx),
      requireTournamentOwner(ctx, args.tournamentId),
    ]);
    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
    const user = args.userId ? await ctx.db.get("users", args.userId) : await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).first();
    if (args.userId && (!user || user.email?.toLowerCase() !== email)) throw new Error("The selected account does not match this email address.");
    const existing = await ctx.db
      .query("tournamentInvites")
      .withIndex("by_tournamentId_and_email", (q) => q.eq("tournamentId", args.tournamentId).eq("email", email))
      .first();
    if (existing && existing.status !== "cancelled") throw new Error("This email has already been invited.");
    if (existing) {
      await ctx.db.patch(existing._id, {
        inviterToken: identity.tokenIdentifier,
        inviteeUserId: user?._id,
        displayName: user?.name,
        status: "pending",
        createdAt: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert("tournamentInvites", {
      tournamentId: args.tournamentId,
      inviterToken: identity.tokenIdentifier,
      inviteeUserId: user?._id,
      email,
      displayName: user?.name,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const listForTournament = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(inviteValidator),
  handler: async (ctx, args) => {
    await requireTournamentOwner(ctx, args.tournamentId);
    const invites = await ctx.db
      .query("tournamentInvites")
      .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
      .order("desc")
      .take(200);
    return invites.map(({ inviterToken: _inviterToken, ...invite }) => invite);
  },
});

export const cancel = mutation({
  args: { inviteId: v.id("tournamentInvites") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invite = await ctx.db.get("tournamentInvites", args.inviteId);
    if (!invite) throw new Error("Invitation not found.");
    await requireTournamentOwner(ctx, invite.tournamentId);
    await ctx.db.patch(invite._id, { status: "cancelled" });
    return null;
  },
});
