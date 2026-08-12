export function getTournamentEditCode(tournamentId: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(`admin_code_${tournamentId}`) ?? "";
}
