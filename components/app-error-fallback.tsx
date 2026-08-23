"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const RECOVERY_WINDOW_MS = 5 * 60 * 1000;
const RECOVERY_KEY = "d-one-arena:last-client-recovery";

function isTemporaryLoadingError(error: Error) {
  const message = `${error.name} ${error.message}`.toLowerCase();
  return [
    "chunkloaderror",
    "loading chunk",
    "dynamically imported module",
    "failed to fetch",
    "networkerror",
    "load failed",
  ].some((fragment) => message.includes(fragment));
}

function recoverFromStalePage(error: Error) {
  if (!isTemporaryLoadingError(error)) return;

  try {
    const lastRecovery = Number(window.sessionStorage.getItem(RECOVERY_KEY) ?? 0);
    if (Date.now() - lastRecovery < RECOVERY_WINDOW_MS) return;
    window.sessionStorage.setItem(RECOVERY_KEY, String(Date.now()));
  } catch {
    // Without storage we cannot prevent a reload loop, so leave recovery to the button.
    return;
  }

  window.location.reload();
}

export function AppErrorFallback({
  error,
  retry,
  fullDocument = false,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  fullDocument?: boolean;
}) {
  useEffect(() => {
    console.error("D-One Arena page error", error);
    recoverFromStalePage(error);
  }, [error]);
  const temporary = isTemporaryLoadingError(error);

  const content = (
    <main
      style={fullDocument ? { minHeight: "100vh", background: "#070707", color: "#fafafa" } : undefined}
      className="grid min-h-[70vh] place-items-center px-4 py-16"
    >
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#111] p-7 text-center shadow-2xl sm:p-10">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-orange-500">
          {temporary ? "Temporary loading issue" : "Something went wrong"}
        </p>
        <h1 className="mt-3 text-3xl font-bold uppercase tracking-tight">Let&apos;s get you back in</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-400">
          {temporary ? "The page hit a temporary browser or connection problem. Try again or return home." : "The page could not be displayed. Try again; if the problem continues, use the reference below when contacting support."}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={retry} size="lg">
            <RefreshCw className="size-4" /> Try again
          </Button>
          <Button nativeButton={false} render={<Link href="/" />} variant="outline" size="lg">
            <ArrowLeft className="size-4" /> Back to home
          </Button>
        </div>
        {error.digest && <p className="mt-6 text-xs text-zinc-600">Reference: {error.digest}</p>}
      </section>
    </main>
  );

  return content;
}
