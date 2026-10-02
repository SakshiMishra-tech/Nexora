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
import type { AccountState } from "@/services/account.service";

export type UserProfile = {
  id: string;
  full_name?: string | null;
  email: string | null;
  college_name: string | null;
  created_at?: string;
};

export type { AccountState };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  accountState: AccountState | null;
  loading: boolean;
  profileLoading: boolean;
  profileChecked: boolean;
  profileComplete: boolean;
  signInWithOAuth: (provider: Extract<Provider, "google" | "github">) => Promise<OAuthResponse>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<UserProfile | null>;
  refreshAccountState: () => Promise<AccountState | null>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accountState, setAccountState] = useState<AccountState | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  const user = session?.user ?? null;

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    setProfileChecked(false);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, college_name, created_at, is_deactivated, deactivated_at, deletion_requested_at, scheduled_deletion_at",
      )
      .eq("id", userId)
      .maybeSingle<UserProfile & AccountState>();

    setProfileLoading(false);
    setProfileChecked(true);

    if (!error && data) {
      setProfile(data);
      setAccountState({
        is_deactivated: data.is_deactivated ?? false,
        deactivated_at: data.deactivated_at ?? null,
        deletion_requested_at: data.deletion_requested_at ?? null,
        scheduled_deletion_at: data.scheduled_deletion_at ?? null,
      });
      return data;
    }

    if (error) console.error("Profile fetch failed:", error);
    setProfile(data ?? null);
    setAccountState(null);
    return data ?? null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setAccountState(null);
      setProfileChecked(true);
      return null;
    }

    return fetchProfile(user.id);
  }, [fetchProfile, user]);

  const refreshAccountState = useCallback(async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("is_deactivated, deactivated_at, deletion_requested_at, scheduled_deletion_at")
      .eq("id", user.id)
      .single();
    if (error || !data) return null;
    const state = data as AccountState;
    setAccountState(state);
    return state;
  }, [user]);

  useEffect(() => {
    let mounted = true;

    let currentUser = user;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      setSession(data.session);
      currentUser = data.session?.user ?? null;
      setLoading(false);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setProfileChecked(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setLoading(false);

      const nextUser = nextSession?.user ?? null;
      // Only fetch profile if the user ID has changed (e.g., login or initial load)
      if (nextUser?.id !== currentUser?.id) {
        currentUser = nextUser;
        if (nextUser) {
          void fetchProfile(nextUser.id);
        } else {
          setProfile(null);
          setProfileChecked(true);
        }
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

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      profile,
      accountState,
      loading,
      profileLoading,
      profileChecked,
      profileComplete: isProfileComplete(profile),
      signInWithOAuth,
      signOut,
      refreshProfile,
      refreshAccountState,
    }),
    [
      accountState,
      loading,
      profile,
      profileChecked,
      profileLoading,
      refreshAccountState,
      refreshProfile,
      session,
      signInWithOAuth,
      signOut,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
