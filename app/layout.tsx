import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Oswald } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ConvexClientProvider } from './ConvexClientProvider'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
})

export const metadata: Metadata = {
  title: 'GoalPost — Football Tournament Platform',
  description:
    'Professional football tournament management: fixtures, live scores, standings, knockout brackets, teams, players and stats.',
  generator: 'v0.app',
  keywords: [
    'football tournament',
    'league management',
    'fixtures',
    'standings',
    'live scores',
    'knockout bracket',
  ],
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#020617',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark bg-background ${geistSans.variable} ${geistMono.variable} ${oswald.variable}`}
    >
      <body className="font-sans antialiased">
        <TooltipProvider delayDuration={200}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </TooltipProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
