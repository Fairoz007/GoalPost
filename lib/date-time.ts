export const DEFAULT_EVENT_TIMEZONE = "Asia/Muscat";

export function formatEventDate(value: string | number, timezone = DEFAULT_EVENT_TIMEZONE, options: Intl.DateTimeFormatOptions = {}) {
  try {
    return new Intl.DateTimeFormat(undefined, { timeZone: timezone, dateStyle: "medium", timeStyle: "short", ...options }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }
}
