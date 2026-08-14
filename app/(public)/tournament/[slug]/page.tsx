'use client'
import { Suspense } from 'react'
import { useParams } from 'next/navigation'
import { TournamentDetail } from '@/components/arena/tournament-detail'

export default function TournamentSlugPage() {
  const params = useParams<{ slug: string }>();
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="h-80 animate-pulse rounded-2xl bg-card" />
        </div>
      }
    >
      <TournamentDetail slug={params.slug} />
    </Suspense>
  );
}
