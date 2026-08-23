import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireIdentity } from "./model/auth";
import { normalizeWhatsAppNumber } from "./model/contact";
import { requirePlatformAdmin } from "./model/platformAuth";

const publicUser = v.object({
  _id: v.id("users"),
  name: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
});

const rosterMemberValidator = v.object({
  displayName: v.string(),
  role: v.union(v.literal("captain"), v.literal("player"), v.literal("coach"), v.literal("substitute")),
  countryCode: v.optional(v.string()),
});

const userProfileValidator = v.object({
  _id: v.id("users"),
  name: v.optional(v.string()),
  email: v.optional(v.string()),
  imageUrl: v.optional(v.string()),
  gamerTag: v.optional(v.string()),
  phone: v.optional(v.string()),
  countryCode: v.optional(v.string()),
  discordTag: v.optional(v.string()),
  efootballId: v.optional(v.string()),
  valorantId: v.optional(v.string()),
  captainName: v.optional(v.string()),
  defaultRoster: v.optional(v.array(rosterMemberValidator)),
  profileCompleted: v.optional(v.boolean()),
});

export const ensureCurrent = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    const values = {
      clerkUserId: identity.subject,
      name: identity.name,
      email: identity.email,
      imageUrl: identity.pictureUrl,
      lastSeenAt: Date.now(),
    };
    if (existing) {
      const now = Date.now();
      const shouldRefresh = now - existing.lastSeenAt >= 15 * 60 * 1000
        || existing.clerkUserId !== identity.subject
        || (identity.email !== undefined && existing.email !== identity.email)
        || (identity.pictureUrl !== undefined && existing.imageUrl !== identity.pictureUrl);
      if (shouldRefresh) {
        await ctx.db.patch(existing._id, {
          clerkUserId: identity.subject,
          email: identity.email ?? existing.email,
          imageUrl: identity.pictureUrl ?? existing.imageUrl,
          lastSeenAt: now,
          name: existing.name || identity.name,
        });
      }
      return existing._id;
    }
    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      ...values,
    });
  },
});

export const current = query({
  args: {},
  returns: v.union(publicUser, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    return user ? { _id: user._id, name: user.name, imageUrl: user.imageUrl } : null;
  },
});

export const getProfile = query({
  args: {},
  returns: v.union(userProfileValidator, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      gamerTag: user.gamerTag,
      phone: user.phone,
      countryCode: user.countryCode,
      discordTag: user.discordTag,
      efootballId: user.efootballId,
      valorantId: user.valorantId,
      captainName: user.captainName,
      defaultRoster: user.defaultRoster,
      profileCompleted: Boolean(user.profileCompleted),
    };
  },
});

export const updateProfile = mutation({
  args: {
    name: v.string(),
    gamerTag: v.optional(v.string()),
    phone: v.string(),
    countryCode: v.string(),
    discordTag: v.optional(v.string()),
    efootballId: v.optional(v.string()),
    valorantId: v.optional(v.string()),
    captainName: v.optional(v.string()),
    defaultRoster: v.optional(v.array(rosterMemberValidator)),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    const cleanName = args.name.trim();
    const cleanGamerTag = args.gamerTag?.trim() || cleanName;
    const cleanPhone = normalizeWhatsAppNumber(args.phone);
    const cleanCountry = args.countryCode.trim().toUpperCase();
    const cleanDiscord = args.discordTag?.trim();
    const cleanEfootballId = args.efootballId?.trim();
    const cleanValorantId = args.valorantId?.trim();
    const cleanCaptain = args.captainName?.trim() || cleanName;

    if (!cleanName) throw new Error("Full name is required.");
    if (!cleanCountry) throw new Error("Please select your country.");
    if ((args.defaultRoster?.length ?? 0) > 12) throw new Error("A saved roster can contain at most 12 members.");
    if (args.defaultRoster?.some((member) => !member.displayName.trim() || member.displayName.trim().length > 80)) throw new Error("Every roster member needs a name of 80 characters or fewer.");

    const updateData = {
      name: cleanName,
      gamerTag: cleanGamerTag,
      phone: cleanPhone,
      countryCode: cleanCountry,
      discordTag: cleanDiscord,
      efootballId: cleanEfootballId,
      valorantId: cleanValorantId,
      captainName: cleanCaptain,
      defaultRoster: args.defaultRoster,
      profileCompleted: true,
      lastSeenAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      clerkUserId: identity.subject,
      email: identity.email,
      imageUrl: identity.pictureUrl,
      ...updateData,
    });
  },
});

export const listDirectory = query({
  args: { tournamentId: v.id("tournaments") },
  returns: v.array(v.object({
    _id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    alreadyParticipant: v.boolean(),
  })),
  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);
    const tournament = await ctx.db.get("tournaments", args.tournamentId);
    if (!tournament) throw new Error("Tournament not found.");
    const [users, participants] = await Promise.all([
      ctx.db.query("users").order("desc").take(250),
      ctx.db
        .query("participants")
        .withIndex("by_tournamentId", (q) => q.eq("tournamentId", args.tournamentId))
        .take(128),
    ]);
    const participatingUserIds = new Set(
      participants.flatMap((participant) => participant.userId ? [participant.userId] : []),
    );
    return users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      alreadyParticipant: participatingUserIds.has(user._id),
    }));
  },
});

export const deleteMyData = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const user = await ctx.db.query("users").withIndex("by_tokenIdentifier", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    const owned = await ctx.db.query("tournaments").withIndex("by_ownerToken", (q) => q.eq("ownerToken", identity.tokenIdentifier)).take(1);
    if (owned.length) throw new Error("Transfer or delete your tournaments before deleting your Arena account.");

    const registrations = await ctx.db.query("registrations").withIndex("by_ownerToken", (q) => q.eq("ownerToken", identity.tokenIdentifier)).take(201);
    if (registrations.length > 200) throw new Error("This account requires assisted deletion. Contact support.");
    for (const registration of registrations) {
      const roster = await ctx.db.query("registrationRoster").withIndex("by_registrationId", (q) => q.eq("registrationId", registration._id)).take(16);
      for (const member of roster) await ctx.db.delete(member._id);
      await ctx.db.delete(registration._id);
    }

    const participants = await ctx.db.query("participants").take(1024);
    if (participants.length === 1024) throw new Error("This account requires assisted deletion. Contact support.");
    for (const participant of participants) if (participant.userId === user._id) await ctx.db.patch(participant._id, { userId: undefined });
    const invites = await ctx.db.query("tournamentInvites").withIndex("by_inviteeUserId", (q) => q.eq("inviteeUserId", user._id)).take(200);
    for (const invite of invites) await ctx.db.delete(invite._id);
    const teams = await ctx.db.query("teams").take(256);
    for (const team of teams) if (team.ownerToken === identity.tokenIdentifier) await ctx.db.patch(team._id, { ownerToken: undefined });
    const ranking = await ctx.db.query("rankings").withIndex("by_competitorKey", (q) => q.eq("competitorKey", `user:${user._id}`)).unique();
    if (ranking) await ctx.db.patch(ranking._id, { displayName: "Deleted player", slug: undefined, countryCode: undefined, updatedAt: Date.now() });
    await ctx.db.delete(user._id);
    return null;
  },
});
