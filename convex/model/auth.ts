import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { ConvexError } from "convex/values";

type AuthCtx = QueryCtx | MutationCtx;

export async function requireIdentity(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("You must sign in to continue.");
  return identity;
}

export async function requireTournamentOwner(
  ctx: AuthCtx,
  tournamentId: Id<"tournaments">,
): Promise<Doc<"tournaments">> {
  const [identity, tournament] = await Promise.all([
    requireIdentity(ctx),
    ctx.db.get("tournaments", tournamentId),
  ]);
  if (!tournament) throw new ConvexError("Tournament not found.");
  if (!tournament.ownerToken || tournament.ownerToken !== identity.tokenIdentifier) {
    throw new ConvexError("You do not have permission to manage this tournament.");
  }
  return tournament;
}
