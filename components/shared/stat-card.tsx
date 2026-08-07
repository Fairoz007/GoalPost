import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = 'primary',
  className,
}: {
  label: string
  value: string | number
  icon?: LucideIcon
  hint?: string
  accent?: 'primary' | 'accent' | 'live' | 'sky'
  className?: string
}) {
  const accents: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    accent: 'text-accent bg-accent/10',
    live: 'text-[var(--live)] bg-[var(--live)]/10',
    sky: 'text-[var(--chart-3)] bg-[var(--chart-3)]/10',
  }
  return (
    <div className={cn('glass flex items-center gap-4 rounded-xl p-4', className)}>
      {Icon ? (
        <span
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg',
            accents[accent],
          )}
        >
          <Icon className="size-5" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="font-display text-2xl font-semibold leading-none tabular-nums">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
        {hint ? <p className="mt-0.5 truncate text-[11px] text-primary">{hint}</p> : null}
      </div>
    </div>
  )
}
