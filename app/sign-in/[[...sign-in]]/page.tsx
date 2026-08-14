import { SignIn } from "@clerk/nextjs";
import { AuthCardLoading, AuthShell, arenaAuthAppearance } from "@/components/auth/auth-shell";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect_url?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const redirectUrl = resolvedParams?.redirect_url;
  const signUpUrl = redirectUrl
    ? `/sign-up?redirect_url=${encodeURIComponent(redirectUrl)}`
    : "/sign-up";

  return (
    <AuthShell mode="sign-in" backUrl={redirectUrl}>
      <div className="relative min-h-[190px]">
        <div className="absolute inset-0"><AuthCardLoading /></div>
        <div className="relative z-10">
          <SignIn
            appearance={arenaAuthAppearance}
            signUpUrl={signUpUrl}
            fallbackRedirectUrl={redirectUrl || "/dashboard/tournaments"}
          />
        </div>
      </div>
    </AuthShell>
  );
}
