import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requirePlatformAdmin } from "./model/platformAuth";

const roleValidator = v.union(v.literal("user"), v.literal("platform_admin"));

export const currentRole = query({
  args: {},
  returns: v.union(roleValidator, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    return user?.role ?? "user";
  },
});

export const setRole = mutation({
  args: { userId: v.id("users"), role: roleValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { user: actor } = await requirePlatformAdmin(ctx);
    if (actor._id === args.userId && args.role !== "platform_admin") throw new Error("Administrators cannot remove their own platform access.");
    const user = await ctx.db.get("users", args.userId);
    if (!user) throw new Error("User not found.");
    await ctx.db.patch(user._id, { role: args.role });
    return null;
  },
});

// Internal-only bootstrap. Running this against production is a separate, consent-gated operation.
export const bootstrapByEmail = internalMutation({
  args: { email: v.string() },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const user = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).unique();
    if (!user) throw new Error("No Arena account exists for that exact email address.");
    await ctx.db.patch(user._id, { role: "platform_admin" });
    return user._id;
  },
});
