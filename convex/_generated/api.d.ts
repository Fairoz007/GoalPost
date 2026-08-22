/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as arena from "../arena.js";
import type * as gameModules from "../gameModules.js";
import type * as groups from "../groups.js";
import type * as invitations from "../invitations.js";
import type * as matches from "../matches.js";
import type * as model_auth from "../model/auth.js";
import type * as model_contact from "../model/contact.js";
import type * as model_youtube from "../model/youtube.js";
import type * as participants from "../participants.js";
import type * as tournamentAuth from "../tournamentAuth.js";
import type * as tournaments from "../tournaments.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  arena: typeof arena;
  gameModules: typeof gameModules;
  groups: typeof groups;
  invitations: typeof invitations;
  matches: typeof matches;
  "model/auth": typeof model_auth;
  "model/contact": typeof model_contact;
  "model/youtube": typeof model_youtube;
  participants: typeof participants;
  tournamentAuth: typeof tournamentAuth;
  tournaments: typeof tournaments;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
