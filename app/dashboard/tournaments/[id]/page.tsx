import { redirect } from "next/navigation";

export default async function TournamentRootPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  redirect(`/dashboard/tournaments/${resolvedParams.id}/overview`);
}
