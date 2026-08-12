"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "./logo";
import { ClerkLoaded, ClerkLoading, Show, UserButton } from "@clerk/nextjs";

const nav = [
  { href: "/", label: "Home" },
  { href: "/tournaments", label: "Tournaments" },
  { href: "/games", label: "Games" },
  { href: "/rankings", label: "Rankings" },
  { href: "/champions", label: "Champions" },
  { href: "/about", label: "About" },
];
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-5 px-4 sm:px-6">
        <Link href="/" aria-label="D-One Arena home">
          <Logo />
        </Link>
        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href))
                  ? "text-white"
                  : "text-muted-foreground hover:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link
            href="/tournaments"
            className="hidden size-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-white sm:flex"
            aria-label="Search tournaments"
          >
            <Search className="size-4" />
          </Link>
          <ClerkLoading>
            <div
              aria-hidden="true"
              className="h-11 w-24 rounded-lg border border-white/8 bg-white/[.035] sm:w-[218px]"
            />
          </ClerkLoading>
          <ClerkLoaded>
            <Show when="signed-out">
              <Link href="/sign-in" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-11")}>Sign in</Link>
              <Link href="/sign-up" className={cn(buttonVariants({ size: "sm" }), "hidden min-h-11 sm:inline-flex")}>Create account</Link>
            </Show>
            <Show when="signed-in">
              <Link href="/dashboard/tournaments" className={cn(buttonVariants({ size: "sm" }), "min-h-11")}>Dashboard</Link>
              <UserButton />
            </Show>
          </ClerkLoaded>
          <button
            onClick={() => setOpen(!open)}
            className="flex size-9 items-center justify-center rounded-md border border-border lg:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="grid border-t border-border bg-background px-4 py-3 lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
