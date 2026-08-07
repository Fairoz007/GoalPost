export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string
  title: string
  description?: string
}) {
  return (
    <div className="relative overflow-hidden border-b border-border bg-sidebar/60">
      <div className="absolute inset-0 field-grid opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-pretty text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  )
}
