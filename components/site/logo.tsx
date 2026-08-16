import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative flex size-9 -skew-x-6 items-center justify-center overflow-hidden rounded-md bg-primary text-primary-foreground shadow-[0_0_20px_rgba(239,35,60,.22)]">
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="size-6 skew-x-6"
          aria-hidden
        >
          <path
            d="M7 5h9c7 0 11 4 11 11S23 27 16 27H7V5Z"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path d="M13 11h3c3 0 5 2 5 5s-2 5-5 5h-3V11Z" fill="currentColor" />
        </svg>
      </span>
      {showText ? (
        <span className="leading-none">
          <span className="block font-display text-lg font-bold tracking-[.06em]">
            D-ONE <span className="text-primary">ARENA</span>
          </span>
          <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-[.22em] text-muted-foreground">
            by d-one studio · Tournament Cloud
          </span>
        </span>
      ) : null}
    </span>
  );
}
