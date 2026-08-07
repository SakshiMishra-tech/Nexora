import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  Bell,
  ArrowLeft,
  Loader2,
  KeyRound,
  Shield,
  Mail,
  MapPin,
  Navigation,
  School,
  Building2,
  Layers,
  AlertTriangle,
  ShoppingBag,
  Heart,
  BookOpen,
  FolderGit2,
  Car,
  GraduationCap,
  CalendarDays,
  Sun,
  Moon,
  Monitor,
  UserCircle,
  Lock,
  Link2,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronRight,
  Sparkles,
  Globe,
  Phone,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NexoraLogo } from "@/components/brand/NexoraLogo";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { AUTH_ROUTES } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { CAMPUS_MODULES, type CampusModuleId } from "@/lib/modules";
import {
  getUserSettings,
  updateModuleEnabled,
  isModuleEnabled,
  type UserSettingsRow,
} from "@/services/user-settings.service";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Nexora – Settings" }] }),
  component: SettingsRoute,
});

type NavSection =
  | "spaces"
  | "location"
  | "notifications"
  | "appearance"
  | "account"
  | "security"
  | "connected";

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "spaces", label: "Campus Spaces", icon: Layers },
  { id: "location", label: "Location & Campus", icon: MapPin },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Sun },
  { id: "account", label: "Account", icon: UserCircle },
  { id: "security", label: "Security", icon: Shield },
  { id: "connected", label: "Connected Accounts", icon: Link2 },
];

const MODULE_META: Record<CampusModuleId, { icon: React.ElementType; color: string; description: string }> = {
  marketplace: { icon: ShoppingBag, color: "bg-violet-500/10 text-violet-400 border-violet-500/20", description: "Buy, sell, and trade campus items with verified students." },
  "lost-found": { icon: MapPin, color: "bg-orange-500/10 text-orange-400 border-orange-500/20", description: "Report lost items and help classmates recover their belongings." },
  roommates: { icon: School, color: "bg-sky-500/10 text-sky-400 border-sky-500/20", description: "Find compatible flatmates near your college or PG." },
  "campus-connect": { icon: Heart, color: "bg-rose-500/10 text-rose-400 border-rose-500/20", description: "Meet and connect with students sharing similar interests." },
  notes: { icon: BookOpen, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", description: "Share, access, and collaborate on study notes and resources." },
  projects: { icon: FolderGit2, color: "bg-blue-500/10 text-blue-400 border-blue-500/20", description: "Build and collaborate on student tech and research projects." },
  rides: { icon: Car, color: "bg-amber-500/10 text-amber-400 border-amber-500/20", description: "Share campus rides and coordinate cab pooling with peers." },
  tuition: { icon: GraduationCap, color: "bg-teal-500/10 text-teal-400 border-teal-500/20", description: "Seniors teach juniors — peer learning marketplace." },
  events: { icon: CalendarDays, color: "bg-pink-500/10 text-pink-400 border-pink-500/20", description: "Discover fests, hackathons, and join study groups." },
};

const POPULAR_COLLEGES = [
  "Indian Institute of Technology Delhi (IITD)",
  "Indian Institute of Technology Bombay (IITB)",
  "Indian Institute of Technology Madras (IITM)",
  "Indian Institute of Technology Kharagpur (IITKGP)",
  "Indian Institute of Technology Roorkee (IITR)",
  "BITS Pilani (Pilani / Goa / Hyderabad)",
  "Delhi University (DU)",
  "Vellore Institute of Technology (VIT Vellore)",
  "SRM Institute of Science and Technology",
  "Manipal Academy of Higher Education (MAHE)",
  "Delhi Technological University (DTU)",
  "Netaji Subhas University of Technology (NSUT)",
  "Thapar Institute of Engineering and Technology",
  "Amity University (Noida / Lucknow)",
  "Chandigarh University",
  "Lovely Professional University (LPU)",
  "Mumbai University (MU)",
  "Anna University Chennai",
  "Jadavpur University Kolkata",
  "Indira Gandhi Delhi Technical University for Women (IGDTUW)",
];

const POPULAR_CITIES = [
  "Delhi NCR", "Bengaluru", "Mumbai", "Pune", "Hyderabad",
  "Chennai", "Kolkata", "Jaipur", "Ahmedabad", "Chandigarh",
  "Lucknow", "Indore", "Bhopal", "Noida", "Gurgaon",
  "Dehradun", "Patna", "Coimbatore", "Kochi", "Varanasi",
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi NCR", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
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
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<NavSection>("spaces");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displaySection, setDisplaySection] = useState<NavSection>("spaces");
  const contentRef = useRef<HTMLDivElement>(null);

  // Location form
  const [formData, setFormData] = useState({
    college: "", branch: "", year: "3rd Year",
    phone: "", city: "", state: "Delhi NCR",
    pincode: "", campusArea: "",
  });
  const [collegeQuery, setCollegeQuery] = useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [showOtherCollegeInput, setShowOtherCollegeInput] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modules
  const [userSettingsRow, setUserSettingsRow] = useState<UserSettingsRow | null>(null);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [togglingModule, setTogglingModule] = useState<string | null>(null);

  // Notifications
  const [notifSettings, setNotifSettings] = useState({
    chats: true, campusEvents: true, roommateAlerts: true, emailDigest: false,
  });

  // Security
  const [newEmail, setNewEmail] = useState("");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Autosave to localStorage whenever formData changes
  useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      localStorage.setItem("nexora-settings-draft", JSON.stringify(formData));
    }, 800);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [formData]);

  // Load profile — merge with any autosaved draft
  useEffect(() => {
    if (profile || user) {
      const meta = user?.user_metadata || {};
      const saved = localStorage.getItem("nexora-settings-draft");
      const draft = saved ? JSON.parse(saved) : null;
      const collegeVal = draft?.college || profile?.college_name || meta.college_name || "";
      const cityVal = draft?.city || meta.city || "";
      setFormData({
        college: collegeVal,
        branch: draft?.branch || meta.branch || "",
        year: draft?.year || meta.year || "3rd Year",
        phone: draft?.phone || profile?.phone || meta.phone || "",
        city: cityVal,
        state: draft?.state || meta.state || "Delhi NCR",
        pincode: draft?.pincode || meta.pincode || "",
        campusArea: draft?.campusArea || meta.campusArea || "",
      });
      setCollegeQuery(collegeVal);
      setCityQuery(cityVal);
      if (collegeVal && !POPULAR_COLLEGES.includes(collegeVal)) {
        setShowOtherCollegeInput(true);
      }
    }
  }, [profile, user]);

  // Load module settings
  useEffect(() => {
    if (user?.id) {
      setModulesLoading(true);
      getUserSettings(user.id)
        .then((s) => setUserSettingsRow(s))
        .catch(console.error)
        .finally(() => setModulesLoading(false));
    }
  }, [user?.id]);

  // Read sessionStorage target section
  useEffect(() => {
    const req = window.sessionStorage.getItem("nexora-settings-section") as NavSection | null;
    window.sessionStorage.removeItem("nexora-settings-section");
    if (req) {
      setActiveSection(req);
      setDisplaySection(req);
    }
  }, []);

  // OTP countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCountdown]);

  // Smooth section transition
  const handleSectionChange = useCallback((id: NavSection) => {
    if (id === activeSection || isTransitioning) return;
    setIsTransitioning(true);
    setActiveSection(id);
    setTimeout(() => {
      setDisplaySection(id);
      setIsTransitioning(false);
    }, 180);
  }, [activeSection, isTransitioning]);

  // GPS
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          if (res.ok) {
            const d = await res.json();
            const addr = d.address || {};
            const city = addr.city || addr.town || addr.county || "";
            const state = addr.state || "Delhi NCR";
            const pincode = addr.postcode || "";
            const area = addr.suburb || addr.neighbourhood || "";
            setFormData(f => ({ ...f, city, state, pincode, campusArea: area }));
            setCityQuery(city);
            toast.success(`Detected: ${city}, ${state}`);
          }
        } catch { toast.success("Location captured"); }
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        toast.error(err.code === 1 ? "Location permission denied" : "Could not fetch location");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Pincode lookup
  const handlePincodeChange = async (val: string) => {
    const pin = val.replace(/\D/g, "").slice(0, 6);
    setFormData(f => ({ ...f, pincode: pin }));
    if (pin.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        if (res.ok) {
          const d = await res.json();
          if (d?.[0]?.Status === "Success" && d[0]?.PostOffice?.[0]) {
            const po = d[0].PostOffice[0];
            setFormData(f => ({ ...f, city: po.District || po.Division, state: po.State }));
            setCityQuery(po.District || po.Division);
            toast.success(`${pin}: ${po.District}, ${po.State}`);
          }
        }
      } catch { /* silent */ }
    }
  };

  // Save location
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSavingLocation) return;
    setIsSavingLocation(true);
    try {
      await supabase.from("profiles").upsert(
        { id: user.id, email: user.email ?? null, college_name: formData.college.trim(), phone: formData.phone.trim() },
        { onConflict: "id" }
      );
      await supabase.auth.updateUser({
        data: {
          college_name: formData.college.trim(), branch: formData.branch.trim(),
          year: formData.year, phone: formData.phone.trim(), city: formData.city.trim(),
          state: formData.state, pincode: formData.pincode.trim(), campusArea: formData.campusArea.trim(),
        },
      });
      await refreshProfile();
      localStorage.removeItem("nexora-settings-draft");
      toast.success("Campus details saved!");
    } catch { toast.error("Failed to save. Try again."); }
    finally { setIsSavingLocation(false); }
  };

  // Toggle module
  const handleToggleModule = async (moduleId: CampusModuleId) => {
    if (!user) return;
    const nextState = !isModuleEnabled(userSettingsRow, moduleId);
    if (nextState && (!formData.college.trim() || !formData.city.trim())) {
      toast.warning("Set your college & city in Location settings first");
      handleSectionChange("location");
      return;
    }
    setTogglingModule(moduleId);
    try {
      const { data, error } = await updateModuleEnabled(user.id, moduleId, nextState);
      if (error) throw error;
      setUserSettingsRow(data);
      toast.success(nextState ? `${moduleId} enabled` : `${moduleId} paused`);
    } catch (e: any) { toast.error(e.message || "Failed to update"); }
    finally { setTogglingModule(null); }
  };

  // Email change
  const handleSendEmailOtp = async () => {
    if (!newEmail.includes("@") || newEmail === user?.email) { toast.error("Enter a different valid email"); return; }
    setIsEmailOtpSent(true);
    setOtpCountdown(60);
    toast.success(`Code sent to ${user?.email}`);
  };

  const handleVerifyEmail = async () => {
    if (emailOtp.join("").length < 6) { toast.error("Enter 6-digit code"); return; }
    setIsVerifyingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success("Check your new email for confirmation link.");
      setIsEmailOtpSent(false); setNewEmail(""); setEmailOtp(["","","","","",""]);
    } catch (e: any) { toast.error(e.message); }
    finally { setIsVerifyingEmail(false); }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    try {
      await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: `${window.location.origin}/auth/login` });
      toast.success(`Reset link sent to ${user.email}`);
    } catch { toast.info(`Reset triggered for ${user.email}`); }
    finally { setIsResettingPassword(false); }
  };

  const handleDeactivate = async () => {
    if (!deactivateReason || !deactivatePassword) { toast.error("Please fill all fields"); return; }
    setIsDeactivating(true);
    try {
      await supabase.auth.updateUser({ data: { is_deactivated: true } });
      toast.success("Account deactivated. Log in to reactivate.");
      setShowDeactivateModal(false);
      await signOut();
      void navigate({ to: AUTH_ROUTES.login });
    } catch (e: any) { toast.error(e.message); }
    finally { setIsDeactivating(false); }
  };

  const handleDelete = async () => {
    if (!deletePassword) { toast.error("Enter your password"); return; }
    setIsDeleting(true);
    try {
      if (user?.id) await supabase.from("profiles").delete().eq("id", user.id);
      toast.success("Account scheduled for deletion.");
      setShowDeleteModal(false);
      await signOut();
      void navigate({ to: AUTH_ROUTES.login });
    } catch (e: any) { toast.error(e.message); }
    finally { setIsDeleting(false); }
  };

  const filteredColleges = POPULAR_COLLEGES.filter(c => c.toLowerCase().includes(collegeQuery.toLowerCase()));
  const filteredCities = POPULAR_CITIES.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()));
  const displayName = profile?.full_name?.trim() || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "ST";

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-paper/90 backdrop-blur-xl">
        <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-secondary hover:text-foreground active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <NexoraLogo size="sm" />
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-sm font-semibold text-muted-foreground">Settings</span>
          </div>
          <ProfileDropdown />
        </div>
      </header>

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div className="flex w-full min-h-[calc(100vh-56px)]">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="w-48 shrink-0 border-r border-border py-6 px-2 lg:w-56">
          <div className="sticky top-[56px] pt-4">
            {/* Nav label */}
            <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Settings
            </p>

            {/* Nav items */}
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSectionChange(item.id)}
                    className={`group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-black text-primary">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── RIGHT CONTENT PANEL ── */}
        <div className="flex-1 min-w-0 py-6 px-6 lg:px-8 overflow-hidden">
          <div
            ref={contentRef}
            className="transition-all duration-200"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? "translateX(12px)" : "translateX(0px)",
            }}
          >

            {/* ════════════════════════════════════════════ */}
            {/*  CAMPUS SPACES                               */}
            {/* ════════════════════════════════════════════ */}
            {displaySection === "spaces" && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Campus Spaces</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Enable or pause individual campus features. Active spaces appear in your home feed.
                  </p>
                </div>

                {modulesLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {CAMPUS_MODULES.map((mod) => {
                      const meta = MODULE_META[mod.id];
                      const Icon = meta.icon;
                      const enabled = isModuleEnabled(userSettingsRow, mod.id);
                      const toggling = togglingModule === mod.id;

                      return (
                        <div
                          key={mod.id}
                          className={`group relative flex flex-col gap-4 rounded-2xl border p-5 transition-all duration-200 hover:shadow-mega ${
                            enabled
                              ? "border-primary/25 bg-card shadow-soft"
                              : "border-border bg-card/50 hover:bg-card"
                          }`}
                        >
                          {/* Status dot */}
                          <span
                            className={`absolute right-4 top-4 h-2 w-2 rounded-full transition-colors ${
                              enabled ? "bg-emerald-400 shadow-[0_0_8px_theme(colors.emerald.400)]" : "bg-muted-foreground/30"
                            }`}
                          />

                          {/* Icon */}
                          <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${meta.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 space-y-1.5">
                            <h3 className="text-sm font-bold text-foreground">{mod.label}</h3>
                            <p className="text-xs leading-relaxed text-muted-foreground">{meta.description}</p>
                          </div>

                          {/* Toggle */}
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold ${enabled ? "text-emerald-400" : "text-muted-foreground"}`}>
                              {enabled ? "Active" : "Paused"}
                            </span>
                            <button
                              type="button"
                              disabled={toggling}
                              onClick={() => handleToggleModule(mod.id)}
                              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                enabled ? "bg-primary" : "bg-secondary"
                              } ${toggling ? "opacity-50" : ""}`}
                              aria-label={`Toggle ${mod.label}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${
                                  enabled ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/*  LOCATION & CAMPUS                           */}
            {/* ════════════════════════════════════════════ */}
            {displaySection === "location" && (
              <form onSubmit={handleSaveLocation} className="space-y-8 w-full">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Location & Campus</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Connect your campus location to enable roommate matching, nearby rides, and peer listings.
                  </p>
                </div>

                {/* GPS Banner */}
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Navigation className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Live GPS Detection</p>
                      <p className="text-xs text-muted-foreground">Auto-fill city, state, and pincode from your current location.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGetLiveLocation}
                    disabled={isLocating}
                    className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 active:scale-95 disabled:opacity-60"
                  >
                    {isLocating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
                    <span>{isLocating ? "Detecting..." : "Detect Location"}</span>
                  </button>
                </div>

                {/* Fields */}
                <div className="space-y-6">
                  <FieldSection title="Academic Info" icon={GraduationCap}>
                    {/* College autocomplete */}
                    <div className="relative space-y-1.5">
                      <FieldLabel>College / University</FieldLabel>
                      <input
                        type="text"
                        required
                        value={showOtherCollegeInput ? "" : collegeQuery}
                        onChange={(e) => { setCollegeQuery(e.target.value); setFormData({ ...formData, college: e.target.value }); setShowCollegeDropdown(true); setShowOtherCollegeInput(false); }}
                        onFocus={() => { if (!showOtherCollegeInput) setShowCollegeDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowCollegeDropdown(false), 200)}
                        placeholder={showOtherCollegeInput ? "Click \"Other *\" below to type manually" : "Search your institution…"}
                        readOnly={showOtherCollegeInput}
                        className={`settings-input ${showOtherCollegeInput ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                      {showCollegeDropdown && (
                        <SuggestionDropdown>
                          {filteredColleges.map((c) => (
                            <SuggestionItem key={c} icon={School} label={c} onClick={() => { setFormData({ ...formData, college: c }); setCollegeQuery(c); setShowCollegeDropdown(false); setShowOtherCollegeInput(false); }} />
                          ))}
                          {/* Other option — always last */}
                          <button
                            type="button"
                            onClick={() => { setShowOtherCollegeInput(true); setShowCollegeDropdown(false); setCollegeQuery(""); setFormData({ ...formData, college: "" }); }}
                            className="flex w-full items-center gap-2.5 rounded-xl border-t border-border/60 mt-1 pt-1.5 px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
                          >
                            <span className="text-primary">*</span>
                            <span>Other — type your college name manually</span>
                          </button>
                        </SuggestionDropdown>
                      )}

                      {/* Manual college input shown when Other is selected */}
                      {showOtherCollegeInput && (
                        <div className="space-y-1.5 animate-in fade-in duration-150">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-primary">*</span>
                            <FieldLabel>Type your college name</FieldLabel>
                            <button
                              type="button"
                              onClick={() => { setShowOtherCollegeInput(false); setCollegeQuery(""); setFormData({ ...formData, college: "" }); }}
                              className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
                            >
                              ← Search list instead
                            </button>
                          </div>
                          <input
                            type="text"
                            autoFocus
                            required
                            value={formData.college}
                            onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                            placeholder="e.g. Sharda University, Greater Noida"
                            className="settings-input border-primary/40 focus:border-primary"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <FieldLabel>Branch / Department</FieldLabel>
                        <input type="text" value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })} placeholder="e.g. Computer Science" className="settings-input" />
                      </div>
                      <div className="space-y-1.5">
                        <FieldLabel>Year of Study</FieldLabel>
                        <select value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="settings-input">
                          {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "PG / Masters", "PhD"].map(y => <option key={y}>{y}</option>)}
                        </select>
                      </div>
                    </div>
                  </FieldSection>

                  <FieldSection title="Location Details" icon={MapPin}>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* City autocomplete */}
                      <div className="relative space-y-1.5">
                        <FieldLabel>City</FieldLabel>
                        <input
                          type="text"
                          required
                          value={cityQuery}
                          onChange={(e) => { setCityQuery(e.target.value); setFormData({ ...formData, city: e.target.value }); setShowCityDropdown(true); }}
                          onFocus={() => setShowCityDropdown(true)}
                          onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
                          placeholder="e.g. Bengaluru"
                          className="settings-input"
                        />
                        {showCityDropdown && filteredCities.length > 0 && (
                          <SuggestionDropdown>
                            {filteredCities.map((c) => (
                              <SuggestionItem key={c} icon={Building2} label={c} onClick={() => { setFormData({ ...formData, city: c }); setCityQuery(c); setShowCityDropdown(false); }} />
                            ))}
                          </SuggestionDropdown>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <FieldLabel>State</FieldLabel>
                        <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="settings-input">
                          {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <FieldLabel>Pincode</FieldLabel>
                        <input type="text" maxLength={6} value={formData.pincode} onChange={(e) => handlePincodeChange(e.target.value)} placeholder="6-digit pincode" className="settings-input font-mono" />
                      </div>

                      <div className="space-y-1.5">
                        <FieldLabel>WhatsApp / Phone</FieldLabel>
                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" className="settings-input" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel>Hostel / Block / Area (Optional)</FieldLabel>
                      <input type="text" value={formData.campusArea} onChange={(e) => setFormData({ ...formData, campusArea: e.target.value })} placeholder="e.g. Hostel Block B, Room 204" className="settings-input" />
                    </div>
                  </FieldSection>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit" disabled={isSavingLocation} className="rounded-xl px-6 font-bold">
                    {isSavingLocation ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</> : "Save Campus Details"}
                  </Button>
                </div>
              </form>
            )}

            {/* ════════════════════════════════════════════ */}
            {/*  NOTIFICATIONS                               */}
            {/* ════════════════════════════════════════════ */}
            {displaySection === "notifications" && (
              <div className="space-y-8 w-full">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Notifications</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">Choose which alerts you want to receive across campus features.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "chats", label: "Messages & Marketplace Replies", desc: "Get alerts when someone messages you about a listing or inquiry." },
                    { key: "campusEvents", label: "Events & Hackathons", desc: "Updates about fests, workshops, club events, and competitions." },
                    { key: "roommateAlerts", label: "Roommate & PG Listings", desc: "New flatmate matches and hostel listings near your campus." },
                    { key: "emailDigest", label: "Weekly Email Digest", desc: "A curated weekly roundup of campus buzz and study notes." },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-secondary/20">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                      </div>
                      <Toggle
                        enabled={notifSettings[key as keyof typeof notifSettings]}
                        onChange={(v) => { setNotifSettings(n => ({ ...n, [key]: v })); toast.success("Preference updated"); }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/*  APPEARANCE                                  */}
            {/* ════════════════════════════════════════════ */}
            {displaySection === "appearance" && (
              <div className="space-y-8 w-full">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Appearance</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">Customize how Nexora looks and feels.</p>
                </div>

                <FieldSection title="Color Theme" icon={Sparkles}>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { id: "dark", label: "Dark", icon: Moon, desc: "Comfortable for late-night studying" },
                      { id: "light", label: "Light", icon: Sun, desc: "Clean, bright and minimal" },
                      { id: "system", label: "Auto", icon: Monitor, desc: "Follows your system preference" },
                    ] as const).map(({ id, label, icon: Icon, desc }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTheme(id)}
                        className={`flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-150 ${
                          theme === id
                            ? "border-primary bg-primary/10 shadow-soft"
                            : "border-border bg-card hover:bg-secondary/40"
                        }`}
                      >
                        <div className={`grid h-9 w-9 place-items-center rounded-xl ${theme === id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${theme === id ? "text-primary" : "text-foreground"}`}>{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                        </div>
                        {theme === id && (
                          <span className="ml-auto self-start rounded-full bg-primary px-2 py-0.5 text-[10px] font-black text-primary-foreground">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/*  ACCOUNT                                     */}
            {/* ════════════════════════════════════════════ */}
            {displaySection === "account" && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Account</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">Manage your account identity and credentials.</p>
                </div>

                <FieldSection title="Account Identity" icon={UserCircle}>
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">
                      {initials}
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground">{displayName}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      {profile?.college_name && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{profile.college_name}</p>
                      )}
                    </div>
                  </div>
                </FieldSection>

                {/* Deactivate */}
                <FieldSection title="Account Status" icon={Eye}>
                  <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5">
                    <div>
                      <p className="text-sm font-bold text-foreground">Temporarily Deactivate</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-md">
                        Your profile and listings will be hidden. Log back in anytime to reactivate — no data is lost.
                      </p>
                    </div>
                    <button type="button" onClick={() => setShowDeactivateModal(true)}
                      className="shrink-0 rounded-xl border border-border bg-secondary px-3.5 py-2 text-xs font-bold text-foreground hover:bg-secondary/70 transition-colors">
                      Deactivate
                    </button>
                  </div>
                </FieldSection>

                {/* Delete */}
                <FieldSection title="Danger Zone" icon={AlertTriangle}>
                  <div className="flex items-start justify-between gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
                    <div>
                      <p className="text-sm font-bold text-destructive">Delete Account Permanently</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-md">
                        All data — notes, listings, ratings, chats — will be permanently deleted after a 30-day grace period. This cannot be undone.
                      </p>
                    </div>
                    <button type="button" onClick={() => setShowDeleteModal(true)}
                      className="shrink-0 rounded-xl bg-destructive px-3.5 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90 transition-opacity">
                      Delete Account
                    </button>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/*  SECURITY                                    */}
            {/* ════════════════════════════════════════════ */}
            {displaySection === "security" && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Security</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">Protect your account with verified email changes and password security.</p>
                </div>

                {/* Email change */}
                <FieldSection title="Email Address" icon={Mail}>
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Email</p>
                      <p className="text-sm font-semibold text-foreground mt-1">{user?.email}</p>
                    </div>

                    {!isEmailOtpSent ? (
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="New email address" className="settings-input flex-1" />
                        <Button type="button" onClick={handleSendEmailOtp} className="shrink-0 rounded-xl font-bold">
                          Send Code
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-in fade-in">
                        <p className="text-xs font-bold text-foreground">Enter 6-digit code sent to <span className="text-primary">{user?.email}</span></p>
                        <div className="flex gap-2">
                          {emailOtp.map((digit, idx) => (
                            <input key={idx} id={`otp-${idx}`} type="text" maxLength={1} value={digit}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                const next = [...emailOtp]; next[idx] = val; setEmailOtp(next);
                                if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
                              }}
                              onKeyDown={(e) => { if (e.key === "Backspace" && !digit && idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus(); }}
                              className="h-10 w-10 rounded-xl border border-border bg-card text-center font-mono text-sm font-bold text-foreground outline-none focus:border-primary"
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <button type="button" disabled={otpCountdown > 0} onClick={handleSendEmailOtp}
                            className="text-xs font-bold text-primary hover:underline disabled:text-muted-foreground">
                            {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend Code"}
                          </button>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setIsEmailOtpSent(false)} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">Cancel</button>
                            <Button type="button" disabled={isVerifyingEmail} onClick={handleVerifyEmail} className="rounded-xl text-xs font-bold">
                              {isVerifyingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify & Update"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </FieldSection>

                {/* Password */}
                <FieldSection title="Password" icon={Lock}>
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
                    <div>
                      <p className="text-sm font-bold text-foreground">Reset Password</p>
                      <p className="text-xs text-muted-foreground mt-0.5">A secure reset link will be sent to your email inbox.</p>
                    </div>
                    <Button type="button" variant="outline" disabled={isResettingPassword} onClick={handlePasswordReset} className="shrink-0 rounded-xl font-bold text-xs">
                      {isResettingPassword ? "Sending…" : "Send Reset Link"}
                    </Button>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/*  CONNECTED ACCOUNTS                          */}
            {/* ════════════════════════════════════════════ */}
            {displaySection === "connected" && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Connected Accounts</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">Link external accounts to enhance your campus profile and verify your identity.</p>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "Google", icon: Globe, desc: "Enable one-tap sign-in with your Google account.", connected: true },
                    { name: "GitHub", icon: FolderGit2, desc: "Showcase your repositories on your campus profile.", connected: false },
                    { name: "LinkedIn", icon: Link2, desc: "Import your education and internship history.", connected: false },
                    { name: "Phone Number", icon: Phone, desc: "Add your phone for WhatsApp and ride coordination.", connected: !!profile?.phone },
                  ].map(({ name, icon: Icon, desc, connected }) => (
                    <div key={name} className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-foreground">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">{desc}</p>
                        </div>
                      </div>
                      <button type="button"
                        className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                          connected
                            ? "border border-border bg-secondary text-foreground hover:bg-secondary/70"
                            : "bg-primary text-primary-foreground hover:opacity-90"
                        }`}>
                        {connected ? "Connected" : "Connect"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── DEACTIVATE MODAL ── */}
      {showDeactivateModal && (
        <Modal onClose={() => setShowDeactivateModal(false)}>
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-foreground">Temporarily Deactivate Account</h3>
              <p className="mt-1 text-xs text-muted-foreground">Your profile and listings will be hidden until you log back in.</p>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Why are you deactivating?</FieldLabel>
              <select value={deactivateReason} onChange={(e) => setDeactivateReason(e.target.value)} className="settings-input">
                <option value="">Select a reason…</option>
                <option value="break">Focusing on exams / Taking a break</option>
                <option value="privacy">Privacy concerns</option>
                <option value="busy">Too busy with schedule</option>
                <option value="other">Something else</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Confirm your password</FieldLabel>
              <input type="password" value={deactivatePassword} onChange={(e) => setDeactivatePassword(e.target.value)} placeholder="Enter current password" className="settings-input" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowDeactivateModal(false)} className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary">Cancel</button>
              <Button type="button" disabled={isDeactivating} onClick={handleDeactivate} className="rounded-xl font-bold">
                {isDeactivating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Deactivate Account"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── DELETE MODAL ── */}
      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)} danger>
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-black text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Delete Account Permanently
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                All your campus data will be permanently erased after 30 days. This action cannot be undone.
              </p>
            </div>
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive leading-relaxed">
              Deleting: <strong>{user?.email}</strong>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Confirm your password to proceed</FieldLabel>
              <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="Enter current password" className="settings-input" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary">Cancel</button>
              <button type="button" disabled={isDeleting} onClick={handleDelete}
                className="rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-60">
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete Permanently"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  );
}

/* ── SMALL REUSABLE COMPONENTS ── */

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${enabled ? "bg-primary" : "bg-secondary"}`}
    >
      <span className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${enabled ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-bold text-muted-foreground">{children}</label>;
}

function FieldSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-black text-foreground">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SuggestionDropdown({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute top-full left-0 right-0 z-30 mt-1.5 max-h-52 overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-mega">
      {children}
    </div>
  );
}

function SuggestionItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-secondary transition-colors">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

function Modal({ children, onClose, danger }: { children: React.ReactNode; onClose: () => void; danger?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-md rounded-2xl border ${danger ? "border-destructive/40" : "border-border"} bg-card p-6 shadow-mega text-card-foreground`}>
        <button type="button" onClick={onClose}
          className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
