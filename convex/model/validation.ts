import { ConvexError } from "convex/values";

export function cleanRequired(value: string, label: string, maxLength = 120) {
  const clean = value.trim();
  if (!clean) throw new ConvexError(`${label} is required.`);
  if (clean.length > maxLength) throw new ConvexError(`${label} must be ${maxLength} characters or fewer.`);
  return clean;
}

export function cleanOptional(value: string | undefined, label: string, maxLength: number) {
  if (value === undefined) return undefined;
  const clean = value.trim();
  if (!clean) return undefined;
  if (clean.length > maxLength) throw new ConvexError(`${label} must be ${maxLength} characters or fewer.`);
  return clean;
}

export function validIsoDate(value: string | undefined, label: string) {
  if (value === undefined || value.trim() === "") return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new ConvexError(`${label} must be a valid date and time.`);
  return new Date(timestamp).toISOString();
}

export function validateWhatsAppInvite(value: string | undefined) {
  if (value === undefined || value.trim() === "") return undefined;
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new ConvexError("Enter a valid WhatsApp invite URL."); }
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "chat.whatsapp.com" || url.pathname.split("/").filter(Boolean).length !== 1) {
    throw new ConvexError("WhatsApp invites must use https://chat.whatsapp.com/<invite-code>.");
  }
  return url.toString();
}

export function validateBestOf(value: number | undefined) {
  if (value !== undefined && ![1, 3, 5].includes(value)) throw new ConvexError("Series length must be best-of-1, best-of-3, or best-of-5.");
}

export function validateSlots(value: number | undefined) {
  if (value !== undefined && (!Number.isInteger(value) || value < 2 || value > 128)) throw new ConvexError("Maximum slots must be a whole number between 2 and 128.");
}

export function validateTimeZone(value: string | undefined) {
  const timezone = value?.trim() || "Asia/Muscat";
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(0); }
  catch { throw new ConvexError("Choose a valid IANA timezone, such as Asia/Muscat."); }
  return timezone;
}

export type ValorantRosterMember = {
  displayName: string;
  valorantId?: string;
  role: "captain" | "player" | "substitute" | "coach";
  countryCode?: string;
};

function cleanValorantId(value: string | undefined, playerLabel: string) {
  const riotId = value?.trim();
  if (!riotId) throw new ConvexError(`${playerLabel} needs a VALORANT Riot ID in the format GameName#Tag.`);
  const parts = riotId.split("#");
  if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim() || riotId.length > 40) {
    throw new ConvexError(`${playerLabel} needs a valid VALORANT Riot ID in the format GameName#Tag.`);
  }
  return `${parts[0].trim()}#${parts[1].trim()}`;
}

export function cleanValorantRoster(roster: ValorantRosterMember[], starterCount = 5) {
  if (roster.some((member) => member.role === "coach")) {
    throw new ConvexError("Coaches are not player slots. Register five starters, with two substitutes if needed.");
  }
  const starters = roster.filter((member) => member.role === "captain" || member.role === "player");
  const substitutes = roster.filter((member) => member.role === "substitute");
  if (starters.length !== starterCount || (substitutes.length !== 0 && substitutes.length !== 2) || roster.length !== starters.length + substitutes.length) {
    throw new ConvexError(`A VALORANT roster must contain exactly ${starterCount} starting players, or ${starterCount + 2} players including two substitutes.`);
  }
  if (starters.filter((member) => member.role === "captain").length !== 1) {
    throw new ConvexError("A VALORANT roster must have exactly one captain.");
  }
  const cleaned = roster.map((member, index) => {
    const displayName = cleanRequired(member.displayName, `Player ${index + 1} name`, 80);
    return {
      ...member,
      displayName,
      valorantId: cleanValorantId(member.valorantId, displayName),
      countryCode: member.countryCode?.trim().toUpperCase() || undefined,
    };
  });
  const names = cleaned.map((member) => member.displayName.toLowerCase());
  if (new Set(names).size !== names.length) throw new ConvexError("Every VALORANT roster player needs a unique name.");
  const riotIds = cleaned.map((member) => member.valorantId.toLowerCase());
  if (new Set(riotIds).size !== riotIds.length) throw new ConvexError("Every VALORANT roster player needs a unique Riot ID.");
  return cleaned;
}
