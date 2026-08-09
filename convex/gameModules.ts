import { query } from "./_generated/server";
import { v } from "convex/values";
import { gameId } from "./schema";

export const GAME_RULES = {
  efootball: {
    id: "efootball" as const,
    name: "eFootball",
    competitorKind: "player" as const,
    teamSize: 1,
    defaultBestOf: 1,
    allowsDrawsInLeague: true,
    standingsMode: "football" as const,
    scoreLabel: "Goals",
    formats: ["Round Robin", "Groups + Knockout", "Single Elimination", "Double Elimination", "League", "Single Group + Finals"],
    statFields: ["Goals", "Possession", "Shots", "Cards"],
  },
  valorant: {
    id: "valorant" as const,
    name: "VALORANT",
    competitorKind: "team" as const,
    teamSize: 5,
    defaultBestOf: 3,
    allowsDrawsInLeague: false,
    standingsMode: "valorant" as const,
    scoreLabel: "Maps",
    formats: ["Single Elimination", "Double Elimination", "Groups + Knockout", "League"],
    statFields: ["Maps", "Rounds", "Kills", "Deaths", "Assists", "ACS"],
  },
};

export type GameModuleId = keyof typeof GAME_RULES;

export function rulesFor(game?: string) {
  return GAME_RULES[game === "valorant" ? "valorant" : "efootball"];
}

export function isKnockoutFormat(format: string) {
  return ["Knockout", "Single Elimination", "Double Elimination"].includes(format);
}

export function isKnockoutMatch(round?: string, bracketRound?: number) {
  return bracketRound !== undefined || Boolean(round && ["Round of 32", "Round of 16", "Quarter-Final", "Semi-Final", "Final", "Grand Final"].includes(round));
}

const moduleValidator = v.object({
  id: gameId,
  name: v.string(),
  competitorKind: v.union(v.literal("player"), v.literal("team")),
  teamSize: v.number(),
  defaultBestOf: v.number(),
  allowsDrawsInLeague: v.boolean(),
  standingsMode: v.union(v.literal("football"), v.literal("valorant")),
  scoreLabel: v.string(),
  formats: v.array(v.string()),
  statFields: v.array(v.string()),
});

export const list = query({
  args: {},
  returns: v.array(moduleValidator),
  handler: async () => [GAME_RULES.efootball, GAME_RULES.valorant],
});

export const get = query({
  args: { gameId },
  returns: moduleValidator,
  handler: async (_ctx, args) => GAME_RULES[args.gameId],
});
