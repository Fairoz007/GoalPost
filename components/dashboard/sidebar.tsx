"use client";

import Link from "next/link";
import { Crosshair, Gamepad2, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const navigation = [
  { name: "Tournaments", href: "/dashboard/tournaments", icon: Trophy },
];

const games = [
  { name: "VALORANT", href: "/dashboard/tournaments/create/valorant", icon: Crosshair },
  { name: "E-Football", href: "/dashboard/tournaments/create/efootball", icon: Gamepad2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar px-4 py-6">
      <nav className="flex flex-1 flex-col gap-1 pt-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="size-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 border-t border-border pt-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.22em] text-muted-foreground">Create by game</p>
        <nav className="space-y-1">
          {games.map((game) => {
            const isActive = pathname === game.href;
            return <Link key={game.name} href={game.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground")}><game.icon className="size-5" />{game.name}</Link>;
          })}
        </nav>
      </div>
      <div className="mt-5 flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-3">
        <UserButton />
        <span className="text-sm font-medium">Account</span>
      </div>
    </div>
  );
}
