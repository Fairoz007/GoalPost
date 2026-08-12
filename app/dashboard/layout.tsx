"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthLoading><div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Preparing your secure workspace…</div></AuthLoading>
      <Unauthenticated><div className="grid min-h-screen place-items-center"><Button render={<Link href="/sign-in" />} size="lg">Sign in to continue</Button></div></Unauthenticated>
      <Authenticated>
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </Authenticated>
    </>
  );
}
