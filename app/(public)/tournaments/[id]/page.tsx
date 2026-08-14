'use client'
import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import type { Id } from '@/convex/_generated/dataModel'
import { TournamentDetail } from '@/components/arena/tournament-detail'

export default function LegacyTournamentPage() {
  const params = useParams<{ id: string }>();
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="h-80 animate-pulse rounded-2xl bg-card" />
        </div>
      }
    >
      <TournamentDetail id={params.id as Id<'tournaments'>} />
    </Suspense>
  );
}
