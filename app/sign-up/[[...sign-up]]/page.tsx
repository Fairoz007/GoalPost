import { ClerkLoaded, ClerkLoading, SignUp } from "@clerk/nextjs";
import { AuthCardLoading, AuthShell, arenaAuthAppearance } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell mode="sign-up">
      <ClerkLoading><AuthCardLoading /></ClerkLoading>
      <ClerkLoaded>
        <SignUp
          appearance={arenaAuthAppearance}
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard/tournaments"
        />
      </ClerkLoaded>
    </AuthShell>
  );
}
