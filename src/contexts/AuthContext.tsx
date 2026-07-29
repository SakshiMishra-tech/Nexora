import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  AuthError,
  AuthResponse,
  OAuthResponse,
  Provider,
  Session,
  User,
} from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getAuthRedirectUrl, isProfileComplete } from "@/lib/auth";
import type { CampusModuleId } from "@/lib/modules";

export type UserProfile = {
  id: string;
  full_name?: string | null;
  email: string | null;
  college_name: string | null;
  created_at?: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  profileChecked: boolean;
  profileComplete: boolean;
  signInWithOAuth: (provider: Extract<Provider, "google" | "github">) => Promise<OAuthResponse>;
  signInWithPassword: (email: string, password: string) => Promise<AuthResponse>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<UserProfile | null>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  const user = session?.user ?? null;

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    setProfileChecked(false);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, college_name, created_at")
      .eq("id", userId)
      .maybeSingle<UserProfile>();

    setProfileLoading(false);
    setProfileChecked(true);

    if (!error) {
      setProfile(data);
      return data;
    }

    console.error("Profile fetch failed:", error);
    setProfile(null);
    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileChecked(true);
      return null;
    }

    return fetchProfile(user.id);
  }, [fetchProfile, user]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      setSession(data.session);
      setLoading(false);

      if (data.session?.user) {
        await fetchProfile(data.session.user.id);
      } else {
        setProfile(null);
        setProfileChecked(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      if (nextSession?.user) {
        void fetchProfile(nextSession.user.id);
      } else {
        setProfile(null);
        setProfileChecked(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithOAuth = useCallback(
    (provider: Extract<Provider, "google" | "github">) =>
      supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getAuthRedirectUrl(),
        },
      }),
    [],
  );

  const signInWithPassword = useCallback(
    (email: string, password: string) =>
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
    [],
  );

  const resetPassword = useCallback(
    (email: string) =>
      supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl(),
      }),
    [],
  );

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      loading,
      profileLoading,
      profileChecked,
      profileComplete: isProfileComplete(profile),
      signInWithOAuth,
      signInWithPassword,
      resetPassword,
      signOut,
      refreshProfile,
    }),
    [
      loading,
      profile,
      profileChecked,
      profileLoading,
      refreshProfile,
      resetPassword,
      session,
      signInWithPassword,
      signInWithOAuth,
      signOut,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
