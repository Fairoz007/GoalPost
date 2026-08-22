import { ConvexError } from "convex/values";

export function normalizeWhatsAppNumber(rawNumber: string) {
  const phoneNumber = rawNumber.replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
    throw new ConvexError(
      "Enter a valid WhatsApp number with country code, for example +968 9123 4567.",
    );
  }

  const digits = phoneNumber.slice(1);
  if (/^(\d)\1+$/.test(digits) || "01234567890123456789".includes(digits)) {
    throw new ConvexError("Enter a genuine WhatsApp contact number.");
  }

  return phoneNumber;
}
