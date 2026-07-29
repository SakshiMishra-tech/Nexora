export const getAuthRedirectUrl = () => `${window.location.origin}/auth/callback`;

export const AUTH_ROUTES = {
  login: "/auth/login",
  signup: "/auth/signup",
  callback: "/auth/callback",
  dashboard: "/",
  completeProfile: "/complete-profile",
  campusSpaces: "/",
  settings: "/settings",
} as const;

export type ProfileCompleteness = {
  full_name?: string | null;
  first_name?: string | null;
  surname?: string | null;
  college_name?: string | null;
};

export function isProfileComplete(profile: ProfileCompleteness | null | undefined) {
  if (!profile) return false;

  const displayName =
    profile.full_name?.trim() ||
    [profile.first_name, profile.surname].filter(Boolean).join(" ").trim();

  return Boolean(displayName && profile.college_name?.trim());
}

export function getProfileCompletionPercent(profile: ProfileCompleteness | null | undefined) {
  if (!profile) return 0;

  const displayName =
    profile.full_name?.trim() ||
    [profile.first_name, profile.surname].filter(Boolean).join(" ").trim();
  const requiredFields = [displayName, profile.college_name];

  return requiredFields.reduce((total, value) => total + (value?.trim() ? 50 : 0), 0);
}

export function needsCampusSpacesOnboarding(
  _profile: Record<string, unknown> | null | undefined,
) {
  return false;
}
