import { ConvexError } from "convex/values";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = QueryCtx | MutationCtx;

export async function getCurrentUser(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("You must sign in to continue.");
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError("Complete account setup before continuing.");
  return { identity, user };
}

export async function requirePlatformAdmin(ctx: AuthCtx) {
  const current = await getCurrentUser(ctx);
  if (current.user.role !== "platform_admin") {
    throw new ConvexError("Platform administrator access is required.");
  }
  return current;
}

export async function isPlatformAdmin(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;
  const user = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  return user?.role === "platform_admin";
}
