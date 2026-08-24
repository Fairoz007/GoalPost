import { Crosshair, Gamepad2, type LucideIcon } from "lucide-react";

export type GameId = "efootball" | "valorant";
export type ValorantMatchMode = "scrimmage" | "escalation" | "unrated_competitive" | "standard_unrated" | "deathmatch";
export type GameModule = { id: GameId; name: string; shortName: string; description: string; teamSize: number; competitorLabel: string; defaultBestOf: number; scoreLabel: string; accent: string; formats: string[]; standings: { scored: string; conceded: string; differential: string }; stats: string[]; Icon: LucideIcon };

export const gameModules: Record<GameId, GameModule> = {
  efootball: { id: "efootball", name: "eFootball", shortName: "EFT", description: "Precision 1v1 football. Every pass, press, and finish matters.", teamSize: 1, competitorLabel: "Player", defaultBestOf: 1, scoreLabel: "Goals", accent: "#ef233c", formats: ["Single Group + Finals", "Round Robin", "Groups + Knockout", "Single Elimination", "Double Elimination", "League"], standings: { scored: "GF", conceded: "GA", differential: "GD" }, stats: ["Goals", "Possession", "Shots", "Cards"], Icon: Gamepad2 },
  valorant: { id: "valorant", name: "VALORANT", shortName: "VLT", description: "Tactical 5v5 competition where coordinated teams become legends.", teamSize: 5, competitorLabel: "Team", defaultBestOf: 3, scoreLabel: "Maps", accent: "#ff4655", formats: ["Single Elimination", "Double Elimination", "Groups + Knockout", "League"], standings: { scored: "MW", conceded: "ML", differential: "RD" }, stats: ["Map Score", "Rounds", "K/D/A", "ACS"], Icon: Crosshair },
};

export const valorantMatchModes: Record<ValorantMatchMode, { name: string; summary: string; rules: string }> = {
  scrimmage: { name: "Scrimmage", summary: "Organizer-led custom 5v5 practice matches.", rules: "Custom 5v5 lobby. Standard abilities and economy. Map pool and side selection are set by the organizer. Results do not affect competitive seeding unless announced before play." },
  escalation: { name: "Escalation", summary: "Team gun-progression race using Escalation rules.", rules: "5v5 Escalation lobby. Teams advance through the weapon levels together. The first team to complete the final level wins; if time expires, the team furthest through the progression wins." },
  unrated_competitive: { name: "Unrated — Competitive Rules", summary: "An unrated lobby played with competitive scoring.", rules: "Standard 5v5 plant/defuse. First to 13 rounds, with sides swapped after 12 rounds. At 12–12, overtime continues until a team wins by two rounds. Organizer map veto rules apply." },
  standard_unrated: { name: "Normal Unrated", summary: "Standard unrated plant/defuse match rules.", rules: "Standard 5v5 plant/defuse. First to 13 rounds, with sides swapped after 12 rounds. A 12–12 score is decided by one sudden-death overtime round." },
  deathmatch: { name: "Deathmatch", summary: "Free-for-all aim competition scored per match.", rules: "Free-for-all Deathmatch lobby. Abilities are disabled. The first player to 40 kills wins; if the timer expires, the player with the most kills wins. Ties are resolved by fewer deaths, then earliest final kill." },
};

export function getGameModule(id?: string): GameModule { return gameModules[id === "valorant" ? "valorant" : "efootball"]; }
