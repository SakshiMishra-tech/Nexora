import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Briefcase,
  CalendarDays,
  Camera,
  Car,
  CheckCircle2,
  Clock,
  GraduationCap,
  Home,
  KeyRound,
  Layers,
  Loader2,
  LogOut,
  Mail,
  PackageSearch,
  Shield,
  ShoppingBag,
  Trash2,
  UserCircle,
  UserMinus,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NexoraLogo } from "@/components/brand/NexoraLogo";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { getAuthRedirectUrl } from "@/lib/auth";
import { CAMPUS_MODULES, type CampusModuleId } from "@/lib/modules";
import { supabase } from "@/lib/supabase";
import {
  cancelAccountDeletion,
  deactivateAccount,
  reactivateAccount,
  requestAccountDeletion,
  sendPasswordResetEmail,
} from "@/services/account.service";
import {
  getUserSettings,
  isModuleEnabled,
  updateModuleEnabled,
  type UserSettingsRow,
} from "@/services/user-settings.service";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Nexora - Settings" }] }),
  component: SettingsRoute,
});

type SettingsTab = "profile" | "security" | "modules";

const tabs: Array<{ id: SettingsTab; label: string; icon: React.ElementType }> = [
  { id: "profile", label: "Profile & Campus", icon: UserCircle },
  { id: "security", label: "Account & Security", icon: Shield },
  { id: "modules", label: "Modules", icon: Layers },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SettingsRoute() {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const { profile, refreshProfile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    (new URLSearchParams(window.location.search).get("tab") as SettingsTab) || "profile",
  );
  const [form, setForm] = useState({ fullName: "", collegeName: "", phone: "", whatsapp: "" });
  const [initialForm, setInitialForm] = useState({
    fullName: "",
    collegeName: "",
    phone: "",
    whatsapp: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!user || initialized.current) return;
    const metadata = user.user_metadata ?? {};
    const next = {
      fullName: profile?.full_name ?? metadata.full_name ?? "",
      collegeName: profile?.college_name ?? metadata.college_name ?? "",
      phone: (profile as { phone?: string | null } | null)?.phone ?? metadata.phone ?? "",
      whatsapp:
        (profile as { whatsapp?: string | null } | null)?.whatsapp ?? metadata.whatsapp ?? "",
    };
    setForm(next);
    setInitialForm(next);
    setAvatarUrl(
      (profile as { avatar_url?: string | null } | null)?.avatar_url ?? metadata.avatar_url ?? "",
    );
    initialized.current = true;
  }, [profile, user]);

  const updateTab = useCallback((tab: SettingsTab) => {
    setActiveTab(tab);
    window.history.replaceState({}, "", `?tab=${tab}`);
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || saving) return;
    const fullName = form.fullName.trim();
    const collegeName = form.collegeName.trim();
    if (fullName.length < 2) return toast.error("Enter a full name with at least 2 characters.");
    if (collegeName.length < 3) return toast.error("Enter your college or university name.");

    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? null,
          full_name: fullName,
          college_name: collegeName,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          college_name: collegeName,
          phone: form.phone.trim(),
          whatsapp: form.whatsapp.trim(),
        },
      });
      if (metadataError) throw metadataError;
      const next = {
        fullName,
        collegeName,
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
      };
      setForm(next);
      setInitialForm(next);
      await refreshProfile();
      toast.success("Profile saved.");
    } catch (error) {
      toast.error(getErrorMessage(error, "We could not save your profile."));
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose an image file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Profile photos must be 5 MB or smaller.");

    setAvatarUploading(true);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, email: user.email ?? null, avatar_url: publicUrl },
          { onConflict: "id" },
        );
      if (profileError) throw profileError;
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (metadataError) throw metadataError;
      setAvatarUrl(publicUrl);
      await refreshProfile();
      toast.success("Profile photo updated.");
    } catch (error) {
      toast.error(getErrorMessage(error, "We could not update your photo."));
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const removeAvatar = async () => {
    if (!user || avatarUploading) return;
    setAvatarUploading(true);
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, email: user.email ?? null, avatar_url: null }, { onConflict: "id" });
      if (profileError) throw profileError;
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { avatar_url: null },
      });
      if (metadataError) throw metadataError;
      setAvatarUrl("");
      await refreshProfile();
      toast.success("Profile photo removed.");
    } catch (error) {
      toast.error(getErrorMessage(error, "We could not remove your photo."));
    } finally {
      setAvatarUploading(false);
    }
  };

  const requestEmailChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || emailSubmitting) return;
    const email = newEmail.trim().toLowerCase();
    if (!emailPattern.test(email)) return toast.error("Enter a valid email address.");
    if (email === user.email?.toLowerCase()) return toast.error("Enter a different email address.");

    setEmailSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: getAuthRedirectUrl() },
      );
      if (error) throw error;
      setNewEmail("");
      toast.success(
        "Confirmation email sent. Open the confirmation link to finish changing your email.",
      );
    } catch (error) {
      toast.error(getErrorMessage(error, "We could not send the confirmation email."));
    } finally {
      setEmailSubmitting(false);
    }
  };

  const initials = (form.fullName || user?.email || "N")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const dirty =
    form.fullName !== initialForm.fullName ||
    form.collegeName !== initialForm.collegeName ||
    form.phone !== initialForm.phone ||
    form.whatsapp !== initialForm.whatsapp;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="settings-icon-button"
              aria-label="Back to Nexora"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <Link to="/" className="shrink-0">
              <NexoraLogo size="sm" />
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:inline">/</span>
            <span className="truncate text-sm font-semibold text-muted-foreground">Settings</span>
          </div>
          <ProfileDropdown />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[216px_minmax(0,1fr)] lg:py-8">
        <nav aria-label="Settings sections" className="settings-nav">
          <p className="settings-nav-label">Settings</p>
          <div className="flex gap-1 overflow-x-auto lg:flex-col">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => updateTab(id)}
                className={`settings-nav-item ${activeTab === id ? "settings-nav-item-active" : ""}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>

        <section className="min-w-0">
          {activeTab === "profile" && (
            <form onSubmit={saveProfile} className="settings-panel">
              <SettingsHeading
                title="Profile & Campus"
                description="Your shared Nexora identity and campus details."
              />
              <div className="settings-avatar-row">
                <label
                  htmlFor="avatar-upload"
                  className="settings-avatar"
                  title="Change profile photo"
                >
                  {avatarUrl ? <img src={avatarUrl} alt="Profile" /> : <span>{initials}</span>}
                  <span className="settings-avatar-overlay">
                    <Camera className="h-4 w-4" />
                  </span>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={uploadAvatar}
                  />
                </label>
                <div>
                  <p className="font-semibold">Profile photo</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use a clear photo. JPG, PNG, or WebP up to 5 MB.
                  </p>
                  {avatarUploading && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading photo
                    </p>
                  )}
                </div>
              </div>
              <SettingsGroup icon={UserCircle} title="Personal information">
                <div className="settings-grid">
                  <InputField
                    id="settings-full-name"
                    label="Full name"
                    value={form.fullName}
                    onChange={(value) => setForm((current) => ({ ...current, fullName: value }))}
                    placeholder="Your name"
                    required
                  />
                  <InputField
                    id="settings-phone"
                    label="Phone number"
                    type="tel"
                    value={form.phone}
                    onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                    placeholder="Optional"
                  />
                </div>
              </SettingsGroup>
              <SettingsGroup icon={GraduationCap} title="Campus information">
                <InputField
                  id="settings-college"
                  label="College or university"
                  value={form.collegeName}
                  onChange={(value) => setForm((current) => ({ ...current, collegeName: value }))}
                  placeholder="Your institution"
                  required
                />
              </SettingsGroup>
              <div className="settings-actions">
                {dirty && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
                <Button type="submit" disabled={saving} className="ml-auto min-w-28">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <SecurityPanel
              user={user}
              onRequestEmailChange={requestEmailChange}
              newEmail={newEmail}
              setNewEmail={setNewEmail}
              emailSubmitting={emailSubmitting}
            />
          )}
          {activeTab === "modules" && <ModulesPanel userId={user?.id} />}
        </section>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Security Panel
// ─────────────────────────────────────────────────────────────────────────────

type SecurityPanelProps = {
  user: ReturnType<typeof useAuth>["user"];
  onRequestEmailChange: (e: React.FormEvent) => Promise<unknown>;
  newEmail: string;
  setNewEmail: (v: string) => void;
  emailSubmitting: boolean;
};

function SecurityPanel({
  user,
  onRequestEmailChange,
  newEmail,
  setNewEmail,
  emailSubmitting,
}: SecurityPanelProps) {
  const navigate = useNavigate();
  const { signOut, accountState, refreshAccountState, refreshProfile } = useAuth();

  // ── Local state ──────────────────────────────────────────────
  const [passwordResetting, setPasswordResetting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Deactivation dialog
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // Deletion request dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Cancel deletion dialog
  const [showCancelDeleteDialog, setShowCancelDeleteDialog] = useState(false);
  const [cancellingDeletion, setCancellingDeletion] = useState(false);

  // Reactivate dialog (from pending-deletion state, where account is also deactivated)
  const [reactivating, setReactivating] = useState(false);

  const isDeactivated = accountState?.is_deactivated ?? false;
  const hasPendingDeletion = Boolean(accountState?.scheduled_deletion_at);
  const scheduledDeletionDate = accountState?.scheduled_deletion_at
    ? new Date(accountState.scheduled_deletion_at)
    : null;
  const daysUntilDeletion = scheduledDeletionDate
    ? Math.max(0, Math.ceil((scheduledDeletionDate.getTime() - Date.now()) / 86_400_000))
    : null;

  // Is the auth provider email/password (not OAuth)?
  const isEmailProvider =
    user?.app_metadata?.provider === "email" ||
    user?.identities?.some((id) => id.provider === "email");

  // ── Handlers ─────────────────────────────────────────────────

  const handlePasswordReset = async () => {
    if (!user?.email || passwordResetting) return;
    setPasswordResetting(true);
    try {
      const err = await sendPasswordResetEmail(user.email);
      if (err) {
        toast.error(err);
      } else {
        toast.success("Password reset email sent. Check your inbox.");
      }
    } finally {
      setPasswordResetting(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) throw error;
      navigate({ to: "/auth/login", replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Sign out failed. Please try again."));
      setSigningOut(false);
    }
  };

  const handleDeactivate = async () => {
    if (deactivating) return;
    setDeactivating(true);
    try {
      const err = await deactivateAccount();
      if (err) {
        toast.error(err);
      } else {
        await refreshAccountState();
        setShowDeactivateDialog(false);
        toast.success("Your account has been deactivated. Sign in again to reactivate it.");
        // Sign out so the deactivated state is enforced immediately
        await signOut();
        navigate({ to: "/auth/login", replace: true });
      }
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivate = async () => {
    if (reactivating) return;
    setReactivating(true);
    try {
      const err = await reactivateAccount();
      if (err) {
        toast.error(err);
      } else {
        await refreshAccountState();
        await refreshProfile();
        toast.success("Your account is active again.");
      }
    } finally {
      setReactivating(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (deleting || deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const result = await requestAccountDeletion();
      if (result.error) {
        toast.error(result.error);
      } else {
        await refreshAccountState();
        setShowDeleteDialog(false);
        setDeleteConfirmText("");
        toast.success(
          `Deletion scheduled for ${result.scheduledAt!.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. You can cancel within 30 days.`,
        );
        // Sign out so the deactivated+pending-deletion state is enforced
        await signOut();
        navigate({ to: "/auth/login", replace: true });
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDeletion = async () => {
    if (cancellingDeletion) return;
    setCancellingDeletion(true);
    try {
      const err = await cancelAccountDeletion();
      if (err) {
        toast.error(err);
      } else {
        await refreshAccountState();
        await refreshProfile();
        setShowCancelDeleteDialog(false);
        toast.success("Deletion request cancelled. Your account is restored.");
      }
    } finally {
      setCancellingDeletion(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="settings-panel">
      <SettingsHeading
        title="Account & Security"
        description="Manage your login credentials and account access."
      />

      {/* ── Pending deletion banner ── */}
      {hasPendingDeletion && (
        <div className="accsec-banner accsec-banner-danger mb-6">
          <div className="flex items-start gap-3">
            <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-destructive">Account deletion scheduled</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your account and all associated data will be permanently deleted on{" "}
                <strong>
                  {scheduledDeletionDate?.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </strong>{" "}
                ({daysUntilDeletion} {daysUntilDeletion === 1 ? "day" : "days"} remaining). You can
                cancel this request before then.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/8"
              onClick={() => setShowCancelDeleteDialog(true)}
              disabled={cancellingDeletion}
            >
              Cancel deletion
            </Button>
          </div>
        </div>
      )}

      {/* ── Deactivated banner ── */}
      {isDeactivated && !hasPendingDeletion && (
        <div className="accsec-banner accsec-banner-warn mb-6">
          <div className="flex items-start gap-3">
            <UserMinus className="mt-0.5 h-4 w-4 shrink-0 text-warm" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold" style={{ color: "var(--warm)" }}>
                Account deactivated
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your profile and content are hidden. Reactivate to restore visibility.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={handleReactivate}
              disabled={reactivating}
            >
              {reactivating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reactivate"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Email address ── */}
      <SettingsGroup icon={Mail} title="Email address">
        <div className="settings-current-email">
          <div>
            <p className="settings-field-label">Current email</p>
            <p className="mt-1 font-medium">{user?.email || "Unavailable"}</p>
          </div>
          {user?.email_confirmed_at ? (
            <span className="settings-verified">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
            </span>
          ) : (
            <span className="settings-pending">Unverified</span>
          )}
        </div>
        <form onSubmit={onRequestEmailChange} className="mt-5 border-t border-border pt-5">
          <InputField
            id="settings-new-email"
            label="New email address"
            type="email"
            value={newEmail}
            onChange={setNewEmail}
            placeholder="name@college.edu"
            autoComplete="email"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-muted-foreground">
              We will send a confirmation link to complete this change. Your email stays unchanged
              until confirmed.
            </p>
            <Button type="submit" disabled={emailSubmitting}>
              {emailSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send confirmation"}
            </Button>
          </div>
        </form>
      </SettingsGroup>

      {/* ── Password ── */}
      {isEmailProvider && (
        <SettingsGroup icon={KeyRound} title="Password">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-muted-foreground">
              A password reset link will be sent to <strong>{user?.email}</strong>. Follow the link
              to set a new password.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handlePasswordReset}
              disabled={passwordResetting}
            >
              {passwordResetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send reset email"
              )}
            </Button>
          </div>
        </SettingsGroup>
      )}

      {/* ── Account status ── */}
      <SettingsGroup icon={Shield} title="Account status">
        <dl className="settings-status-grid">
          <StatusItem
            label="Email verification"
            value={user?.email_confirmed_at ? "Verified" : "Pending"}
          />
          <StatusItem
            label="Member since"
            value={
              user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })
                : "Unavailable"
            }
          />
          <StatusItem label="Account status" value={isDeactivated ? "Deactivated" : "Active"} />
          {hasPendingDeletion && scheduledDeletionDate && (
            <StatusItem
              label="Scheduled deletion"
              value={scheduledDeletionDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          )}
        </dl>
      </SettingsGroup>

      {/* ── Sign out ── */}
      <SettingsGroup icon={LogOut} title="Sign out">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-xl text-sm text-muted-foreground">
            Sign out of Nexora on this device. Your data is preserved.
          </p>
          <Button type="button" variant="outline" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign out"}
          </Button>
        </div>
      </SettingsGroup>

      {/* ── Account management (danger zone) ── */}
      <section className="settings-group accsec-danger-zone">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h2 className="text-sm font-semibold text-destructive">Account management</h2>
        </div>

        {/* Deactivate */}
        <div className="accsec-action-row">
          <div>
            <p className="text-sm font-semibold">Deactivate account</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Temporarily hide your profile and content. Sign in at any time to reactivate.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/8 hover:text-destructive"
            onClick={() => setShowDeactivateDialog(true)}
            disabled={isDeactivated || hasPendingDeletion}
          >
            <UserMinus className="h-3.5 w-3.5" />
            Deactivate
          </Button>
        </div>

        {/* Delete */}
        <div className="accsec-action-row mt-4 border-t border-border pt-4">
          <div>
            <p className="text-sm font-semibold">Delete account</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Permanently remove your account and all data after a 30-day grace period.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="shrink-0"
            onClick={() => setShowDeleteDialog(true)}
            disabled={hasPendingDeletion}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {hasPendingDeletion ? "Deletion pending" : "Delete account"}
          </Button>
        </div>
      </section>

      {/* ── Deactivate dialog ── */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-destructive" />
              Deactivate account
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>While your account is deactivated:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Your profile will not appear in discovery or search results.</li>
                  <li>Your listings in Marketplace, Roommates, and Lost & Found will be hidden.</li>
                  <li>Your Campus Connect and Dating profiles will be paused.</li>
                  <li>Your account and all data are preserved.</li>
                </ul>
                <p className="pt-1">
                  <strong>To reactivate,</strong> simply sign in again or use the Reactivate button
                  in Account &amp; Security.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeactivateDialog(false)}
              disabled={deactivating}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/8"
              onClick={handleDeactivate}
              disabled={deactivating}
            >
              {deactivating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Yes, deactivate my account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete dialog ── */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setDeleteConfirmText("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete account permanently
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  After the <strong>30-day grace period</strong>, the following will be permanently
                  deleted:
                </p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Your profile, photos, and personal information</li>
                  <li>All your Marketplace listings and chat history</li>
                  <li>Your Lost &amp; Found posts</li>
                  <li>Your Roommate listing and requests</li>
                  <li>Your Campus Connect and Dating profile</li>
                </ul>
                <p className="pt-1">
                  Your account will be <strong>deactivated immediately</strong> and you will be
                  signed out. You can cancel this request during the grace period by signing in.
                </p>
                <div className="mt-3 flex items-center gap-1.5 rounded-md border border-destructive/20 bg-destructive/6 px-3 py-2 text-xs font-medium text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  This action cannot be undone after 30 days.
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            <label htmlFor="delete-confirm" className="settings-field-label mb-1.5 block">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="settings-input"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmText("");
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRequestDeletion}
              disabled={deleting || deleteConfirmText !== "DELETE"}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Schedule deletion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel deletion dialog ── */}
      <Dialog open={showCancelDeleteDialog} onOpenChange={setShowCancelDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Cancel deletion request
            </DialogTitle>
            <DialogDescription>
              Cancelling will restore your account. Your profile and content will become visible
              again according to your existing privacy preferences.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelDeleteDialog(false)}
              disabled={cancellingDeletion}
            >
              Keep deletion scheduled
            </Button>
            <Button onClick={handleCancelDeletion} disabled={cancellingDeletion}>
              {cancellingDeletion ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Yes, cancel deletion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modules Panel
// ─────────────────────────────────────────────────────────────────────────────

function ModulesPanel({ userId }: { userId?: string }) {
  const [settings, setSettings] = useState<UserSettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingModule, setSavingModule] = useState<CampusModuleId | null>(null);
  useEffect(() => {
    if (!userId) return;
    getUserSettings(userId).then((value) => {
      setSettings(value);
      setLoading(false);
    });
  }, [userId]);
  const toggleModule = async (moduleId: CampusModuleId) => {
    if (!userId || savingModule) return;
    const enabled = isModuleEnabled(settings, moduleId);
    setSavingModule(moduleId);
    const { data, error } = await updateModuleEnabled(userId, moduleId, !enabled);
    setSavingModule(null);
    if (error) return toast.error(error.message);
    setSettings(data);
    const label = CAMPUS_MODULES.find((module) => module.id === moduleId)?.label ?? "Module";
    toast.success(`${label} ${enabled ? "disabled" : "enabled"}.`);
  };
  return (
    <div className="settings-panel">
      <SettingsHeading
        title="Modules"
        description="Choose which Nexora spaces are active on your account."
      />
      {loading ? (
        <div className="flex min-h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {CAMPUS_MODULES.map((module) => {
            const enabled = isModuleEnabled(settings, module.id);
            const Icon = moduleIcon(module.id);
            return (
              <div key={module.id} className="settings-module-row">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="settings-module-icon">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold">{module.label}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  disabled={savingModule === module.id}
                  onClick={() => toggleModule(module.id)}
                  className={`settings-switch ${enabled ? "settings-switch-on" : ""}`}
                  aria-label={`${enabled ? "Disable" : "Enable"} ${module.label}`}
                >
                  <span />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared UI helpers
// ─────────────────────────────────────────────────────────────────────────────

function SettingsHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
function SettingsGroup({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="settings-group">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
function InputField({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="settings-field-label">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="settings-input"
      />
    </label>
  );
}
function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="settings-field-label">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
function moduleIcon(id: CampusModuleId) {
  return id === "marketplace"
    ? ShoppingBag
    : id === "lost-found"
      ? PackageSearch
      : id === "roommates"
        ? Home
        : id === "campus-connect"
          ? Users
          : id === "notes"
            ? BookOpen
            : id === "projects"
              ? Briefcase
              : id === "rides"
                ? Car
                : id === "tuition"
                  ? GraduationCap
                  : CalendarDays;
}
function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
