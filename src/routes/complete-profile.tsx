import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AUTH_ROUTES, getProfileCompletionPercent } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/complete-profile")({
  head: () => ({ meta: [{ title: "Nexora - Complete Your Profile" }] }),
  component: CompleteProfileRoute,
});

type ProfileErrors = {
  firstName?: string;
  surname?: string;
  collegeName?: string;
};

function CompleteProfileRoute() {
  return (
    <ProtectedRoute>
      <CompleteProfile />
    </ProtectedRoute>
  );
}

function CompleteProfile() {
  const navigate = useNavigate();
  const { profile, profileLoading, refreshProfile, user } = useAuth();
  const fallbackFirstName = useMemo(() => {
    const metadataFirstName =
      user?.user_metadata?.first_name ||
      user?.user_metadata?.full_name?.split(" ")[0] ||
      user?.user_metadata?.name?.split(" ")[0];

    return metadataFirstName || user?.email?.split("@")[0] || "";
  }, [user]);
  const fallbackSurname = useMemo(() => {
    const metadataSurname =
      user?.user_metadata?.surname ||
      user?.user_metadata?.last_name ||
      user?.user_metadata?.full_name?.split(" ").slice(1).join(" ") ||
      user?.user_metadata?.name?.split(" ").slice(1).join(" ");

    return metadataSurname || "";
  }, [user]);

  const initialValues = useMemo(
    () => ({
      firstName: profile?.full_name?.split(" ")[0] ?? fallbackFirstName,
      surname: profile?.full_name?.split(" ").slice(1).join(" ") ?? fallbackSurname,
      collegeName: profile?.college_name ?? user?.user_metadata?.college_name ?? "",
    }),
    [fallbackFirstName, fallbackSurname, profile, user?.user_metadata?.college_name],
  );

  const [firstName, setFirstName] = useState(initialValues.firstName);
  const [surname, setSurname] = useState(initialValues.surname);
  const [collegeName, setCollegeName] = useState(initialValues.collegeName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ProfileErrors>({});
  const [showUnsavedNotice, setShowUnsavedNotice] = useState(false);

  useEffect(() => {
    if (profileLoading) return;

    setFirstName(initialValues.firstName);
    setSurname(initialValues.surname);
    setCollegeName(initialValues.collegeName);
  }, [initialValues, profileLoading]);

  const dirty =
    firstName !== initialValues.firstName ||
    surname !== initialValues.surname ||
    collegeName !== initialValues.collegeName;

  const completionPercent = getProfileCompletionPercent({
    full_name: `${firstName} ${surname}`.trim(),
    college_name: collegeName,
  });

  const validate = () => {
    const nextErrors: ProfileErrors = {};

    if (!firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    } else if (firstName.trim().length < 2) {
      nextErrors.firstName = "Use at least 2 characters.";
    }

    if (surname.trim().length > 80) {
      nextErrors.surname = "Keep surname under 80 characters.";
    }

    if (!collegeName.trim()) {
      nextErrors.collegeName = "College name is required.";
    } else if (collegeName.trim().length < 3) {
      nextErrors.collegeName = "Use the full college name.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || saving) return;

    setError("");
    setSaved(false);

    if (!validate()) {
      toast.error("Please check the highlighted fields.");
      return;
    }

    setSaving(true);
    const payload = {
      id: user.id,
      email: user.email ?? null,
      full_name: [firstName.trim(), surname.trim()].filter(Boolean).join(" "),
      college_name: collegeName.trim(),
    };

    const { error: profileError } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

    if (profileError) {
      console.error("Profile save failed:", profileError);
      setSaving(false);
      setError("We couldn't save your profile right now. Try again.");
      toast.error("Something went wrong. Please try again.");
      return;
    }

    await refreshProfile();
    setSaving(false);
    setSaved(true);
    toast.success("Profile saved.");

    window.setTimeout(() => {
      void navigate({ to: AUTH_ROUTES.dashboard, replace: true });
    }, 650);
  };

  const handleSkip = () => {
    if (dirty && !showUnsavedNotice) {
      setShowUnsavedNotice(true);
      toast.message("You have unsaved changes.");
      return;
    }

    void navigate({ to: AUTH_ROUTES.dashboard, replace: true });
  };

  return (
    <main className="profile-setup-page text-foreground">
      <section className="profile-onboarding-shell">
        <section className="profile-setup-card">
          <div className="profile-card-heading">
            <p>Complete Profile</p>
            <h1>Set up the basics</h1>
          </div>

          <div className="profile-completion-card">
            <div>
              <p>Profile Completion</p>
              <strong>{completionPercent}%</strong>
            </div>
            <div className="profile-completion-track" aria-hidden="true">
              <span style={{ width: `${completionPercent}%` }} />
            </div>
          </div>

          {profileLoading ? (
            <ProfileSkeleton />
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
              {error && <div className="profile-error-message">{error}</div>}
              {showUnsavedNotice && dirty && (
                <div className="auth-status-message auth-status-info">
                  You have unsaved changes. Save them before leaving, or use Skip again to discard.
                </div>
              )}
              {saved && (
                <div className="auth-status-message auth-status-info flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Profile saved. Taking you home...
                </div>
              )}

              <div className="profile-fields-grid">
                <ProfileField
                  label="First Name"
                  helperText={fieldErrors.firstName || "Use the name classmates recognize."}
                  error={Boolean(fieldErrors.firstName)}
                >
                  <input
                    value={firstName}
                    onChange={(event) => {
                      setFirstName(event.target.value);
                      setShowUnsavedNotice(false);
                    }}
                    placeholder="Aisha"
                    autoComplete="given-name"
                  />
                </ProfileField>
                <ProfileField
                  label="Surname"
                  helperText={fieldErrors.surname || "Optional, but useful for campus search."}
                  error={Boolean(fieldErrors.surname)}
                >
                  <input
                    value={surname}
                    onChange={(event) => {
                      setSurname(event.target.value);
                      setShowUnsavedNotice(false);
                    }}
                    placeholder="Rao"
                    autoComplete="family-name"
                  />
                </ProfileField>
                <ProfileField
                  label="College Name"
                  className="profile-span-2"
                  helperText={fieldErrors.collegeName || "Write the full campus or institute name."}
                  error={Boolean(fieldErrors.collegeName)}
                >
                  <input
                    value={collegeName}
                    onChange={(event) => {
                      setCollegeName(event.target.value);
                      setShowUnsavedNotice(false);
                    }}
                    placeholder="Nexora Institute of Technology"
                    autoComplete="organization"
                  />
                </ProfileField>
              </div>

              <div className="profile-action-row">
                <button type="button" onClick={handleSkip} disabled={saving} className="profile-skip-btn">
                  {dirty && showUnsavedNotice ? "Discard and skip" : "Skip for now"}
                </button>
                <button type="submit" disabled={saving || saved} className="auth-submit-btn profile-submit-btn">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    "Saved"
                  ) : (
                    "Save Profile"
                  )}
                </button>
              </div>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}

function ProfileField({
  label,
  helperText,
  error,
  children,
  className = "",
}: {
  label: string;
  helperText: string;
  error?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`profile-field ${className}`}>
      <span>{label}</span>
      {children}
      <small className={error ? "text-destructive" : "text-muted-foreground"}>{helperText}</small>
    </label>
  );
}

function ProfileSkeleton() {
  return (
    <div className="profile-fields-grid" aria-label="Loading profile">
      {[0, 1, 2].map((item) => (
        <div key={item} className={`profile-field ${item === 2 ? "profile-span-2" : ""}`}>
          <span className="h-3 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-11 animate-pulse rounded-2xl bg-muted" />
        </div>
      ))}
    </div>
  );
}
