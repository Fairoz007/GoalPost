import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isConvexId } from "@/lib/convex-id";
export const metadata: Metadata = { title: "Match", robots: { index: false, follow: true } };
export default async function MatchLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) { const { id } = await params; if (!isConvexId(id)) notFound(); return children; }
