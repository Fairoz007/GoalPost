import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> { const { username } = await params; try { const player = await fetchQuery(api.arena.getPlayer, { username }); return player ? { title: `${player.name} · Player`, description: `${player.name}'s D-One Arena match history and competitive profile.`, alternates: { canonical: `/player/${username}` } } : { title: "Player not found", robots: { index: false } }; } catch { return { title: "Player profile" }; } }
export default function PlayerLayout({ children }: { children: React.ReactNode }) { return children; }
