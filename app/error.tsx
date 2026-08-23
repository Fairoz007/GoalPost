"use client";

import { AppErrorFallback } from "@/components/app-error-fallback";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return <AppErrorFallback error={error} retry={retry} />;
}
