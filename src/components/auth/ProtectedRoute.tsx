import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AUTH_ROUTES } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({
  children,
  requireCompleteProfile = false,
}: {
  children: ReactNode;
  requireCompleteProfile?: boolean;
}) {
  const navigate = useNavigate();
  const { loading, profileChecked, profileComplete, profileLoading, user } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: AUTH_ROUTES.login, replace: true });
    }

    if (
      requireCompleteProfile &&
      user &&
      !loading &&
      !profileLoading &&
      profileChecked &&
      !profileComplete
    ) {
      void navigate({ to: AUTH_ROUTES.completeProfile, replace: true });
    }
  }, [
    loading,
    navigate,
    profileChecked,
    profileComplete,
    profileLoading,
    requireCompleteProfile,
    user,
  ]);

  if (loading || (user && profileLoading)) {
    return <AuthStatusScreen title="Checking session" />;
  }

  if (!user) {
    return <AuthStatusScreen title="Redirecting to sign in" />;
  }

  if (requireCompleteProfile && !profileChecked) {
    return <AuthStatusScreen title="Checking profile" />;
  }

  if (requireCompleteProfile && !profileComplete) {
    return <AuthStatusScreen title="Redirecting to profile setup" />;
  }

  return <>{children}</>;
}

export function AuthStatusScreen({ title }: { title: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
        <p className="font-display text-2xl font-black">{title}</p>
        <p className="mt-2 text-sm font-semibold text-muted-foreground">Please wait...</p>
      </div>
    </main>
  );
}
