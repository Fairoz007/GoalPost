import Link from 'next/link'
import { Logo } from './logo'

const groups = [
  {
    title: 'Competition',
    links: [
      { href: '/matches', label: 'Matches' },
      { href: '/standings', label: 'Standings' },
      { href: '/bracket', label: 'Bracket' },
      { href: '/statistics', label: 'Statistics' },
    ],
  },
  {
    title: 'Explore',
    links: [
      { href: '/teams', label: 'Teams' },
      { href: '/players', label: 'Players' },
      { href: '/news', label: 'News' },
      { href: '/gallery', label: 'Gallery' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/sponsors', label: 'Sponsors' },
      { href: '/contact', label: 'Contact' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-sidebar">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            The complete platform to run football tournaments — fixtures, live scores, standings,
            brackets and stats.
          </p>
        </div>
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
              {g.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© 2026 GoalPost. Built for the beautiful game.</p>
          <p>A demo tournament platform · Mock data</p>
        </div>
      </div>
    </footer>
  )
}
