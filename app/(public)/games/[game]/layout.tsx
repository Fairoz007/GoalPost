import type { Metadata } from "next";
import { notFound } from "next/navigation";

const games = {
  efootball: { title: "eFootball Tournaments", description: "Compete in D-One Arena eFootball tournaments." },
  valorant: { title: "VALORANT Tournaments", description: "Compete in D-One Arena VALORANT tournaments." },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params;
  const entry = games[game as keyof typeof games];
  if (!entry) return {};
  return { ...entry, alternates: { canonical: `/games/${game}` } };
}

export default async function GameLayout({ children, params }: { children: React.ReactNode; params: Promise<{ game: string }> }) {
  const { game } = await params;
  if (!(game in games)) notFound();
  return children;
}
