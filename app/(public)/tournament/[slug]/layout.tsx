import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const tournament = await fetchQuery(api.tournaments.getBySlug, { slug });
    if (!tournament) return { title: "Tournament not found", robots: { index: false, follow: false } };
    const description = tournament.description?.slice(0, 160) || `${tournament.gameId === "valorant" ? "VALORANT" : "eFootball"} tournament hosted by ${tournament.organizer || "D-One Arena"}.`;
    return { title: tournament.name, description, alternates: { canonical: `/tournament/${slug}` }, openGraph: { title: tournament.name, description, type: "website", url: `/tournament/${slug}` } };
  } catch { return { title: "Tournament", alternates: { canonical: `/tournament/${slug}` } }; }
}
export default function TournamentLayout({ children }: { children: React.ReactNode }) { return children; }
