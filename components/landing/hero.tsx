import Link from 'next/link'
import { ArrowRight, PlayCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { LiveDot } from '@/components/shared/match-card'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: 'url(/hero-stadium.png)' }}
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/85 to-background/40"
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 field-grid opacity-40" aria-hidden />

      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-24 sm:px-6 md:py-32 lg:py-40">
        <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
          <LiveDot />
          2 matches live now · Matchday 13
        </span>

        <h1 className="max-w-3xl text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
          Run football tournaments like the{' '}
          <span className="text-primary text-glow">professionals</span>
        </h1>

        <p className="max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Fixtures, live scores, standings, knockout brackets, teams, players and deep stats — one
          platform for leagues, cups, schools and clubs.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
            Open Dashboard
            <ArrowRight className="size-4" />
          </Link>
          <Link href="/matches" className={buttonVariants({ size: "lg", variant: "secondary" })}>
            <PlayCircle className="size-4" />
            Watch live matches
          </Link>
        </div>

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
          {[
            { v: '12', l: 'Teams' },
            { v: '132', l: 'Matches' },
            { v: '132', l: 'Players' },
            { v: '5', l: 'Tournaments' },
          ].map((s) => (
            <div key={s.l}>
              <dt className="font-display text-3xl font-bold text-foreground">{s.v}</dt>
              <dd className="text-xs uppercase tracking-wider text-muted-foreground">{s.l}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
