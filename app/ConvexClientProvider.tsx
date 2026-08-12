"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient, Authenticated } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ReactNode, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <Authenticated><UserSync /></Authenticated>
      {children}
    </ConvexProviderWithClerk>
  );
}

function UserSync() {
  const ensureCurrent = useMutation(api.users.ensureCurrent);
  const claimLegacy = useMutation(api.tournaments.claimLegacy);
  useEffect(() => {
    void ensureCurrent();
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith("admin_code_")) continue;
      const editCode = window.localStorage.getItem(key);
      const tournamentId = key.slice("admin_code_".length);
      if (!editCode || !tournamentId) continue;
      void claimLegacy({ id: tournamentId as Id<"tournaments">, editCode })
        .then((claimed) => {
          if (claimed) window.localStorage.removeItem(key);
        })
        .catch(() => undefined);
    }
  }, [claimLegacy, ensureCurrent]);
  return null;
}
