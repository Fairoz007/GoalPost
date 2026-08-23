import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isConvexId } from "@/lib/convex-id";
export const metadata: Metadata = { title: "Tournament Broadcast Overlay", robots: { index: false, follow: false } };
export default async function OverlayLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) { const { id } = await params; if (!isConvexId(id)) notFound(); return children; }
