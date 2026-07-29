import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AUTH_ROUTES } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

import { getUserSettings, getEnabledModules } from "@/services/user-settings.service";

export function useProfileRedirect() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading, profileLoading, profileChecked, signOut } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const continueAuthFlow = async () => {
      if (loading || profileLoading || !profileChecked) return;

      if (!user) {
        void navigate({ to: AUTH_ROUTES.login, replace: true });
        return;
      }

      if (user.email && !user.email_confirmed_at && !user.confirmed_at) {
        await signOut();
        if (!cancelled) {
          void navigate({ to: AUTH_ROUTES.login, replace: true });
        }
        return;
      }

      const settings = await getUserSettings(user.id);
      const enabledModules = getEnabledModules(settings);
      const needsOnboarding = !settings || enabledModules.length === 0;

      if (!profile) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Student";

        const { error } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? null,
            full_name: fullName,
            college_name: user.user_metadata?.college_name ?? null,
          },
          { onConflict: "id" },
        );

        if (!error) {
          await refreshProfile();
        }
      }

      if (needsOnboarding) {
        window.sessionStorage.setItem("nexora-show-campus-onboarding", "1");
      }

      if (!cancelled) {
        void navigate({ to: AUTH_ROUTES.dashboard, replace: true });
      }
    };

    void continueAuthFlow();

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    navigate,
    profile,
    profileChecked,
    profileLoading,
    refreshProfile,
    signOut,
    user,
  ]);
}
