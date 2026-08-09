'use client'
import { useParams } from 'next/navigation'
import { TournamentDetail } from '@/components/arena/tournament-detail'
export default function TournamentSlugPage() { const params = useParams<{ slug: string }>(); return <TournamentDetail slug={params.slug} /> }
