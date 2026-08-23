import type { MutationCtx } from "../_generated/server";

export async function adjustPlatformStats(
  ctx: MutationCtx,
  delta: Partial<{ activeTournaments: number; registeredCompetitors: number; completedMatches: number }>,
) {
  const row = await ctx.db.query("platformStats").withIndex("by_key", (q) => q.eq("key", "global")).unique();
  if (!row) return;
  await ctx.db.patch(row._id, {
    activeTournaments: Math.max(0, row.activeTournaments + (delta.activeTournaments ?? 0)),
    registeredCompetitors: Math.max(0, row.registeredCompetitors + (delta.registeredCompetitors ?? 0)),
    completedMatches: Math.max(0, row.completedMatches + (delta.completedMatches ?? 0)),
    updatedAt: Date.now(),
  });
}
