import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; try { const team = await fetchQuery(api.arena.getTeam, { slug }); return team ? { title: `${team.name} · Team`, description: `${team.name}'s D-One Arena roster and competitive history.`, alternates: { canonical: `/team/${slug}` } } : { title: "Team not found", robots: { index: false } }; } catch { return { title: "Team profile" }; } }
export default function TeamLayout({ children }: { children: React.ReactNode }) { return children; }
