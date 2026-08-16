"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, Search, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "./logo";
import { ClerkLoaded, ClerkLoading, Show, UserButton } from "@clerk/nextjs";
import { ProfileOnboardingDialog } from "@/components/auth/profile-onboarding-dialog";

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
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const redirectParam =
    pathname &&
    pathname !== "/" &&
    !pathname.startsWith("/sign-in") &&
    !pathname.startsWith("/sign-up")
      ? `?redirect_url=${encodeURIComponent(pathname)}`
      : "";
  const signInHref = `/sign-in${redirectParam}`;
  const signUpHref = `/sign-up${redirectParam}`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/8 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-5 px-4 sm:px-6">
          <Link href="/" aria-label="PowerWex EG Tournament home">
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
                className="h-11 w-[132px] rounded-lg border border-white/8 bg-white/[.035] sm:w-[218px]"
              />
            </ClerkLoading>

            <ClerkLoaded>
              <div className="flex min-h-11 items-center justify-end gap-2">
                <Show when="signed-out">
                  <Link href={signInHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-11")}>
                    Sign in
                  </Link>
                  <Link href={signUpHref} className={cn(buttonVariants({ size: "sm" }), "hidden min-h-11 sm:inline-flex")}>
                    Create account
                  </Link>
                </Show>
                <Show when="signed-in">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProfileDialogOpen(true)}
                    className="min-h-11 gap-1.5 text-xs font-semibold"
                  >
                    <User className="size-3.5 text-primary" />
                    My Profile
                  </Button>
                  <Link href="/dashboard/tournaments" className={cn(buttonVariants({ size: "sm" }), "min-h-11 font-semibold")}>
                    Dashboard
                  </Link>
                  <UserButton />
                </Show>
              </div>
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

      {/* Profile Dialog */}
      {profileDialogOpen && (
        <ProfileOnboardingDialog forceOpen onClose={() => setProfileDialogOpen(false)} />
      )}
    </>
  );
}
