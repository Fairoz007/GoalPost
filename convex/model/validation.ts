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
