import { SignUp } from "@clerk/nextjs";
import { AuthCardLoading, AuthShell, arenaAuthAppearance } from "@/components/auth/auth-shell";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect_url?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const redirectUrl = resolvedParams?.redirect_url;
  const signInUrl = redirectUrl
    ? `/sign-in?redirect_url=${encodeURIComponent(redirectUrl)}`
    : "/sign-in";

  return (
    <AuthShell mode="sign-up" backUrl={redirectUrl}>
      <div className="relative min-h-[190px]">
        <div className="absolute inset-0"><AuthCardLoading /></div>
        <div className="relative z-10">
          <SignUp
            appearance={arenaAuthAppearance}
            signInUrl={signInUrl}
            fallbackRedirectUrl={redirectUrl || "/dashboard/tournaments"}
          />
        </div>
      </div>
    </AuthShell>
  );
}
