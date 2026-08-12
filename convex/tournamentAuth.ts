import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireTournamentOwner } from "./model/auth";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTournamentAdminCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export function codesMatch(storedCode: string, suppliedCode: string) {
  if (storedCode.length !== suppliedCode.length) return false;
  let difference = 0;
  for (let index = 0; index < storedCode.length; index += 1) {
    difference |= storedCode.charCodeAt(index) ^ suppliedCode.charCodeAt(index);
  }
  return difference === 0;
}

export async function requireTournamentAdmin(
  ctx: QueryCtx | MutationCtx,
  tournamentId: Id<"tournaments">,
  _legacyCode?: string,
) {
  return await requireTournamentOwner(ctx, tournamentId);
}
