import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { Logo } from "@/components/site/logo";

export function AuthShell({
  mode,
  children,
}: {
  mode: "sign-in" | "sign-up";
  children: React.ReactNode;
}) {
  const signingIn = mode === "sign-in";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070707] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(249,115,22,.18),transparent_32%),radial-gradient(circle_at_88%_82%,rgba(249,115,22,.09),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:52px_52px]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden flex-col justify-between border-r border-white/8 p-12 lg:flex xl:p-16">
          <Link href="/" aria-label="D-One Arena home" className="w-fit">
            <Logo />
          </Link>

          <div className="max-w-xl">
            <div className="mb-8 flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-[0_0_60px_rgba(249,115,22,.18)]">
              <Trophy className="size-7 text-primary" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-primary">
              {signingIn ? "Welcome back" : "Your arena awaits"}
            </p>
            <h1 className="mt-4 font-display text-6xl font-bold uppercase leading-[.9] tracking-tight xl:text-7xl">
              {signingIn ? "Return to the competition." : "Build your competitive legacy."}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/55">
              One secure identity for tournaments, registrations, match history, and every achievement you earn in D-One Arena.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {[
                "Private account data",
                "Public verified standings",
                "Secure organizer access",
                "Real-time Convex updates",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-white/35">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Protected authentication · Privacy-first data ownership
          </div>
        </section>

        <section className="flex min-h-screen flex-col px-4 py-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between lg:justify-end">
            <Link href="/" className="lg:hidden" aria-label="D-One Arena home">
              <Logo />
            </Link>
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-white/55 transition hover:bg-white/5 hover:text-white">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to Arena
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            <div className="mb-7 lg:hidden">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="size-5 text-primary" aria-hidden="true" />
              </div>
              <h1 className="mt-5 font-display text-4xl font-bold uppercase">
                {signingIn ? "Welcome back" : "Join the Arena"}
              </h1>
              <p className="mt-2 text-sm leading-6 text-white/50">
                {signingIn ? "Sign in to continue your competitive journey." : "Create one secure account for every competition."}
              </p>
            </div>
            {children}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
              <span>
                D-One Arena authentication secured by{" "}
                <a
                  href="https://clerk.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-white/65 transition hover:text-white"
                >
                  Clerk
                </a>
              </span>
            </div>
          </div>

          <p className="text-center text-xs leading-5 text-white/30">
            By continuing, you agree to fair play, secure account use, and the tournament rules you join.
          </p>
        </section>
      </div>
    </main>
  );
}

export function AuthCardLoading() {
  return (
    <div
      aria-label="Loading secure authentication"
      className="min-h-[390px] w-full rounded-xl border border-white/10 bg-[#0d0d0d]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-xl sm:p-7"
    >
      <div className="h-8 w-44 rounded-md bg-white/8" />
      <div className="mt-3 h-4 w-64 max-w-full rounded bg-white/5" />
      <div className="mt-8 h-12 rounded-lg border border-white/8 bg-white/[.04]" />
      <div className="my-6 h-px bg-white/8" />
      <div className="h-12 rounded-lg border border-white/8 bg-white/[.04]" />
      <div className="mt-4 h-12 rounded-lg bg-primary/15" />
      <div className="mx-auto mt-6 h-4 w-40 rounded bg-white/5" />
    </div>
  );
}

export const arenaAuthAppearance = {
  variables: {
    colorPrimary: "#f97316",
    colorPrimaryForeground: "#090909",
    colorBackground: "transparent",
    colorForeground: "#fafafa",
    colorMuted: "#181818",
    colorMutedForeground: "#a1a1aa",
    colorInput: "#111111",
    colorInputForeground: "#fafafa",
    colorNeutral: "#fafafa",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "w-full border border-white/10 bg-[#0d0d0d]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,.45)] backdrop-blur-xl sm:p-7",
    headerTitle: "font-display text-3xl font-bold uppercase tracking-tight text-white",
    headerSubtitle: "text-sm leading-6 text-white/50",
    socialButtonsBlockButton: "min-h-12 border-white/10 bg-white text-[#090909] font-semibold hover:bg-white/90",
    socialButtonsBlockButtonText: "font-semibold",
    dividerLine: "bg-white/10",
    dividerText: "text-white/35",
    formFieldLabel: "text-sm font-medium text-white/75",
    formFieldInput: "min-h-12 border-white/10 bg-[#141414] text-white outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15",
    formButtonPrimary: "min-h-12 bg-primary font-bold text-primary-foreground shadow-[0_10px_30px_rgba(249,115,22,.2)] hover:bg-primary/90",
    footerActionText: "text-white/45",
    footerActionLink: "font-semibold text-primary hover:text-primary/85",
    identityPreview: "border-white/10 bg-[#141414]",
    identityPreviewText: "text-white",
    formFieldErrorText: "text-red-400",
    alert: "border-red-500/20 bg-red-500/10 text-red-200",
  },
} as const;
