"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Logo } from "@/components/site/logo";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const signInHref = pathname ? `/sign-in?redirect_url=${encodeURIComponent(pathname)}` : "/sign-in";

  return (
    <>
      <AuthLoading><div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Preparing your secure workspace…</div></AuthLoading>
      <Unauthenticated><div className="grid min-h-screen place-items-center"><Button render={<Link href={signInHref} />} size="lg">Sign in to continue</Button></div></Unauthenticated>
      <Authenticated>
        <div className="flex h-screen overflow-hidden bg-background">
          <aside className="hidden md:block"><Sidebar /></aside>
          <div className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
            <Logo />
            <Sheet>
              <SheetTrigger render={<Button variant="outline" size="icon" aria-label="Open dashboard navigation" />}><Menu className="size-5" /></SheetTrigger>
              <SheetContent side="left" className="w-[min(86vw,20rem)] p-0">
                <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
                <SheetDescription className="sr-only">Tournament administration links</SheetDescription>
                <Sidebar />
              </SheetContent>
            </Sheet>
          </div>
          <main className="min-w-0 flex-1 overflow-y-auto bg-muted/20 p-4 pt-20 sm:p-8 md:pt-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </Authenticated>
    </>
  );
}
