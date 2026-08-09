import { Crosshair, Gamepad2, type LucideIcon } from "lucide-react";

export type GameId = "efootball" | "valorant";
export type GameModule = { id: GameId; name: string; shortName: string; description: string; teamSize: number; competitorLabel: string; accent: string; formats: string[]; standings: { scored: string; conceded: string; differential: string }; stats: string[]; Icon: LucideIcon };

export const gameModules: Record<GameId, GameModule> = {
  efootball: { id: "efootball", name: "eFootball", shortName: "EFT", description: "Precision 1v1 football. Every pass, press, and finish matters.", teamSize: 1, competitorLabel: "Player", accent: "#ef233c", formats: ["Round Robin", "Groups + Knockout", "Single Elimination", "Double Elimination", "League"], standings: { scored: "GF", conceded: "GA", differential: "GD" }, stats: ["Goals", "Possession", "Shots", "Cards"], Icon: Gamepad2 },
  valorant: { id: "valorant", name: "VALORANT", shortName: "VLT", description: "Tactical 5v5 competition where coordinated teams become legends.", teamSize: 5, competitorLabel: "Team", accent: "#ff4655", formats: ["Single Elimination", "Double Elimination", "Groups + Knockout", "League"], standings: { scored: "MW", conceded: "ML", differential: "RD" }, stats: ["Map Score", "Rounds", "K/D/A", "ACS"], Icon: Crosshair },
};

export function getGameModule(id?: string): GameModule { return gameModules[id === "valorant" ? "valorant" : "efootball"]; }
