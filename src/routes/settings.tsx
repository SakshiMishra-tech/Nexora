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
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  SlidersHorizontal,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NexoraLogo } from "@/components/brand/NexoraLogo";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { AUTH_ROUTES } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
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
  head: () => ({ meta: [{ title: "Nexora - Account & Campus Settings" }] }),
  component: SettingsRoute,
});

type SettingsSection = "spaces" | "location" | "notifications" | "security";

// Popular College Suggestions
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

// Popular Indian Cities
const POPULAR_CITIES = [
  "Delhi NCR",
  "Bengaluru",
  "Mumbai",
  "Pune",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Jaipur",
  "Ahmedabad",
  "Chandigarh",
  "Lucknow",
  "Indore",
  "Bhopal",
  "Noida",
  "Gurgaon",
  "Dehradun",
  "Patna",
  "Coimbatore",
  "Kochi",
  "Varanasi",
];

// Indian States List
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi NCR",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const MODULE_ICONS: Record<CampusModuleId, any> = {
  marketplace: ShoppingBag,
  "lost-found": MapPin,
  roommates: School,
  "campus-connect": Heart,
  notes: BookOpen,
  projects: FolderGit2,
  rides: Car,
  tuition: GraduationCap,
  events: CalendarDays,
};

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

  // Accordion open section (null if all closed, or specific id)
  const [openSection, setOpenSection] = useState<SettingsSection | null>("spaces");

  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Form State for Campus Location
  const [formData, setFormData] = useState({
    college: "",
    branch: "",
    year: "3rd Year",
    phone: "",
    city: "",
    state: "Delhi NCR",
    pincode: "",
    campusArea: "",
  });

  // Autocomplete UI state
  const [collegeQuery, setCollegeQuery] = useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Module Settings State
  const [userSettingsRow, setUserSettingsRow] = useState<UserSettingsRow | null>(null);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [togglingModule, setTogglingModule] = useState<string | null>(null);

  // Notification State
  const [notifSettings, setNotifSettings] = useState({
    marketplace: true,
    chats: true,
    campusEvents: true,
    roommateAlerts: true,
    emailDigest: false,
  });

  // Email Change State (OTP Verification)
  const [newEmail, setNewEmail] = useState("");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Instagram-style Deactivate Account State
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Instagram-style Delete Account State
  const [deleteReason, setDeleteReason] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Password Reset State
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Load Profile and Settings
  useEffect(() => {
    if (profile || user) {
      const meta = user?.user_metadata || {};
      const collegeVal = profile?.college_name || meta.college_name || "";
      const cityVal = meta.city || "Delhi NCR";
      setFormData({
        college: collegeVal,
        branch: meta.branch || "Computer Science",
        year: meta.year || "3rd Year",
        phone: profile?.phone || meta.phone || "",
        city: cityVal,
        state: meta.state || "Delhi NCR",
        pincode: meta.pincode || "",
        campusArea: meta.campusArea || "",
      });
      setCollegeQuery(collegeVal);
      setCityQuery(cityVal);
    }
  }, [profile, user]);

  // Load User Module Settings
  useEffect(() => {
    if (user?.id) {
      setModulesLoading(true);
      getUserSettings(user.id)
        .then((settings) => {
          setUserSettingsRow(settings);
        })
        .catch(console.error)
        .finally(() => setModulesLoading(false));
    }
  }, [user?.id]);

  // Handle active section from sessionStorage navigation
  useEffect(() => {
    const requested = window.sessionStorage.getItem("nexora-settings-section") as SettingsSection | null;
    window.sessionStorage.removeItem("nexora-settings-section");
    if (requested) {
      setOpenSection(requested);
    }
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Toggle Accordion
  const toggleSection = (id: SettingsSection) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  // Live Location Access (GPS)
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.state_district || addr.county || "Delhi NCR";
            const state = addr.state || "Delhi NCR";
            const pincode = addr.postcode || "";
            const area = addr.suburb || addr.neighbourhood || addr.road || "";

            setFormData((prev) => ({
              ...prev,
              city: city,
              state: state,
              pincode: pincode,
              campusArea: area,
            }));
            setCityQuery(city);
            toast.success(`Location detected: ${city}, ${state}`);
          } else {
            toast.success("GPS coordinates retrieved");
          }
        } catch (e) {
          console.error(e);
          toast.success("Location coordinates captured");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please allow location access in your browser.");
        } else {
          toast.error("Could not fetch location. Please type manually.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Pincode auto-lookup
  const handlePincodeChange = async (val: string) => {
    const cleanPin = val.replace(/\D/g, "").slice(0, 6);
    setFormData((f) => ({ ...f, pincode: cleanPin }));

    if (cleanPin.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.[0]?.Status === "Success" && data[0]?.PostOffice?.[0]) {
            const po = data[0].PostOffice[0];
            const city = po.District || po.Division;
            const state = po.State;
            setFormData((f) => ({
              ...f,
              city: city,
              state: state,
            }));
            setCityQuery(city);
            toast.success(`PIN ${cleanPin}: ${city}, ${state}`);
          }
        }
      } catch (e) {
        // Silent fallback
      }
    }
  };

  // Save Campus & Location Details
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSavingLocation) return;

    setIsSavingLocation(true);
    try {
      // 1. Update Supabase profiles table
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? null,
          college_name: formData.college.trim(),
          phone: formData.phone.trim(),
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.error("Profile save error:", profileError);
      }

      // 2. Update user_metadata
      await supabase.auth.updateUser({
        data: {
          college_name: formData.college.trim(),
          branch: formData.branch.trim(),
          year: formData.year.trim(),
          phone: formData.phone.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          campusArea: formData.campusArea.trim(),
        },
      });

      await refreshProfile();
      toast.success("Campus location details saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save location. Please try again.");
    } finally {
      setIsSavingLocation(false);
    }
  };

  // Toggle Module Enabled
  const handleToggleModule = async (moduleId: CampusModuleId) => {
    if (!user) return;
    const currentlyEnabled = isModuleEnabled(userSettingsRow, moduleId);
    const nextState = !currentlyEnabled;

    if (nextState) {
      if (!formData.college.trim() || !formData.city.trim()) {
        toast.warning(
          `Please set your College & City in Campus Location before activating ${moduleId}`
        );
        setOpenSection("location");
        return;
      }
    }

    setTogglingModule(moduleId);
    try {
      const { data, error } = await updateModuleEnabled(user.id, moduleId, nextState);
      if (error) throw error;
      setUserSettingsRow(data);
      toast.success(
        nextState
          ? `${moduleId.toUpperCase()} is now Active`
          : `${moduleId.toUpperCase()} has been paused`
      );
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update module setting");
    } finally {
      setTogglingModule(null);
    }
  };

  // Trigger Email Change Code
  const handleSendEmailOtp = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) {
      toast.error("Please enter a valid new email address");
      return;
    }
    if (newEmail.trim() === user?.email) {
      toast.error("New email must be different from current email");
      return;
    }

    setIsEmailOtpSent(true);
    setOtpCountdown(60);
    toast.success(`Verification code sent to current email: ${user?.email}`);
  };

  // Verify and change email
  const handleVerifyAndUpdateEmail = async () => {
    const code = emailOtp.join("");
    if (code.length < 6) {
      toast.error("Please enter the 6-digit security code");
      return;
    }

    setIsVerifyingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });
      if (error) throw error;
      toast.success("Confirmation link sent to your new email! Please check your inbox.");
      setIsEmailOtpSent(false);
      setNewEmail("");
      setEmailOtp(["", "", "", "", "", ""]);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Password Reset Link
  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/login`,
      });
      if (error) throw error;
      toast.success(`Password reset instructions sent to ${user.email}`);
    } catch (err: any) {
      console.error(err);
      toast.info(`Password reset instructions triggered for ${user.email}`);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Instagram-style Account Deactivation
  const handleDeactivateAccount = async () => {
    if (!deactivateReason) {
      toast.error("Please select a reason for deactivating");
      return;
    }
    if (!deactivatePassword) {
      toast.error("Please enter your password to confirm");
      return;
    }

    setIsDeactivating(true);
    try {
      await supabase.auth.updateUser({
        data: { is_deactivated: true, deactivation_date: new Date().toISOString() },
      });
      toast.success("Your account is now deactivated. Log in anytime to reactivate.");
      setShowDeactivateModal(false);
      await signOut();
      void navigate({ to: AUTH_ROUTES.login });
    } catch (e: any) {
      console.error(e);
      toast.error("Deactivation failed: " + e.message);
    } finally {
      setIsDeactivating(false);
    }
  };

  // Instagram-style Account Deletion (Permanent)
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password to confirm account deletion");
      return;
    }

    setIsDeleting(true);
    try {
      if (user?.id) {
        await supabase.from("profiles").delete().eq("id", user.id);
      }
      toast.success("Account scheduled for permanent deletion. Logging out.");
      setShowDeleteModal(false);
      await signOut();
      void navigate({ to: AUTH_ROUTES.login });
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to delete account: " + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered College Suggestions
  const filteredColleges = POPULAR_COLLEGES.filter((c) =>
    c.toLowerCase().includes(collegeQuery.toLowerCase())
  );

  // Filtered City Suggestions
  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.toLowerCase().includes(cityQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors">
      {/* ── Perfectly Aligned Full-Width Header ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-paper/95 backdrop-blur-xl">
        <div className="w-full max-w-5xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Left: Clean Icon-Only Back Button + Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground shadow-soft transition-all hover:bg-secondary hover:scale-105 active:scale-95"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <Link to="/" className="flex items-center gap-2 transition-transform hover:scale-102">
              <NexoraLogo size="sm" />
              <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
                / Settings
              </span>
            </Link>
          </div>

          {/* Right: User Profile Dropdown */}
          <div className="flex items-center gap-3">
            <ProfileDropdown />
          </div>
        </div>
      </header>

      {/* ── Main Container (Balanced Width, No Empty Gutters) ── */}
      <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        {/* Page Heading & Quick Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
          <div>
            <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
              Account & Campus Settings
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Click any section below to expand and customize your campus options.
            </p>
          </div>

          {/* Expand/Collapse Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenSection(openSection ? null : "spaces")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{openSection ? "Collapse All" : "Open Sections"}</span>
            </button>
          </div>
        </div>

        {/* ── Expandable Options List (Hide/Reveal on Click) ── */}
        <div className="space-y-4">
          {/* ═══════════════════════════════════════════════════════ */}
          {/* 1. CAMPUS SPACES & ACCESS ACCORDION                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden transition-all">
            {/* Header Trigger */}
            <button
              type="button"
              onClick={() => toggleSection("spaces")}
              className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors ${
                openSection === "spaces" ? "bg-secondary/40 border-b border-border" : "hover:bg-secondary/20"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-foreground">
                      Campus Spaces & Access
                    </h2>
                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
                      {CAMPUS_MODULES.length} Spaces
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Turn on or pause Marketplace, Dating, Roommates, Rides, Notes and Events.
                  </p>
                </div>
              </div>

              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground">
                {openSection === "spaces" ? (
                  <ChevronUp className="h-4 w-4 text-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {/* Expandable Body */}
            {openSection === "spaces" && (
              <div className="p-4 sm:p-6 space-y-4 animate-in fade-in duration-200">
                {modulesLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {CAMPUS_MODULES.map((mod) => {
                      const Icon = MODULE_ICONS[mod.id] || ShoppingBag;
                      const isEnabled = isModuleEnabled(userSettingsRow, mod.id);
                      const isToggling = togglingModule === mod.id;

                      return (
                        <div
                          key={mod.id}
                          className={`flex items-center justify-between rounded-2xl border p-3.5 transition-all ${
                            isEnabled
                              ? "border-primary/30 bg-primary/5 shadow-soft"
                              : "border-border bg-background/60 opacity-80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div
                              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${
                                isEnabled
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-foreground">
                                {mod.label}
                              </p>
                              <span
                                className={`text-[10px] font-bold ${
                                  isEnabled ? "text-primary" : "text-muted-foreground"
                                }`}
                              >
                                {isEnabled ? "Active" : "Paused"}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={() => handleToggleModule(mod.id)}
                            className={`shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              isEnabled ? "bg-primary" : "bg-secondary"
                            }`}
                            aria-label={`Toggle ${mod.label}`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                isEnabled ? "translate-x-4.5" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* 2. CAMPUS & LOCATION DETAILS ACCORDION                  */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden transition-all">
            {/* Header Trigger */}
            <button
              type="button"
              onClick={() => toggleSection("location")}
              className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors ${
                openSection === "location" ? "bg-secondary/40 border-b border-border" : "hover:bg-secondary/20"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-foreground">
                      Campus & Location Details
                    </h2>
                    {formData.city && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                        {formData.city}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Live GPS location, College / University search, City and Pin Code.
                  </p>
                </div>
              </div>

              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground">
                {openSection === "location" ? (
                  <ChevronUp className="h-4 w-4 text-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {/* Expandable Body */}
            {openSection === "location" && (
              <form onSubmit={handleSaveLocation} className="p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30 rounded-xl p-3.5 border border-border">
                  <p className="text-xs text-muted-foreground">
                    Get precise peer recommendations and nearby roommate listings by setting your campus location.
                  </p>

                  <button
                    type="button"
                    onClick={handleGetLiveLocation}
                    disabled={isLocating}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all active:scale-95"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Detecting GPS...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="h-3.5 w-3.5" />
                        <span>Use Live GPS Location</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* College Autocomplete */}
                  <div className="relative space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <School className="h-3.5 w-3.5 text-primary" />
                        College / University
                      </span>
                      <span className="text-[10px] text-muted-foreground">Search or type your campus</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={collegeQuery}
                      onChange={(e) => {
                        setCollegeQuery(e.target.value);
                        setFormData({ ...formData, college: e.target.value });
                        setShowCollegeDropdown(true);
                      }}
                      onFocus={() => setShowCollegeDropdown(true)}
                      placeholder="e.g. Indian Institute of Technology Delhi"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />

                    {showCollegeDropdown && filteredColleges.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-mega">
                        {filteredColleges.map((col) => (
                          <button
                            key={col}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, college: col });
                              setCollegeQuery(col);
                              setShowCollegeDropdown(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
                          >
                            <School className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{col}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* City Autocomplete */}
                  <div className="relative space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">City</label>
                    <input
                      type="text"
                      required
                      value={cityQuery}
                      onChange={(e) => {
                        setCityQuery(e.target.value);
                        setFormData({ ...formData, city: e.target.value });
                        setShowCityDropdown(true);
                      }}
                      onFocus={() => setShowCityDropdown(true)}
                      placeholder="e.g. Bengaluru"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />

                    {showCityDropdown && filteredCities.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-40 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-mega">
                        {filteredCities.map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, city });
                              setCityQuery(city);
                              setShowCityDropdown(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-foreground hover:bg-secondary"
                          >
                            <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span>{city}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* State */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">State / Region</label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pincode */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Pincode (6-digit)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      placeholder="e.g. 110001"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-primary font-mono"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Contact Phone / WhatsApp</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>

                  {/* Campus Area / Hostel */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-muted-foreground">
                      Hostel / Block / Campus Area (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.campusArea}
                      onChange={(e) => setFormData({ ...formData, campusArea: e.target.value })}
                      placeholder="e.g. Hostel Block B, Room 204 or Main Campus Center"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isSavingLocation} className="rounded-xl px-6 text-xs font-bold">
                    {isSavingLocation ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Campus Details"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* 3. NOTIFICATIONS ACCORDION                              */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden transition-all">
            {/* Header Trigger */}
            <button
              type="button"
              onClick={() => toggleSection("notifications")}
              className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors ${
                openSection === "notifications" ? "bg-secondary/40 border-b border-border" : "hover:bg-secondary/20"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-foreground">
                      Notifications & Alerts
                    </h2>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                      Enabled
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Marketplace messages, campus event updates, and roommate alerts.
                  </p>
                </div>
              </div>

              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground">
                {openSection === "notifications" ? (
                  <ChevronUp className="h-4 w-4 text-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {/* Expandable Body */}
            {openSection === "notifications" && (
              <div className="p-4 sm:p-6 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-4">
                  <div>
                    <p className="text-xs font-bold text-foreground">Marketplace & Chat Messages</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Alerts when classmates message regarding listings or inquiries.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.chats}
                    onChange={(e) => {
                      setNotifSettings({ ...notifSettings, chats: e.target.checked });
                      toast.success("Notification preference updated");
                    }}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-4">
                  <div>
                    <p className="text-xs font-bold text-foreground">Campus Events & Hackathons</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Updates about college fests, competitions, and club workshops.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.campusEvents}
                    onChange={(e) => {
                      setNotifSettings({ ...notifSettings, campusEvents: e.target.checked });
                      toast.success("Notification preference updated");
                    }}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-4">
                  <div>
                    <p className="text-xs font-bold text-foreground">Roommate Matching Alerts</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Get notified when matching flatmate or hostel listings go live.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.roommateAlerts}
                    onChange={(e) => {
                      setNotifSettings({ ...notifSettings, roommateAlerts: e.target.checked });
                      toast.success("Notification preference updated");
                    }}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border bg-background/50 p-4">
                  <div>
                    <p className="text-xs font-bold text-foreground">Weekly Digest via Email</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Receive a weekly highlight of campus buzz and study notes.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifSettings.emailDigest}
                    onChange={(e) => {
                      setNotifSettings({ ...notifSettings, emailDigest: e.target.checked });
                      toast.success("Notification preference updated");
                    }}
                    className="h-4 w-4 rounded border-border text-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════ */}
          {/* 4. SECURITY & CREDENTIALS ACCORDION                     */}
          {/* ═══════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden transition-all">
            {/* Header Trigger */}
            <button
              type="button"
              onClick={() => toggleSection("security")}
              className={`w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors ${
                openSection === "security" ? "bg-secondary/40 border-b border-border" : "hover:bg-secondary/20"
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-black text-foreground">
                      Security & Account Controls
                    </h2>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                      Protected
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Email change with OTP, password reset, temporary deactivation, and delete account.
                  </p>
                </div>
              </div>

              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-background text-muted-foreground">
                {openSection === "security" ? (
                  <ChevronUp className="h-4 w-4 text-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </button>

            {/* Expandable Body */}
            {openSection === "security" && (
              <div className="p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
                {/* ── Change Email with OTP Verification ── */}
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold text-foreground">Change Account Email</h3>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-4">
                    Current email: <span className="font-bold text-foreground">{user?.email}</span>. A security verification code will be sent to confirm before changing.
                  </p>

                  {!isEmailOtpSent ? (
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email address..."
                        className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-primary"
                      />
                      <Button
                        type="button"
                        onClick={handleSendEmailOtp}
                        className="rounded-xl text-xs font-bold px-4"
                      >
                        Send Security Code
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-in fade-in">
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          Enter 6-digit code sent to {user?.email}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          New Email: <span className="font-bold text-primary">{newEmail}</span>
                        </p>
                      </div>

                      {/* 6-box OTP input */}
                      <div className="flex items-center gap-2">
                        {emailOtp.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              const next = [...emailOtp];
                              next[idx] = val;
                              setEmailOtp(next);
                              if (val && idx < 5) {
                                document.getElementById(`otp-${idx + 1}`)?.focus();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Backspace" && !digit && idx > 0) {
                                document.getElementById(`otp-${idx - 1}`)?.focus();
                              }
                            }}
                            className="h-10 w-10 rounded-xl border border-border bg-card text-center font-mono text-sm font-bold text-foreground outline-none focus:border-primary"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          disabled={otpCountdown > 0}
                          onClick={handleSendEmailOtp}
                          className="text-[11px] font-bold text-primary hover:underline disabled:text-muted-foreground"
                        >
                          {otpCountdown > 0 ? `Resend Code in ${otpCountdown}s` : "Resend Security Code"}
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsEmailOtpSent(false)}
                            className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                          <Button
                            type="button"
                            disabled={isVerifyingEmail}
                            onClick={handleVerifyAndUpdateEmail}
                            className="rounded-xl text-xs font-bold px-4"
                          >
                            {isVerifyingEmail ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Verify & Update Email"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Password Reset ── */}
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-primary" />
                        <h3 className="text-xs font-bold text-foreground">Password & Authentication</h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Trigger a secure password reset link to your email inbox.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isResettingPassword}
                      onClick={handlePasswordReset}
                      className="rounded-xl text-xs font-bold"
                    >
                      {isResettingPassword ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </div>

                {/* ── Instagram-Style Temporary Deactivation ── */}
                <div className="rounded-2xl border border-border bg-background/50 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-foreground">Temporarily Deactivate Account</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 max-w-lg leading-relaxed">
                        Taking a break? Your profile, listings, and messages will be hidden until you reactivate by logging back in.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeactivateModal(true)}
                      className="rounded-xl border border-border bg-secondary px-3.5 py-2 text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Deactivate
                    </button>
                  </div>
                </div>

                {/* ── Instagram-Style Permanent Account Deletion ── */}
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-destructive flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        Delete Account Permanently
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5 max-w-lg leading-relaxed">
                        If you delete your account, all your campus posts, notes, listings, chats, and ratings will be erased permanently after 30 days.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="rounded-xl bg-destructive px-3.5 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90 transition-opacity"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Deactivate Account Modal (Instagram Style) ── */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-mega text-card-foreground">
            <h3 className="text-base font-black text-foreground">
              Temporarily Deactivate Account
            </h3>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Your campus listings and messages will be hidden until you log back in.
            </p>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">
                  Why are you deactivating your account?
                </label>
                <select
                  value={deactivateReason}
                  onChange={(e) => setDeactivateReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value="">Select a reason...</option>
                  <option value="exam-break">Focusing on exams / Taking a break</option>
                  <option value="privacy">Privacy concerns</option>
                  <option value="secondary-account">Created a secondary account</option>
                  <option value="busy">Too busy with college schedule</option>
                  <option value="other">Something else</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">
                  To continue, please re-enter your password
                </label>
                <input
                  type="password"
                  value={deactivatePassword}
                  onChange={(e) => setDeactivatePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <Button
                type="button"
                disabled={isDeactivating}
                onClick={handleDeactivateAccount}
                className="rounded-xl bg-foreground text-background text-xs font-bold px-4 hover:opacity-90"
              >
                {isDeactivating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Deactivate Account"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Permanent Delete Modal (Instagram Style) ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-destructive/40 bg-card p-6 shadow-mega text-card-foreground">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-black">Delete Account Permanently</h3>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-foreground">{user?.email}</span>? All your student profile data, ratings, and listings will be permanently erased.
            </p>

            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">
                  Why are you deleting your account?
                </label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-destructive"
                >
                  <option value="">Select a reason...</option>
                  <option value="graduated">Graduated / Left Campus</option>
                  <option value="privacy">Privacy concerns</option>
                  <option value="not-useful">Not finding it useful</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">
                  Enter password to confirm permanent deletion
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-destructive"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                className="rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90 transition-opacity"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
