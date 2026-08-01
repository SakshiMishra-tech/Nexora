import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  User,
  Lock,
  Bell,
  Shield,
  Palette,
  Globe,
  Award,
  Trash2,
  Settings,
  Mail,
  Smartphone,
  Check,
  ChevronRight,
  Loader2,
  KeyRound,
  Eye,
  Plus,
  Trash,
  ExternalLink,
  Laptop,
  CheckCircle2,
  LogOut,
  AlertTriangle,
  Info
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SiteNav } from "@/components/SiteNav";
import { AUTH_ROUTES, getProfileCompletionPercent } from "@/lib/auth";
import { CAMPUS_MODULES, type CampusModuleId } from "@/lib/modules";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Nexora - Settings" }] }),
  component: SettingsRoute,
});

type SettingsSection =
  | "general"
  | "profile"
  | "account"
  | "security"
  | "notifications"
  | "privacy"
  | "appearance"
  | "language"
  | "verification"
  | "danger";

interface TabItem {
  id: SettingsSection;
  label: string;
  icon: any;
  category: "USER SETTINGS" | "APP PREFERENCES" | "CRITICAL";
}

const TABS: TabItem[] = [
  { id: "general", label: "General", icon: Settings, category: "USER SETTINGS" },
  { id: "profile", label: "Profile Details", icon: User, category: "USER SETTINGS" },
  { id: "account", label: "Account", icon: Mail, category: "USER SETTINGS" },
  { id: "security", label: "Security & Login", icon: Lock, category: "USER SETTINGS" },
  { id: "privacy", label: "Privacy & Visibility", icon: Shield, category: "APP PREFERENCES" },
  { id: "notifications", label: "Notifications", icon: Bell, category: "APP PREFERENCES" },
  { id: "appearance", label: "Appearance", icon: Palette, category: "APP PREFERENCES" },
  { id: "language", label: "Language & Region", icon: Globe, category: "APP PREFERENCES" },
  { id: "verification", label: "Student Verification", icon: Award, category: "APP PREFERENCES" },
  { id: "danger", label: "Danger Zone", icon: Trash2, category: "CRITICAL" }
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
  const { profile, refreshProfile, user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");
  const [isSaving, setIsSaving] = useState(false);

  // Form State - General & Profile
  const [generalForm, setGeneralForm] = useState({
    name: "",
    username: "",
    about: "",
    phone: "",
    college: "",
    branch: "",
    year: "",
    skills: "React, UI Design, Product Management",
    interests: "Hackathons, Reading, Photography"
  });

  const [avatarUrl, setAvatarUrl] = useState("");

  // Sync profile details on load
  useEffect(() => {
    if (profile) {
      setGeneralForm({
        name: profile.full_name || "",
        username: (profile as any).username || user?.email?.split("@")[0] || "",
        about: (profile as any).about || "Student at " + (profile.college_name || "university"),
        phone: (profile as any).phone || "",
        college: profile.college_name || "",
        branch: (profile as any).branch || "Computer Science",
        year: (profile as any).year || "3rd Year",
        skills: (profile as any).skills || "React, TypeScript, Figma",
        interests: (profile as any).interests || "Campus Trading, Hackathons"
      });
      setAvatarUrl((profile as any).avatar_url || "");
    }
  }, [profile, user]);

  // Handle active section from storage
  useEffect(() => {
    const requested = window.sessionStorage.getItem("nexora-settings-section") as SettingsSection | null;
    window.sessionStorage.removeItem("nexora-settings-section");
    if (requested && TABS.some((t) => t.id === requested)) {
      setActiveSection(requested);
    }
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API update
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Profile settings updated successfully!");
    }, 800);
  };

  const handleLogout = async () => {
    await signOut();
    void navigate({ to: AUTH_ROUTES.login });
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-8">
        
        {/* Header Block */}
        <div className="commons-wall mb-6 border border-border p-6 shadow-soft rounded-2xl bg-paper/60 backdrop-blur-md">
          <span className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">
            Account Center
          </span>
          <h1 className="mt-3 font-display text-3xl font-black sm:text-5xl">Settings Dashboard</h1>
          <p className="mt-2 max-w-2xl text-xs font-semibold text-muted-foreground sm:text-sm">
            Manage your campus presence, configure spaces, and adjust security preferences.
          </p>
        </div>

        {/* Discord/Notion Style Split Layout */}
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          
          {/* Sidebar Tabs */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
              
              {/* Category-based lists */}
              {(["USER SETTINGS", "APP PREFERENCES", "CRITICAL"] as const).map((cat) => (
                <div key={cat} className="space-y-1 mb-4 last:mb-0">
                  <span className="block px-3 text-[9px] font-black uppercase tracking-wider text-muted-foreground/75 mb-1.5">
                    {cat}
                  </span>
                  <nav className="space-y-0.5">
                    {TABS.filter((t) => t.category === cat).map((tab) => {
                      const Icon = tab.icon;
                      const active = activeSection === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveSection(tab.id)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-black transition-all ${
                            active
                              ? "bg-primary text-primary-foreground shadow-soft"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ))}

            </div>
          </aside>

          {/* Settings Tab Content */}
          <section className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-soft">
            
            {/* GENERAL SETTINGS */}
            {activeSection === "general" && (
              <form onSubmit={handleSaveGeneral} className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-foreground">General Settings</h3>
                  <p className="text-xs text-muted-foreground mt-1">Configure your primary public campus identity details.</p>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Full Name</label>
                    <input
                      type="text"
                      value={generalForm.name}
                      onChange={(e) => setGeneralForm({ ...generalForm, name: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Username</label>
                    <input
                      type="text"
                      value={generalForm.username}
                      onChange={(e) => setGeneralForm({ ...generalForm, username: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground">Bio / About</label>
                    <textarea
                      rows={3}
                      value={generalForm.about}
                      onChange={(e) => setGeneralForm({ ...generalForm, about: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Phone Number</label>
                    <input
                      type="text"
                      value={generalForm.phone}
                      placeholder="e.g. +91 98765 43210"
                      onChange={(e) => setGeneralForm({ ...generalForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">College / University</label>
                    <input
                      type="text"
                      value={generalForm.college}
                      onChange={(e) => setGeneralForm({ ...generalForm, college: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Branch / Major</label>
                    <input
                      type="text"
                      value={generalForm.branch}
                      onChange={(e) => setGeneralForm({ ...generalForm, branch: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Graduation Year</label>
                    <input
                      type="text"
                      value={generalForm.year}
                      onChange={(e) => setGeneralForm({ ...generalForm, year: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Skills</label>
                    <input
                      type="text"
                      value={generalForm.skills}
                      onChange={(e) => setGeneralForm({ ...generalForm, skills: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Interests</label>
                    <input
                      type="text"
                      value={generalForm.interests}
                      onChange={(e) => setGeneralForm({ ...generalForm, interests: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            )}

            {/* PROFILE DETAILS */}
            {activeSection === "profile" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-foreground">Profile Details</h3>
                  <p className="text-xs text-muted-foreground mt-1">Manage avatar, social profiles, and visible credentials.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full border border-border bg-secondary flex items-center justify-center overflow-hidden">
                      {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-muted-foreground" />}
                    </div>
                    <div>
                      <Button variant="outline" className="text-xs">Upload Photo</Button>
                      <p className="text-[10px] text-muted-foreground mt-1">Recommended: Square JPG or PNG, max 2MB.</p>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">GitHub Profile</label>
                      <input type="text" placeholder="https://github.com/username" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground">LinkedIn Profile</label>
                      <input type="text" placeholder="https://linkedin.com/in/username" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-semibold outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACCOUNT */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-foreground">Account Settings</h3>
                  <p className="text-xs text-muted-foreground mt-1">Manage sign-in settings and export account archives.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-2xl bg-background/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black">Login Email</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{user?.email}</p>
                    </div>
                    <Button variant="outline" className="text-xs">Change Email</Button>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-background/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black">Export Account Data</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Download a copy of your listings, chats, and preferences.</p>
                    </div>
                    <Button variant="outline" className="text-xs">Export JSON</Button>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-background/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black">Linked Accounts</p>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground">Google (Disconnected)</span>
                        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">GitHub (Connected)</span>
                      </div>
                    </div>
                    <Button variant="outline" className="text-xs">Link Accounts</Button>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY */}
            {activeSection === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-foreground">Security & Login</h3>
                  <p className="text-xs text-muted-foreground mt-1">Manage passwords, active sessions, and verification methods.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-2xl bg-background/50">
                    <p className="text-xs font-black">Two-Factor Authentication (2FA)</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Add an extra layer of security to your account.</p>
                    <span className="inline-flex items-center gap-1 rounded bg-orange-100 px-2 py-1 text-[10px] font-semibold text-orange-800 mt-2">
                      <Info className="h-3 w-3" /> Coming Soon
                    </span>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-background/50">
                    <p className="text-xs font-black mb-3">Active Sessions & Devices</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-border/40 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-bold">Windows Laptop • Chrome</p>
                            <p className="text-[10px] text-muted-foreground">Delhi, India • Active Now</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded">This Device</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-bold">iPhone 14 • Safari</p>
                            <p className="text-[10px] text-muted-foreground">Delhi, India • 2 days ago</p>
                          </div>
                        </div>
                        <button className="text-[10px] font-bold text-destructive hover:underline">Revoke</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PRIVACY */}
            {activeSection === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-foreground">Privacy & Visibility</h3>
                  <p className="text-xs text-muted-foreground mt-1">Control who sees your listings and details on campus.</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-background/50">
                    <div>
                      <p className="text-xs font-black">Profile Visibility</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Let only verified students view your college major & year.</p>
                    </div>
                    <select className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold outline-none">
                      <option>Campus Only</option>
                      <option>Public</option>
                      <option>Hidden</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-background/50">
                    <div>
                      <p className="text-xs font-black">Phone Number Visibility</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Hide phone number on active roommate listings.</p>
                    </div>
                    <select className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold outline-none">
                      <option>Hidden</option>
                      <option>Visible to Matches</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-foreground">Notification Settings</h3>
                  <p className="text-xs text-muted-foreground mt-1">Tune how and when you receive notifications from active spaces.</p>
                </div>

                <div className="space-y-4">
                  {(["Marketplace", "Chat", "Projects", "Notes", "Roommate", "Events", "Lost & Found"] as const).map((space) => (
                    <div key={space} className="flex items-center justify-between p-4 border border-border rounded-2xl bg-background/50">
                      <div>
                        <p className="text-xs font-black">{space} Alerts</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Get instant updates regarding {space.toLowerCase()} activities.</p>
                      </div>
                      <div className="flex gap-2">
                        <label className="inline-flex items-center gap-1 text-xs">
                          <input type="checkbox" defaultChecked className="rounded border-border text-primary" />
                          <span className="font-semibold text-muted-foreground">Push</span>
                        </label>
                        <label className="inline-flex items-center gap-1 text-xs">
                          <input type="checkbox" defaultChecked className="rounded border-border text-primary" />
                          <span className="font-semibold text-muted-foreground">Email</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* APPEARANCE */}
            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-foreground">Appearance Preferences</h3>
                  <p className="text-xs text-muted-foreground mt-1">Configure layout densities, color themes, and accents.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-2xl bg-background/50">
                    <p className="text-xs font-black mb-3">Theme Selection</p>
                    <div className="grid grid-cols-3 gap-3">
                      <button className="flex flex-col items-center justify-center p-3 rounded-xl border-2 border-primary bg-card hover:bg-secondary transition-colors">
                        <span className="text-xs font-bold text-foreground">Dark Theme</span>
                      </button>
                      <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-paper hover:bg-secondary transition-colors">
                        <span className="text-xs font-bold text-muted-foreground">Light Theme</span>
                      </button>
                      <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-border bg-secondary/45 hover:bg-secondary transition-colors">
                        <span className="text-xs font-bold text-muted-foreground">System Default</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-background/50">
                    <div>
                      <p className="text-xs font-black">Compact Mode</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Minimize layout padding to fit more content on-screen.</p>
                    </div>
                    <input type="checkbox" className="rounded border-border text-primary" />
                  </div>
                </div>
              </div>
            )}

            {/* LANGUAGE */}
            {activeSection === "language" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-foreground">Language & Region</h3>
                  <p className="text-xs text-muted-foreground mt-1">Adjust localization parameters for your campus hub.</p>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-2xl bg-background/50">
                  <div>
                    <p className="text-xs font-black">Preferred Language</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Select the default interface language.</p>
                  </div>
                  <select className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold outline-none">
                    <option>English (US)</option>
                    <option>Hindi (हिंदी)</option>
                    <option>Spanish (Español)</option>
                  </select>
                </div>
              </div>
            )}

            {/* VERIFICATION */}
            {activeSection === "verification" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-foreground">Student Verification</h3>
                  <p className="text-xs text-muted-foreground mt-1">Submit validation credentials to unlock student-only areas.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-2xl bg-background/50 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black">College Email ID</p>
                      <p className="text-[11px] text-success font-semibold mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified (2026-07-15)
                      </p>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">Active</span>
                  </div>

                  <div className="p-4 border border-border rounded-2xl bg-background/50">
                    <p className="text-xs font-black mb-2">Student ID Verification</p>
                    <p className="text-[11px] text-muted-foreground mb-4">Upload a photo of your physical student ID card to earn the campus verified badge.</p>
                    <div className="border border-dashed border-border rounded-xl p-6 text-center bg-card/25 hover:bg-secondary/40 transition-colors cursor-pointer">
                      <p className="text-xs font-bold text-primary">Click to upload Student ID</p>
                      <p className="text-[10px] text-muted-foreground mt-1">PDF, PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DANGER ZONE */}
            {activeSection === "danger" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-destructive">Danger Zone</h3>
                  <p className="text-xs text-muted-foreground mt-1">Perform destructive account procedures and actions.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-destructive/20 rounded-2xl bg-destructive/5 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-destructive">Deactivate Account</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Temporarily hide your listings and roommate search profile.</p>
                    </div>
                    <Button variant="outline" className="text-xs border-destructive/20 hover:bg-destructive/10 text-destructive">Deactivate</Button>
                  </div>

                  <div className="p-4 border border-destructive/20 rounded-2xl bg-destructive/5 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-destructive">Delete Account Permanently</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">This action is irreversible. All database rows will be deleted.</p>
                    </div>
                    <button className="flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-black text-destructive-foreground hover:bg-destructive/90 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Nexora Account</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </section>

        </div>
      </section>
    </main>
  );
}
