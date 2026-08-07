import { cn } from '@/lib/utils'

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span className="relative flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M12 7.5l3.2 2.3-1.2 3.8h-4L8.8 9.8 12 7.5z"
            fill="currentColor"
          />
          <path
            d="M12 3v4.5M4.3 9.8l3.7 1.5M6.5 18l2.5-3.4M17.5 18L15 14.6M19.7 9.8L16 11.3"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showText ? (
        <span className="font-display text-lg font-bold tracking-tight">
          Goal<span className="text-primary">Post</span>
        </span>
      ) : null}
    </span>
  )
}
