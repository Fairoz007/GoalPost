'use client'
import { useParams } from 'next/navigation'
import type { Id } from '@/convex/_generated/dataModel'
import { TournamentDetail } from '@/components/arena/tournament-detail'
export default function LegacyTournamentPage() { const params = useParams<{ id: string }>(); return <TournamentDetail id={params.id as Id<'tournaments'>} /> }
