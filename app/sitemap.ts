import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const origin = "https://arena.donestudio.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    ["", "daily", 1],
    ["/tournaments", "daily", 0.9],
    ["/games", "weekly", 0.8],
    ["/games/efootball", "weekly", 0.8],
    ["/games/valorant", "weekly", 0.8],
    ["/rankings", "daily", 0.8],
    ["/champions", "weekly", 0.7],
    ["/about", "monthly", 0.5],
    ["/privacy", "yearly", 0.3],
    ["/terms", "yearly", 0.3],
  ].map(([path, changeFrequency, priority]) => ({
    url: `${origin}${path}`,
    changeFrequency: changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: priority as number,
  }));
  try {
    const discovery = await fetchQuery(api.tournaments.getDiscovery);
    return staticRoutes.concat(discovery.tournaments.filter((tournament) => tournament.slug).map((tournament) => ({
      url: `${origin}/tournament/${tournament.slug}`,
      lastModified: new Date(tournament._creationTime),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })));
  } catch { return staticRoutes; }
}
