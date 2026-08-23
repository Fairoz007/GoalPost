import { notFound } from "next/navigation";
import { isConvexId } from "@/lib/convex-id";
export default async function LegacyTournamentLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) { const { id } = await params; if (!isConvexId(id)) notFound(); return children; }
