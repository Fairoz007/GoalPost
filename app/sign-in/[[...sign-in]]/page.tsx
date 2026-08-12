import { SignIn } from "@clerk/nextjs";
import { AuthCardLoading, AuthShell, arenaAuthAppearance } from "@/components/auth/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell mode="sign-in">
      <div className="relative min-h-[190px]">
        <div className="absolute inset-0"><AuthCardLoading /></div>
        <div className="relative z-10">
          <SignIn
            appearance={arenaAuthAppearance}
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard/tournaments"
          />
        </div>
      </div>
    </AuthShell>
  );
}
