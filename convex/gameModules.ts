import { query } from "./_generated/server";
import { v } from "convex/values";
import { gameId } from "./schema";

export const VALORANT_MODE_RULES = {
  scrimmage: {
    label: "Scrimmage",
    summary: "Organizer-led custom 5v5 practice matches.",
    rules: "Custom 5v5 lobby. Standard abilities and economy. Map pool and side selection are set by the organizer. Results do not affect competitive seeding unless announced before play.",
  },
  escalation: {
    label: "Escalation",
    summary: "Team gun-progression race using Escalation rules.",
    rules: "5v5 Escalation lobby. Teams advance through the weapon levels together. The first team to complete the final level wins; if time expires, the team furthest through the progression wins.",
  },
  unrated_competitive: {
    label: "Unrated — Competitive Rules",
    summary: "An unrated lobby played with competitive scoring.",
    rules: "Standard 5v5 plant/defuse. First to 13 rounds, with sides swapped after 12 rounds. At 12–12, overtime continues until a team wins by two rounds. Organizer map veto rules apply.",
  },
  standard_unrated: {
    label: "Normal Unrated",
    summary: "Standard unrated plant/defuse match rules.",
    rules: "Standard 5v5 plant/defuse. First to 13 rounds, with sides swapped after 12 rounds. A 12–12 score is decided by one sudden-death overtime round.",
  },
  deathmatch: {
    label: "Deathmatch",
    summary: "Free-for-all aim competition scored per match.",
    rules: "Free-for-all Deathmatch lobby. Abilities are disabled. The first player to 40 kills wins; if the timer expires, the player with the most kills wins. Ties are resolved by fewer deaths, then earliest final kill.",
  },
} as const;

export type ValorantMatchMode = keyof typeof VALORANT_MODE_RULES;

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

export function valorantModeRules(mode?: ValorantMatchMode) {
  return VALORANT_MODE_RULES[mode ?? "scrimmage"];
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
