"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Gamepad2, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dismissalKey = "d1-studio-promo-dismissed";

export function D1StudioPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(dismissalKey)) return;
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(dismissalKey, "true");
    setOpen(false);
  };

  if (!open) return null;
  return (
    <aside
      role="dialog"
      aria-labelledby="d1-studio-title"
      className="fixed bottom-4 left-4 right-4 z-[80] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0c] shadow-[0_24px_80px_rgba(0,0,0,.72)] sm:left-auto sm:right-6 sm:w-[410px]"
    >
      <div className="h-1 bg-gradient-to-r from-primary via-[#ff6b35] to-primary" />
      <div className="relative p-6">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close D1 Studio promotion"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition hover:bg-white/5 hover:text-white"
        >
          <X className="size-4" />
        </button>
        <div className="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
          <Gamepad2 className="size-5 text-primary" />
        </div>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[.24em] text-primary">
          Studio spotlight
        </p>
        <h2
          id="d1-studio-title"
          className="mt-2 font-display text-3xl font-bold uppercase"
        >
          Meet D1 Studio
        </h2>
        <p className="mt-3 pr-3 text-sm leading-6 text-muted-foreground">
          D1 Studio is an independent game development company creating
          immersive, player-first worlds through bold ideas, thoughtful design,
          and meticulous craft.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <a
            href="https://www.dlstudio.dev/"
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={cn(buttonVariants({ size: "lg" }), "flex-1")}
          >
            Visit D1 Studio <ArrowUpRight className="size-4" />
          </a>
          <button
            type="button"
            onClick={dismiss}
            className="px-2 text-xs font-semibold text-muted-foreground hover:text-white"
          >
            Maybe later
          </button>
        </div>
      </div>
    </aside>
  );
}
