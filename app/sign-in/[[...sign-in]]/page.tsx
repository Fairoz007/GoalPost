import { ClerkLoaded, ClerkLoading, SignIn } from "@clerk/nextjs";
import { AuthCardLoading, AuthShell, arenaAuthAppearance } from "@/components/auth/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell mode="sign-in">
      <ClerkLoading><AuthCardLoading /></ClerkLoading>
      <ClerkLoaded>
        <SignIn
          appearance={arenaAuthAppearance}
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/dashboard/tournaments"
        />
      </ClerkLoaded>
    </AuthShell>
  );
}
