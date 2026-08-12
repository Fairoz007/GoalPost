import { SignIn } from "@clerk/nextjs";
import { AuthShell, arenaAuthAppearance } from "@/components/auth/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell mode="sign-in">
      <SignIn
        appearance={arenaAuthAppearance}
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/dashboard/tournaments"
      />
    </AuthShell>
  );
}
