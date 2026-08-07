import { cn } from '@/lib/utils'

const styles = {
  W: 'bg-primary/15 text-primary',
  D: 'bg-muted-foreground/15 text-muted-foreground',
  L: 'bg-[var(--live)]/15 text-[var(--live)]',
}

export function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  return (
    <span
      className={cn(
        'inline-flex size-5 items-center justify-center rounded text-[10px] font-bold',
        styles[result],
      )}
    >
      {result}
    </span>
  )
}

export function FormRow({ form }: { form: ('W' | 'D' | 'L')[] }) {
  return (
    <div className="flex items-center gap-1">
      {form.map((r, i) => (
        <FormBadge key={i} result={r} />
      ))}
    </div>
  )
}
