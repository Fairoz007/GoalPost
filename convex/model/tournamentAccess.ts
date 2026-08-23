import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { isPlatformAdmin } from "./platformAuth";

type DbCtx = QueryCtx | MutationCtx;

export async function canManageTournament(ctx: DbCtx, tournament: Doc<"tournaments">) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return false;
  if (tournament.ownerToken === identity.tokenIdentifier) return true;
  return await isPlatformAdmin(ctx);
}

export async function requireVisibleTournament(ctx: DbCtx, tournamentId: Id<"tournaments">) {
  const tournament = await ctx.db.get("tournaments", tournamentId);
  if (!tournament) return null;
  if (tournament.status !== "Draft") return tournament;
  return (await canManageTournament(ctx, tournament)) ? tournament : null;
}
