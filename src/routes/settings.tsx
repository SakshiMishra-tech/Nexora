import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Check,
  GraduationCap,
  Heart,
  HelpCircle,
  Loader2,
  Lock,
  MapPin,
  Monitor,
  Shield,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
  Users,
  Wrench,
  Car,
  Calendar,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SiteNav } from "@/components/SiteNav";
import { AUTH_ROUTES, getProfileCompletionPercent } from "@/lib/auth";
import { CAMPUS_MODULES, type CampusModuleId } from "@/lib/modules";
import { useAuth } from "@/hooks/useAuth";
import {
  getUserSettings,
  getEnabledModules,
  updateModuleEnabled,
} from "@/services/user-settings.service";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Nexora - Settings" }] }),
  component: SettingsRoute,
});

type SettingsSection = "profile" | "spaces" | "notifications" | "privacy" | "account" | "appearance" | "support";

const moduleIcons = {
  marketplace: ShoppingBag,
  "lost-found": MapPin,
  roommates: Users,
  "campus-connect": Heart,
  notes: BookOpen,
  projects: Wrench,
  rides: Car,
  tuition: GraduationCap,
  events: Calendar,
} satisfies Record<CampusModuleId, typeof ShoppingBag>;

const sections: Array<{ id: SettingsSection; label: string; icon: typeof UserRound }> = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "spaces", label: "Campus Spaces", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "account", label: "Account", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Monitor },
  { id: "support", label: "Support", icon: HelpCircle },
];

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
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [enabled, setEnabled] = useState<CampusModuleId[]>(CAMPUS_MODULES.map((m) => m.id));
  const [savingModule, setSavingModule] = useState<CampusModuleId | null>(null);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    productUpdates: true,
    campusActivity: true,
    weeklySummary: false,
  });

  useEffect(() => {
    const requested = window.sessionStorage.getItem("nexora-settings-section") as SettingsSection | null;
    window.sessionStorage.removeItem("nexora-settings-section");

    if (requested && sections.some((section) => section.id === requested)) {
      setActiveSection(requested);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      getUserSettings(user.id).then((settings) => {
        setEnabled(getEnabledModules(settings));
      });
    }
  }, [user?.id]);

  const displayName = useMemo(() => {
    const fromProfile = profile?.full_name?.trim();
    return fromProfile || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  }, [profile, user]);

  const completionPercent = getProfileCompletionPercent(profile);

  const toggleModule = async (moduleId: CampusModuleId) => {
    const wasEnabled = enabled.includes(moduleId);
    const nextEnabled = wasEnabled
      ? enabled.filter((item) => item !== moduleId)
      : [...enabled, moduleId];

    const previous = enabled;
    setEnabled(nextEnabled);
    setSavingModule(moduleId);

    if (!user) return;

    const { error } = await updateModuleEnabled(user.id, moduleId, !wasEnabled);
    setSavingModule(null);

    if (error) {
      console.error("Campus spaces update failed:", error);
      setEnabled(previous);
      toast.error("Something went wrong. Please try again.");
      return;
    }

    toast.success("Campus spaces updated.");
  };

  const handleRefreshProfile = async () => {
    setRefreshingProfile(true);
    const nextProfile = await refreshProfile();
    setRefreshingProfile(false);

    if (!nextProfile) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    toast.success("Profile refreshed.");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="commons-wall mb-5 border border-border p-5 shadow-soft">
          <span className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
            Settings
          </span>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-6xl">Settings Dashboard</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">
            Manage your profile, spaces, privacy and account preferences from one place.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit border border-border bg-card p-3 shadow-soft">
            <div className="mb-3 border border-border bg-background p-3">
              <p className="truncate text-sm font-black">{displayName}</p>
              <p className="mt-1 truncate text-xs font-bold text-muted-foreground">{user?.email}</p>
            </div>
            <nav className="grid gap-2" aria-label="Settings sections">
              {sections.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex min-h-11 items-center gap-3 border px-3 text-left text-sm font-black transition ${
                      active ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-secondary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0 border border-border bg-card p-4 shadow-soft sm:p-5">
            {activeSection === "profile" && (
              <SettingsPanel
                eyebrow="Profile"
                title="Your campus identity"
                description="Keep the basic details students see across Nexora accurate and simple."
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <InfoTile label="Name" value={displayName} />
                  <InfoTile label="College" value={profile?.college_name || "Not added"} />
                  <InfoTile label="Completion" value={`${completionPercent}%`} />
                </div>
                <div className="mt-4 profile-completion-track" aria-hidden="true">
                  <span style={{ width: `${completionPercent}%` }} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void navigate({ to: AUTH_ROUTES.completeProfile })}
                    className="auth-submit-btn w-auto px-5"
                  >
                    Edit profile
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleRefreshProfile()}
                    disabled={refreshingProfile}
                    className="profile-skip-btn"
                  >
                    {refreshingProfile ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </SettingsPanel>
            )}

            {activeSection === "spaces" && (
              <SettingsPanel
                eyebrow="Campus Spaces"
                title="Choose active spaces"
                description="Keep only the Nexora sections you actually use active in your account."
              >
                <div className="settings-campus-list">
                  {CAMPUS_MODULES.map((module) => {
                    const Icon = moduleIcons[module.id];
                    const checked = enabled.includes(module.id);

                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => void toggleModule(module.id)}
                        disabled={savingModule !== null}
                        className="settings-campus-row"
                      >
                        <span className="campus-space-icon">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="campus-space-copy">
                          <strong>{module.label}</strong>
                          <small>{module.description}</small>
                        </span>
                        <span className={`settings-campus-toggle ${checked ? "settings-campus-toggle-on" : ""}`}>
                          {savingModule === module.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>{checked ? "ON" : "OFF"}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SettingsPanel>
            )}

            {activeSection === "notifications" && (
              <SettingsPanel
                eyebrow="Notifications"
                title="Control updates"
                description="Choose which in-app updates are worth your attention."
              >
                <PreferenceToggle
                  label="Campus activity"
                  description="Updates from the campus spaces you enabled."
                  checked={notificationPrefs.campusActivity}
                  onChange={() => setNotificationPrefs((current) => ({ ...current, campusActivity: !current.campusActivity }))}
                />
                <PreferenceToggle
                  label="Product updates"
                  description="Important Nexora feature and safety updates."
                  checked={notificationPrefs.productUpdates}
                  onChange={() => setNotificationPrefs((current) => ({ ...current, productUpdates: !current.productUpdates }))}
                />
                <PreferenceToggle
                  label="Weekly summary"
                  description="A quiet digest instead of frequent updates."
                  checked={notificationPrefs.weeklySummary}
                  onChange={() => setNotificationPrefs((current) => ({ ...current, weeklySummary: !current.weeklySummary }))}
                />
              </SettingsPanel>
            )}

            {activeSection === "privacy" && (
              <SettingsPanel
                eyebrow="Privacy"
                title="Privacy and safety"
                description="Nexora keeps account controls clear while deeper privacy controls are prepared."
              >
                <StatusRow label="Verified campus access" value="Required" />
                <StatusRow label="Profile visibility" value="Campus only" />
                <StatusRow label="Direct messages" value="From enabled spaces" />
              </SettingsPanel>
            )}

            {activeSection === "account" && (
              <SettingsPanel
                eyebrow="Account"
                title="Account basics"
                description="Review your sign-in email and account status."
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <InfoTile label="Email" value={user?.email || "Not available"} />
                  <InfoTile label="Status" value={user ? "Signed in" : "Signed out"} />
                </div>
              </SettingsPanel>
            )}

            {activeSection === "appearance" && (
              <SettingsPanel
                eyebrow="Appearance"
                title="Appearance"
                description="Theme controls are planned for a later database-backed preferences pass."
              >
                <div className="border border-dashed border-border bg-background p-4 text-sm font-semibold text-muted-foreground">
                  Nexora is using the current brand theme. No appearance action is needed right now.
                </div>
              </SettingsPanel>
            )}

            {activeSection === "support" && (
              <SettingsPanel
                eyebrow="Support"
                title="Get help"
                description="Use these links for policy and support paths without leaving the Nexora flow."
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <a href="/privacy" className="border border-border bg-background p-4 text-sm font-black hover:bg-secondary">
                    Privacy policy
                  </a>
                  <a href="/terms" className="border border-border bg-background p-4 text-sm font-black hover:bg-secondary">
                    Terms of service
                  </a>
                </div>
              </SettingsPanel>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function SettingsPanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-primary">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-black">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm font-semibold text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-background p-4">
      <p className="text-xs font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-2 truncate text-sm font-black">{value}</p>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 border border-border bg-background p-4">
      <div>
        <p className="text-sm font-black">{label}</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">Managed inside Nexora account safety.</p>
      </div>
      <span className="inline-flex items-center gap-2 bg-success/10 px-3 py-1 text-xs font-black uppercase text-success">
        <Check className="h-3.5 w-3.5" />
        {value}
      </span>
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="mb-3 flex w-full items-center justify-between gap-3 border border-border bg-background p-4 text-left hover:bg-secondary"
    >
      <span>
        <strong className="block text-sm font-black">{label}</strong>
        <small className="mt-1 block text-xs font-semibold text-muted-foreground">{description}</small>
      </span>
      <span className={`settings-campus-toggle ${checked ? "settings-campus-toggle-on" : ""}`}>
        <span>{checked ? "ON" : "OFF"}</span>
      </span>
    </button>
  );
}
