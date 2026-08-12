import { SignUp } from "@clerk/nextjs";
import { AuthShell, arenaAuthAppearance } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell mode="sign-up">
      <SignUp
        appearance={arenaAuthAppearance}
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard/tournaments"
      />
    </AuthShell>
  );
}
