"use client";

import { AppErrorFallback } from "@/components/app-error-fallback";
import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body style={{ margin: 0, background: "#070707" }}>
        <AppErrorFallback error={error} retry={retry} fullDocument />
      </body>
    </html>
  );
}
