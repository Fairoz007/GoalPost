import { SignUp } from "@clerk/nextjs";
import { AuthCardLoading, AuthShell, arenaAuthAppearance } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell mode="sign-up">
      <div className="relative min-h-[190px]">
        <div className="absolute inset-0"><AuthCardLoading /></div>
        <div className="relative z-10">
          <SignUp
            appearance={arenaAuthAppearance}
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard/tournaments"
          />
        </div>
      </div>
    </AuthShell>
  );
}
