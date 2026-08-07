import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByTournament = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("matches")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();
  },
});

export const getByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("matches")
      .filter((q) => q.eq(q.field("groupId"), args.groupId))
      .collect();
  },
});

export const updateScore = mutation({
  args: {
    matchId: v.id("matches"),
    player1Score: v.number(),
    player2Score: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.matchId, {
      player1Score: args.player1Score,
      player2Score: args.player2Score,
      status: "Completed",
    });
  },
});

export const generateGroupMatches = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    // 1. Get participants (either in specific group, or all in tournament if no group)
    let participants;
    if (args.groupId) {
      participants = await ctx.db
        .query("participants")
        .filter((q) => q.eq(q.field("groupId"), args.groupId))
        .collect();
    } else {
      participants = await ctx.db
        .query("participants")
        .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
        .collect();
    }

    if (participants.length < 2) {
      throw new Error("Not enough participants to generate matches.");
    }

    // 2. Generate Single Round Robin Matches
    const newMatches = [];
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        newMatches.push({
          tournamentId: args.tournamentId,
          groupId: args.groupId,
          player1Id: participants[i]._id,
          player2Id: participants[j]._id,
          status: "Scheduled" as const,
          date: new Date().toISOString(), // Default to now
          round: "Group Stage",
        });
      }
    }

    // 3. Shuffle matches using Fisher-Yates to guarantee random schedule order
    for (let i = newMatches.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newMatches[i], newMatches[j]] = [newMatches[j], newMatches[i]];
    }

    // 4. Insert matches
    for (const match of newMatches) {
      await ctx.db.insert("matches", match);
    }

    return newMatches.length;
  },
});

export const generateKnockout = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    // 1. Fetch participants and group stage matches
    const participants = await ctx.db
      .query("participants")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();

    const matches = await ctx.db
      .query("matches")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();

    // 2. Calculate Standings precisely
    const standings = participants.map(p => {
      let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
      matches.forEach(m => {
        if (m.status !== "Completed" || (m.round && m.round !== "Group Stage")) return;
        if (m.player1Score === undefined || m.player2Score === undefined) return;
        if (m.player1Id === p._id) {
          gf += m.player1Score; ga += m.player2Score;
          if (m.player1Score > m.player2Score) won++; else if (m.player1Score === m.player2Score) drawn++; else lost++;
        } else if (m.player2Id === p._id) {
          gf += m.player2Score; ga += m.player1Score;
          if (m.player2Score > m.player1Score) won++; else if (m.player2Score === m.player1Score) drawn++; else lost++;
        }
      });
      const gd = gf - ga;
      const points = (won * 3) + (drawn * 1);
      return { ...p, points, gd, gf };
    }).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

    if (standings.length < 4) {
      throw new Error("Not enough participants to run a Semi-Final bracket.");
    }

    const top4 = standings.slice(0, 4);

    // Semi-Final 1: 1st vs 4th
    await ctx.db.insert("matches", {
      tournamentId: args.tournamentId,
      player1Id: top4[0]._id,
      player2Id: top4[3]._id,
      status: "Scheduled",
      date: new Date().toISOString(),
      round: "Semi-Final",
    });

    // Semi-Final 2: 2nd vs 3rd
    await ctx.db.insert("matches", {
      tournamentId: args.tournamentId,
      player1Id: top4[1]._id,
      player2Id: top4[2]._id,
      status: "Scheduled",
      date: new Date().toISOString(),
      round: "Semi-Final",
    });
  },
});

export const createFinal = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    player1Id: v.id("participants"),
    player2Id: v.id("participants"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("matches", {
      tournamentId: args.tournamentId,
      player1Id: args.player1Id,
      player2Id: args.player2Id,
      status: "Scheduled",
      date: new Date().toISOString(),
      round: "Final",
    });
  }
});

export const resetKnockout = mutation({
  args: {
    tournamentId: v.id("tournaments"),
  },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .filter((q) => q.eq(q.field("tournamentId"), args.tournamentId))
      .collect();
      
    for (const match of matches) {
      if (match.round === "Semi-Final" || match.round === "Final") {
        await ctx.db.delete(match._id);
      }
    }
  }
});
