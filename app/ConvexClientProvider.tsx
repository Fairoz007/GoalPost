"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient, Authenticated } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { Component, type ErrorInfo, type ReactNode, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { ProfileOnboardingDialog } from "@/components/auth/profile-onboarding-dialog";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <Authenticated>
        <OptionalUserToolBoundary name="account synchronization">
          <UserSync />
        </OptionalUserToolBoundary>
        <OptionalUserToolBoundary name="profile onboarding">
          <ProfileOnboardingDialog />
        </OptionalUserToolBoundary>
      </Authenticated>
      {children}
    </ConvexProviderWithClerk>
  );
}

function UserSync() {
  const ensureCurrent = useMutation(api.users.ensureCurrent);
  const claimLegacy = useMutation(api.tournaments.claimLegacy);

  useEffect(() => {
    let cancelled = false;

    void ensureCurrent().catch((error: unknown) => {
      if (!cancelled) console.error("Could not synchronize the signed-in account.", error);
    });

    let storage: Storage;
    try {
      storage = window.localStorage;
    } catch (error) {
      console.warn("Browser storage is unavailable; legacy tournament claiming was skipped.", error);
      return () => {
        cancelled = true;
      };
    }

    const legacyCodes: Array<{ key: string; tournamentId: string; editCode: string }> = [];
    try {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (!key?.startsWith("admin_code_")) continue;
        const editCode = storage.getItem(key);
        const tournamentId = key.slice("admin_code_".length);
        if (editCode && tournamentId) legacyCodes.push({ key, tournamentId, editCode });
      }
    } catch (error) {
      console.warn("Browser storage could not be read; legacy tournament claiming was skipped.", error);
    }

    for (const { key, tournamentId, editCode } of legacyCodes) {
      void claimLegacy({ id: tournamentId as Id<"tournaments">, editCode })
        .then((claimed) => {
          if (!claimed || cancelled) return;
          try {
            storage.removeItem(key);
          } catch (error) {
            console.warn("A claimed legacy tournament code could not be removed.", error);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) console.error("Could not claim a legacy tournament.", error);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [claimLegacy, ensureCurrent]);

  return null;
}

class OptionalUserToolBoundary extends Component<
  { children: ReactNode; name: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`The optional ${this.props.name} tool could not load.`, error, info);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
