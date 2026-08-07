'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { MatchCard } from '@/components/shared/match-card'
import { liveMatches, upcomingMatches, finishedMatches } from '@/lib/mock-data'

export function MatchesView() {
  const [tab, setTab] = useState('live')
  const live = liveMatches()
  const upcoming = upcomingMatches()
  const finished = finishedMatches()

  const groups = {
    live,
    upcoming,
    results: finished,
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="live">
          Live
          <span className="ml-1.5 rounded bg-[var(--live)]/15 px-1.5 text-xs text-[var(--live)]">
            {live.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        <TabsTrigger value="results">Results</TabsTrigger>
      </TabsList>

      {(['live', 'upcoming', 'results'] as const).map((key) => (
        <TabsContent key={key} value={key} className="mt-6">
          {groups[key].length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
              No {key} matches right now.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups[key].map((m) => (
                <MatchCard key={m.id} match={m} href={`/matches/${m.id}`} />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
