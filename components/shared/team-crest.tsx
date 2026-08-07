import { cn } from '@/lib/utils'
import type { Team } from '@/lib/mock-data'

const sizes = {
  sm: 'size-7 text-[10px]',
  md: 'size-10 text-xs',
  lg: 'size-14 text-sm',
  xl: 'size-20 text-lg',
}

export function TeamCrest({
  team,
  size = 'md',
  className,
}: {
  team: Pick<Team, 'short' | 'color' | 'name'>
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold tracking-wide',
        sizes[size],
        className,
      )}
      style={{
        color: team.color,
        background: `color-mix(in srgb, ${team.color} 16%, transparent)`,
        boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${team.color} 55%, transparent)`,
      }}
      aria-hidden
      title={team.name}
    >
      {team.short}
    </span>
  )
}
