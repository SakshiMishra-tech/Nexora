import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Loader2,
  Shield,
  Mail,
  School,
  Building2,
  AlertTriangle,
  GraduationCap,
  UserCircle,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  ChevronRight,
  Camera,
  Trash2,
  MapPin,
  Upload,
  BadgeCheck,
  CalendarDays,
  Clock,
  TriangleAlert,
  PackageSearch,
  Edit3,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useState, useCallback, useRef, type ChangeEvent } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NexoraLogo } from "@/components/brand/NexoraLogo";
import { ProfileDropdown } from "@/components/profile/ProfileDropdown";
import { AUTH_ROUTES } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Nexora – Settings" }] }),
  component: SettingsRoute,
});

type NavSection = "profile" | "security" | "lost-found" | "actions";

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: "profile", label: "Profile & Campus", icon: UserCircle },
  { id: "security", label: "Account & Security", icon: Shield },
  { id: "lost-found", label: "Lost & Found", icon: PackageSearch },
  { id: "actions", label: "Account Actions", icon: TriangleAlert },
];

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
  "Sharda University",
  "Bennett University",
  "Symbiosis International University",
  "Christ University Bangalore",
  "Pune University (SPPU)",
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

const YEAR_OPTIONS = [
  "1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year",
  "PG / Masters", "PhD", "Diploma",
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

  const [activeSection, setActiveSection] = useState<NavSection>(
    (new URLSearchParams(window.location.search).get("tab") as NavSection) || "profile"
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displaySection, setDisplaySection] = useState<NavSection>(activeSection);

  const isInitialized = useRef(false);

  // ── PROFILE FORM ──────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    username: "",
    phone: "",
    whatsapp: "",
    bio: "",
    // Campus
    college: "",
    campusName: "",
    department: "",
    course: "",
    year: "3rd Year",
    // Location
    address: "",
    city: "",
    state: "Delhi NCR",
    country: "India",
    pincode: "",
    // Verification
    studentIdNumber: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [idUploading, setIdUploading] = useState(false);
  const [idFileName, setIdFileName] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // College autocomplete
  const [collegeQuery, setCollegeQuery] = useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [showOtherCollegeInput, setShowOtherCollegeInput] = useState(false);

  // City autocomplete
  const [cityQuery, setCityQuery] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // ── SECURITY FORM ─────────────────────────────────────────────
  // ── SECURITY FORM ─────────────────────────────────────────────
  // Email change
  const [emailChangeStep, setEmailChangeStep] = useState<"idle" | "otp" | "newEmail" | "newEmailOtp">("idle");
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const [newEmailOtp, setNewEmailOtp] = useState(["", "", "", "", "", ""]);
  const [newEmail, setNewEmail] = useState("");
  const [isEmailOtpSent, setIsEmailOtpSent] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // ── ACCOUNT ACTIONS ───────────────────────────────────────────
  // Deactivate flow
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateStep, setDeactivateStep] = useState<"confirm" | "otp" | "done">("confirm");
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivateOtp, setDeactivateOtp] = useState(["", "", "", "", "", ""]);
  const [isDeactivating, setIsDeactivating] = useState(false);

  // Delete flow
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"confirm" | "otp" | "warning">("confirm");
  const [deleteOtp, setDeleteOtp] = useState(["", "", "", "", "", ""]);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ── LOAD PROFILE ─────────────────────────────────────────────
  useEffect(() => {
    if ((profile || user) && !isInitialized.current) {
      isInitialized.current = true;
      const meta = user?.user_metadata || {};
      const collegeVal = (profile as any)?.college_name || meta.college_name || "";
      const avatarVal = (profile as any)?.avatar_url || meta.avatar_url || "";
      setAvatarUrl(avatarVal);
      setProfileForm({
        fullName: profile?.full_name || meta.full_name || "",
        username: meta.username || "",
        phone: (profile as any)?.phone || meta.phone || "",
        whatsapp: (profile as any)?.whatsapp || meta.whatsapp || "",
        bio: meta.bio || "",
        college: collegeVal,
        campusName: meta.campus_name || "",
        department: meta.department || meta.branch || "",
        course: meta.course || "",
        year: meta.year || "3rd Year",
        address: meta.address || "",
        city: meta.city || "",
        state: meta.state || "Delhi NCR",
        country: meta.country || "India",
        pincode: meta.pincode || "",
        studentIdNumber: meta.student_id_number || "",
      });
      setCollegeQuery(collegeVal);
      setCityQuery(meta.city || "");
      if (collegeVal && !POPULAR_COLLEGES.includes(collegeVal)) {
        setShowOtherCollegeInput(true);
      }
      if (meta.student_id_file_name) setIdFileName(meta.student_id_file_name);
    }
  }, [profile, user]);

  // OTP countdown
  useEffect(() => {
    if (otpCountdown > 0) {
      const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpCountdown]);

  // Read sessionStorage target section
  useEffect(() => {
    const req = window.sessionStorage.getItem("nexora-settings-section") as NavSection | null;
    window.sessionStorage.removeItem("nexora-settings-section");
    if (req) {
      setActiveSection(req);
      setDisplaySection(req);
    }
  }, []);

  // Smooth section transition
  const handleSectionChange = useCallback((id: NavSection) => {
    if (id === activeSection || isTransitioning) return;
    setIsTransitioning(true);
    setActiveSection(id);
    window.history.replaceState({}, '', `?tab=${id}`);
    setTimeout(() => {
      setDisplaySection(id);
      setIsTransitioning(false);
    }, 180);
  }, [activeSection, isTransitioning]);

  const updateProfileForm = (key: keyof typeof profileForm, value: string) => {
    setProfileForm((f) => ({ ...f, [key]: value }));
  };

  // ── AVATAR UPLOAD ─────────────────────────────────────────────
  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    setAvatarUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;

      // Try upload — if bucket missing, give a clear message
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes("bucket")) {
          toast.error(
            "Storage bucket 'avatars' not found. Please create it in your Supabase Dashboard: Storage → New Bucket → 'avatars' (public).",
            { duration: 8000 }
          );
          return;
        }
        throw uploadError;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(publicUrl);
      await supabase.from("profiles").upsert(
        { id: user.id, email: user.email ?? null, avatar_url: publicUrl },
        { onConflict: "id" }
      );
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      toast.success("Profile photo updated!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload photo");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setAvatarUrl("");
    await supabase.from("profiles").upsert(
      { id: user.id, email: user.email ?? null, avatar_url: null },
      { onConflict: "id" }
    );
    await supabase.auth.updateUser({ data: { avatar_url: null } });
    toast.success("Profile photo removed");
  };

  // ── STUDENT ID UPLOAD ─────────────────────────────────────────
  const handleStudentIdUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    setIdUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${user.id}/student-id.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("student-id-uploads")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) {
        if (uploadError.message?.toLowerCase().includes("bucket")) {
          toast.error(
            "Storage bucket 'student-id-uploads' not found. Create it in Supabase Dashboard: Storage → New Bucket → 'student-id-uploads' (private).",
            { duration: 8000 }
          );
          return;
        }
        throw uploadError;
      }
      setIdFileName(file.name);
      await supabase.auth.updateUser({ data: { student_id_file_name: file.name } });
      toast.success("Student ID uploaded!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload ID");
    } finally {
      setIdUploading(false);
      e.target.value = "";
    }
  };

  // ── SAVE PROFILE ─────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSavingProfile) return;
    setIsSavingProfile(true);
    try {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? null,
          full_name: profileForm.fullName.trim(),
          college_name: profileForm.college.trim(),
          phone: profileForm.phone.trim() || null,
          whatsapp: profileForm.whatsapp.trim() || null,
        },
        { onConflict: "id" }
      );
      await supabase.auth.updateUser({
        data: {
          full_name: profileForm.fullName.trim(),
          username: profileForm.username.trim(),
          phone: profileForm.phone.trim(),
          whatsapp: profileForm.whatsapp.trim(),
          bio: profileForm.bio.trim(),
          college_name: profileForm.college.trim(),
          campus_name: profileForm.campusName.trim(),
          department: profileForm.department.trim(),
          course: profileForm.course.trim(),
          year: profileForm.year,
          address: profileForm.address.trim(),
          city: profileForm.city.trim(),
          state: profileForm.state,
          country: profileForm.country.trim(),
          pincode: profileForm.pincode.trim(),
          student_id_number: profileForm.studentIdNumber.trim(),
        },
      });
      await refreshProfile();
      toast.success("Profile saved successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ── EMAIL CHANGE — Step 1: send OTP to CURRENT email ─────────
  const handleSendCurrentEmailOtp = async () => {
    if (!user?.email) return;
    setIsSendingEmailOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setEmailChangeStep("otp");
      setIsEmailOtpSent(true);
      setOtpCountdown(60);
      toast.success(`Verification code sent to ${user.email}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to send OTP. Check your Supabase email settings.");
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  // Step 2: verify OTP (check against Supabase)
  const handleVerifyCurrentEmailOtp = async () => {
    if (!user?.email) return;
    const otp = emailOtp.join("");
    if (otp.length < 6) { toast.error("Enter the 6-digit code"); return; }
    setIsVerifyingEmail(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: otp,
        type: "magiclink",
      });
      if (error) throw error;
      // OTP valid — unlock new email input
      setEmailChangeStep("newEmail");
      setEmailOtp(["", "", "", "", "", ""]);
      toast.success("Identity verified! Enter your new email address.");
    } catch (e: any) {
      toast.error(e.message || "Invalid code. Please try again.");
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Step 3: update email — Supabase sends confirmation OTP to NEW email
  const handleUpdateEmail = async () => {
    if (!newEmail.includes("@") || newEmail.trim() === user?.email) {
      toast.error("Enter a different valid email address");
      return;
    }
    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success(`Verification code sent to ${newEmail}`);
      setEmailChangeStep("newEmailOtp");
      setOtpCountdown(60);
    } catch (e: any) {
      toast.error(e.message || "Failed to update email");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // Step 4: verify new email OTP
  const handleVerifyNewEmailOtp = async () => {
    const otp = newEmailOtp.join("");
    if (otp.length < 6) { toast.error("Enter the 6-digit code"); return; }
    setIsVerifyingEmail(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: newEmail.trim(),
        token: otp,
        type: "email_change",
      });
      if (error) throw error;
      toast.success("Email successfully updated!");
      setEmailChangeStep("idle");
      setNewEmail("");
      setNewEmailOtp(["", "", "", "", "", ""]);
      setIsEmailOtpSent(false);
    } catch (e: any) {
      toast.error(e.message || "Invalid code. Please try again.");
    } finally {
      setIsVerifyingEmail(false);
    }
  };


  // ── DEACTIVATE — password-based or OTP-based ─────────────────
  const handleSendDeactivateOtp = async () => {
    if (!user?.email) return;
    setIsSendingEmailOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setDeactivateStep("otp");
      setOtpCountdown(60);
      toast.success(`Verification code sent to ${user.email}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to send OTP.");
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const executeDeactivation = async () => {
    setIsDeactivating(true);
    try {
      await supabase.from("profiles").upsert(
        { id: user!.id, email: user?.email ?? null, is_deactivated: true, deactivation_reason: deactivateReason },
        { onConflict: "id" }
      );
      await supabase.auth.updateUser({ data: { is_deactivated: true, deactivation_reason: deactivateReason } });
      toast.success("Account deactivated. Log in anytime to reactivate.");
      setShowDeactivateModal(false);
      await signOut();
      void navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e.message || "Failed to deactivate account");
    } finally {
      setIsDeactivating(false);
    }
  };


  const handleVerifyDeactivateOtp = async () => {
    if (!user?.email) return;
    const otp = deactivateOtp.join("");
    if (otp.length < 6) { toast.error("Enter the 6-digit code"); return; }
    setIsDeactivating(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: otp,
        type: "magiclink",
      });
      if (error) throw error;
      await executeDeactivation();
    } catch (e: any) {
      toast.error(e.message || "Invalid code. Please try again.");
      setIsDeactivating(false);
    }
  };

  // ── DELETE — password-based or OTP-based ─────────────────────
  const handleSendDeleteOtp = async () => {
    if (!user?.email) return;
    setIsSendingEmailOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: { shouldCreateUser: false },
      });
      if (error) throw error;
      setDeleteStep("otp");
      setOtpCountdown(60);
      toast.success(`Verification code sent to ${user.email}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to send OTP.");
    } finally {
      setIsSendingEmailOtp(false);
    }
  };


  const handleVerifyDeleteOtp = async () => {
    if (!user?.email) return;
    const otp = deleteOtp.join("");
    if (otp.length < 6) { toast.error("Enter the 6-digit code"); return; }
    setIsDeleting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: otp,
        type: "magiclink",
      });
      if (error) throw error;
      setDeleteStep("warning");
    } catch (e: any) {
      toast.error(e.message || "Invalid code. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== "DELETE") { toast.error('Type "DELETE" to confirm'); return; }
    setIsDeleting(true);
    try {
      if (user?.id) {
        await supabase.from("profiles").delete().eq("id", user.id);
        try { await supabase.from("user_settings").delete().eq("user_id", user.id); } catch { /* ok */ }
        try { await supabase.from("marketplace_items").delete().eq("seller_id", user.id); } catch { /* ok */ }
      }
      toast.success("Account deleted. Goodbye!");
      setShowDeleteModal(false);
      await signOut();
      void navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e.message || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  // Computed values
  const displayName = profile?.full_name?.trim() || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "ST";
  const filteredColleges = POPULAR_COLLEGES.filter(c => c.toLowerCase().includes(collegeQuery.toLowerCase()));
  const filteredCities = POPULAR_CITIES.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()));
  const joinedDate = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const lastLogin = user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";

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
            <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Settings
            </p>
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
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── RIGHT CONTENT PANEL ── */}
        <div className="flex-1 min-w-0 py-6 px-6 lg:px-8 overflow-hidden">
          <div
            className="transition-all duration-200"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? "translateX(12px)" : "translateX(0px)",
            }}
          >

            {/* ══════════════════════════════════════════════════════ */}
            {/*  SECTION 1 — PROFILE & CAMPUS                         */}
            {/* ══════════════════════════════════════════════════════ */}
            {displaySection === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-8 max-w-3xl">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Profile & Campus</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Your personal information, campus details, and student verification.
                  </p>
                </div>

                {/* ── PROFILE PHOTO CARD ── */}
                <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-5">
                  {/* Avatar — clicking either the image or the button opens the picker */}
                  <label
                    htmlFor="avatar-upload"
                    className="relative shrink-0 cursor-pointer group"
                    title="Click to upload photo"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className="h-20 w-20 rounded-2xl object-cover border-2 border-border group-hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-2xl bg-primary text-2xl font-black text-primary-foreground grid place-items-center border-2 border-primary/20 group-hover:opacity-80 transition-opacity">
                        {initials}
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {avatarUploading && (
                      <div className="absolute inset-0 rounded-2xl bg-black/50 grid place-items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      </div>
                    )}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-bold text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <div className="flex gap-2 mt-1">
                      <label
                        htmlFor="avatar-upload"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity active:scale-95"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Change Photo
                      </label>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Click photo or button to upload (max 5MB)</p>
                  </div>
                </div>

                {/* ── PERSONAL INFORMATION ── */}
                <FieldSection title="Personal Information" icon={UserCircle}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="full-name">Full Name</FieldLabel>
                      <input
                        id="full-name"
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) => updateProfileForm("fullName", e.target.value)}
                        placeholder="e.g. Aditya Kumar"
                        className="settings-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="username">Username</FieldLabel>
                      <input
                        id="username"
                        type="text"
                        value={profileForm.username}
                        onChange={(e) => updateProfileForm("username", e.target.value)}
                        placeholder="e.g. aditya.k"
                        className="settings-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel htmlFor="email-readonly">Email Address</FieldLabel>
                    <div className="relative">
                      <input
                        id="email-readonly"
                        type="email"
                        value={user?.email || ""}
                        readOnly
                        className="settings-input opacity-60 cursor-not-allowed pr-20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-secondary px-2 py-0.5 text-[10px] font-black text-muted-foreground">
                        READ ONLY
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      To change your email, go to{" "}
                      <button type="button" onClick={() => handleSectionChange("security")} className="text-primary font-semibold hover:underline">
                        Account & Security
                      </button>
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                      <input
                        id="phone"
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => updateProfileForm("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        className="settings-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <FieldLabel htmlFor="bio">Bio</FieldLabel>
                    <textarea
                      id="bio"
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) => updateProfileForm("bio", e.target.value)}
                      placeholder="Tell your campus about yourself…"
                      className="settings-input resize-none"
                    />
                  </div>
                </FieldSection>

                {/* ── LOST & FOUND POSTS ── */}
                <FieldSection title="Lost & Found Posts" icon={PackageSearch}>
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <p className="text-sm text-muted-foreground mb-4">
                      Manage your active and resolved lost/found posts. You can view, edit, or mark them as recovered.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Link to="/lost-found" search={{ tab: "lost" }} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90">
                        <PackageSearch className="h-4 w-4" />
                        My Lost Posts
                      </Link>
                      <Link to="/lost-found" search={{ tab: "found" }} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-bold text-foreground hover:bg-muted">
                        <PackageSearch className="h-4 w-4" />
                        My Found Posts
                      </Link>
                    </div>
                  </div>
                </FieldSection>


                {/* ── CAMPUS INFORMATION ── */}
                <FieldSection title="Campus Information" icon={GraduationCap}>
                  {/* College autocomplete */}
                  <div className="relative space-y-1.5">
                    <FieldLabel>College / University</FieldLabel>
                    <input
                      type="text"
                      value={showOtherCollegeInput ? "" : collegeQuery}
                      onChange={(e) => {
                        setCollegeQuery(e.target.value);
                        updateProfileForm("college", e.target.value);
                        setShowCollegeDropdown(true);
                        setShowOtherCollegeInput(false);
                      }}
                      onFocus={() => { if (!showOtherCollegeInput) setShowCollegeDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowCollegeDropdown(false), 200)}
                      placeholder={showOtherCollegeInput ? `Click "Other" below to type manually` : "Search your institution…"}
                      readOnly={showOtherCollegeInput}
                      className={`settings-input ${showOtherCollegeInput ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                    {showCollegeDropdown && (
                      <SuggestionDropdown>
                        {filteredColleges.map((c) => (
                          <SuggestionItem
                            key={c}
                            icon={School}
                            label={c}
                            onClick={() => {
                              updateProfileForm("college", c);
                              setCollegeQuery(c);
                              setShowCollegeDropdown(false);
                              setShowOtherCollegeInput(false);
                            }}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setShowOtherCollegeInput(true);
                            setShowCollegeDropdown(false);
                            setCollegeQuery("");
                            updateProfileForm("college", "");
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl border-t border-border/60 mt-1 pt-1.5 px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/5 transition-colors"
                        >
                          <span className="text-primary">✦</span>
                          <span>Other — type your college name manually</span>
                        </button>
                      </SuggestionDropdown>
                    )}
                    {showOtherCollegeInput && (
                      <div className="space-y-1.5 animate-in fade-in duration-150">
                        <div className="flex items-center gap-1.5">
                          <FieldLabel>Type your college name</FieldLabel>
                          <button
                            type="button"
                            onClick={() => { setShowOtherCollegeInput(false); setCollegeQuery(""); updateProfileForm("college", ""); }}
                            className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            ← Search list instead
                          </button>
                        </div>
                        <input
                          type="text"
                          autoFocus
                          value={profileForm.college}
                          onChange={(e) => updateProfileForm("college", e.target.value)}
                          placeholder="e.g. Sharda University, Greater Noida"
                          className="settings-input border-primary/40 focus:border-primary"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="campus-name">Campus Name</FieldLabel>
                      <input
                        id="campus-name"
                        type="text"
                        value={profileForm.campusName}
                        onChange={(e) => updateProfileForm("campusName", e.target.value)}
                        placeholder="e.g. Main Campus, Noida"
                        className="settings-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="department">Department</FieldLabel>
                      <input
                        id="department"
                        type="text"
                        value={profileForm.department}
                        onChange={(e) => updateProfileForm("department", e.target.value)}
                        placeholder="e.g. Computer Science"
                        className="settings-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="course">Course</FieldLabel>
                      <input
                        id="course"
                        type="text"
                        value={profileForm.course}
                        onChange={(e) => updateProfileForm("course", e.target.value)}
                        placeholder="e.g. B.Tech, MBA"
                        className="settings-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="year">Year / Semester</FieldLabel>
                      <select
                        id="year"
                        value={profileForm.year}
                        onChange={(e) => updateProfileForm("year", e.target.value)}
                        className="settings-input"
                      >
                        {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                </FieldSection>

                {/* ── LOCATION INFORMATION ── */}
                <FieldSection title="Location Information" icon={MapPin}>
                  <div className="space-y-1.5">
                    <FieldLabel htmlFor="address">Address</FieldLabel>
                    <input
                      id="address"
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => updateProfileForm("address", e.target.value)}
                      placeholder="Street / Block / Hostel"
                      className="settings-input"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* City autocomplete */}
                    <div className="relative space-y-1.5">
                      <FieldLabel>City</FieldLabel>
                      <input
                        type="text"
                        value={cityQuery}
                        onChange={(e) => { setCityQuery(e.target.value); updateProfileForm("city", e.target.value); setShowCityDropdown(true); }}
                        onFocus={() => setShowCityDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCityDropdown(false), 150)}
                        placeholder="e.g. Bengaluru"
                        className="settings-input"
                      />
                      {showCityDropdown && filteredCities.length > 0 && (
                        <SuggestionDropdown>
                          {filteredCities.map((c) => (
                            <SuggestionItem
                              key={c}
                              icon={Building2}
                              label={c}
                              onClick={() => { updateProfileForm("city", c); setCityQuery(c); setShowCityDropdown(false); }}
                            />
                          ))}
                        </SuggestionDropdown>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="state">State</FieldLabel>
                      <select
                        id="state"
                        value={profileForm.state}
                        onChange={(e) => updateProfileForm("state", e.target.value)}
                        className="settings-input"
                      >
                        {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="country">Country</FieldLabel>
                      <input
                        id="country"
                        type="text"
                        value={profileForm.country}
                        onChange={(e) => updateProfileForm("country", e.target.value)}
                        placeholder="e.g. India"
                        className="settings-input"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="pincode">Pincode</FieldLabel>
                      <input
                        id="pincode"
                        type="text"
                        maxLength={6}
                        value={profileForm.pincode}
                        onChange={(e) => updateProfileForm("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit pincode"
                        className="settings-input font-mono"
                      />
                    </div>
                  </div>
                </FieldSection>

                {/* ── VERIFICATION INFORMATION ── */}
                <FieldSection title="Verification Information" icon={BadgeCheck}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <FieldLabel htmlFor="student-id-number">Student ID Number</FieldLabel>
                      <input
                        id="student-id-number"
                        type="text"
                        value={profileForm.studentIdNumber}
                        onChange={(e) => updateProfileForm("studentIdNumber", e.target.value)}
                        placeholder="e.g. 2022CSE0001"
                        className="settings-input font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <FieldLabel>Student ID Upload</FieldLabel>
                      <label
                        htmlFor="student-id-upload"
                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border ${idFileName ? "border-primary/40 bg-primary/5" : "border-border bg-card"} px-3 py-2.5 transition-colors hover:border-primary/60`}
                      >
                        {idUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Upload className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="truncate text-xs font-semibold text-foreground">
                          {idFileName || "Upload Student ID (JPG / PDF)"}
                        </span>
                        <input
                          id="student-id-upload"
                          type="file"
                          accept="image/*,.pdf"
                          className="sr-only"
                          onChange={handleStudentIdUpload}
                        />
                      </label>
                      {idFileName && (
                        <p className="text-[11px] text-primary flex items-center gap-1">
                          <Check className="h-3 w-3" /> Uploaded
                        </p>
                      )}
                    </div>
                  </div>
                </FieldSection>

                {/* ── SAVE BUTTON ── */}
                <div className="flex items-center gap-3 pt-2 pb-6">
                  <Button
                    type="submit"
                    id="settings-save-profile"
                    disabled={isSavingProfile}
                    className="rounded-xl px-8 font-bold"
                  >
                    {isSavingProfile ? (
                      <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/*  SECTION 2 — ACCOUNT & SECURITY                       */}
            {/* ══════════════════════════════════════════════════════ */}
            {displaySection === "security" && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Account & Security</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Manage your email, password, and view your account status.
                  </p>
                </div>

                {/* ── EMAIL MANAGEMENT ── */}
                <FieldSection title="Email Management" icon={Mail}>
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
                    {/* Current email always visible */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Email</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{user?.email}</p>
                    </div>

                    {/* STEP 1: idle — show "Change Email" button */}
                    {emailChangeStep === "idle" && (
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">To change your email, verify your identity first.</p>
                        <Button
                          type="button"
                          disabled={isSendingEmailOtp}
                          onClick={handleSendCurrentEmailOtp}
                          className="shrink-0 rounded-xl font-bold text-xs"
                        >
                          {isSendingEmailOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send OTP to my email"}
                        </Button>
                      </div>
                    )}

                    {/* STEP 2: enter OTP sent to current email */}
                    {emailChangeStep === "otp" && (
                      <div className="space-y-4 rounded-xl border border-primary/30 bg-primary/5 p-4 animate-in fade-in">
                        <p className="text-xs font-bold text-foreground">
                          Enter the 6-digit code sent to <span className="text-primary">{user?.email}</span>
                        </p>
                        <div className="flex gap-2">
                          {emailOtp.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`email-otp-${idx}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                const next = [...emailOtp]; next[idx] = val; setEmailOtp(next);
                                if (val && idx < 5) document.getElementById(`email-otp-${idx + 1}`)?.focus();
                              }}
                              onKeyDown={(e) => { if (e.key === "Backspace" && !digit && idx > 0) document.getElementById(`email-otp-${idx - 1}`)?.focus(); }}
                              className="h-10 w-10 rounded-xl border border-border bg-card text-center font-mono text-sm font-bold text-foreground outline-none focus:border-primary"
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            disabled={otpCountdown > 0 || isSendingEmailOtp}
                            onClick={handleSendCurrentEmailOtp}
                            className="text-xs font-bold text-primary hover:underline disabled:text-muted-foreground"
                          >
                            {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend Code"}
                          </button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { setEmailChangeStep("idle"); setEmailOtp(["","","","","",""]); }}
                              className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                            <Button
                              type="button"
                              disabled={isVerifyingEmail || emailOtp.join("").length < 6}
                              onClick={handleVerifyCurrentEmailOtp}
                              className="rounded-xl text-xs font-bold"
                            >
                              {isVerifyingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify Code"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: OTP verified — now enter new email */}
                    {emailChangeStep === "newEmail" && (
                      <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 animate-in fade-in">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <p className="text-xs font-bold text-emerald-600">Identity verified! Enter your new email address.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="New email address"
                            className="settings-input flex-1"
                            autoFocus
                          />
                          <Button
                            type="button"
                            disabled={isUpdatingEmail || !newEmail.includes("@")}
                            onClick={handleUpdateEmail}
                            className="shrink-0 rounded-xl font-bold text-xs"
                          >
                            {isUpdatingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update Email"}
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2">
                          A verification code will be sent to your new email.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setEmailChangeStep("idle"); setNewEmail(""); }}
                          className="text-xs text-muted-foreground hover:text-foreground mt-2"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* STEP 4: enter OTP sent to NEW email */}
                    {emailChangeStep === "newEmailOtp" && (
                      <div className="space-y-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 animate-in fade-in">
                        <p className="text-xs font-bold text-foreground">
                          Enter the 6-digit code sent to <span className="text-emerald-500">{newEmail}</span>
                        </p>
                        <div className="flex gap-2">
                          {newEmailOtp.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`new-email-otp-${idx}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                const next = [...newEmailOtp]; next[idx] = val; setNewEmailOtp(next);
                                if (val && idx < 5) document.getElementById(`new-email-otp-${idx + 1}`)?.focus();
                              }}
                              onKeyDown={(e) => { if (e.key === "Backspace" && !digit && idx > 0) document.getElementById(`new-email-otp-${idx - 1}`)?.focus(); }}
                              className="h-10 w-10 rounded-xl border border-border bg-card text-center font-mono text-sm font-bold text-foreground outline-none focus:border-emerald-500"
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            disabled={otpCountdown > 0 || isUpdatingEmail}
                            onClick={handleUpdateEmail}
                            className="text-xs font-bold text-emerald-500 hover:underline disabled:text-muted-foreground"
                          >
                            {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend Code"}
                          </button>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { setEmailChangeStep("newEmail"); setNewEmailOtp(["","","","","",""]); }}
                              className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                            >
                              Back
                            </button>
                            <Button
                              type="button"
                              disabled={isVerifyingEmail || newEmailOtp.join("").length < 6}
                              onClick={handleVerifyNewEmailOtp}
                              className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              {isVerifyingEmail ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify Code"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </FieldSection>



                {/* ── ACCOUNT STATUS ── */}
                <FieldSection title="Account Status" icon={BadgeCheck}>
                  <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <StatusBadge label="Account Status" value="Active" color="emerald" />
                      <StatusBadge label="Verified" value={user?.email_confirmed_at ? "Yes" : "No"} color={user?.email_confirmed_at ? "emerald" : "amber"} />
                      <StatusBadge label="Campus Verified" value={profileForm.college ? "Yes" : "No"} color={profileForm.college ? "emerald" : "amber"} />
                      <StatusBadge label="Account Type" value="Student" color="blue" />
                    </div>
                    <div className="pt-2 border-t border-border/60 space-y-3">
                      <div className="flex items-center gap-2.5">
                        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">Joined <span className="font-semibold text-foreground">{joinedDate}</span></span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">Last login <span className="font-semibold text-foreground">{lastLogin}</span></span>
                      </div>
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/*  SECTION 3 — LOST & FOUND                             */}
            {/* ══════════════════════════════════════════════════════ */}
            {displaySection === "lost-found" && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Lost & Found</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Manage your lost and found posts, drafts, and resolved items.
                  </p>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <Link to="/lost-found" search={{ tab: "lost" }} className="group relative flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
                      <PackageSearch className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">My Lost Posts</h3>
                      <p className="text-xs text-muted-foreground">Items you have lost</p>
                    </div>
                  </Link>

                  <Link to="/lost-found" search={{ tab: "found" }} className="group relative flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <PackageSearch className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">My Found Posts</h3>
                      <p className="text-xs text-muted-foreground">Items you have found</p>
                    </div>
                  </Link>

                  <Link to="/lost-found" search={{ tab: "drafts" }} className="group relative flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                      <Edit3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Drafts</h3>
                      <p className="text-xs text-muted-foreground">Continue editing posts</p>
                    </div>
                  </Link>
                  
                  <Link to="/lost-found" search={{ tab: "resolved" }} className="group relative flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-5 hover:border-primary/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Resolved</h3>
                      <p className="text-xs text-muted-foreground">Recovered or returned items</p>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/*  SECTION 4 — ACCOUNT ACTIONS                          */}
            {/* ══════════════════════════════════════════════════════ */}
            {displaySection === "actions" && (
              <div className="space-y-8 max-w-2xl">
                <div>
                  <h1 className="text-2xl font-black text-foreground">Account Actions</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Irreversible account operations. Please read carefully before proceeding.
                  </p>
                </div>

                {/* Danger Zone Card */}
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 overflow-hidden">
                  <div className="flex items-center gap-2.5 border-b border-destructive/20 bg-destructive/10 px-5 py-3">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <h2 className="text-sm font-black text-destructive">Danger Zone</h2>
                  </div>

                  <div className="p-5 space-y-6">
                    {/* Deactivate */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">Deactivate Account</p>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                          Temporarily disable your account. Your profile will be hidden but all data will remain safe. You can reactivate anytime by logging back in.
                        </p>
                      </div>
                      <button
                        type="button"
                        id="settings-deactivate-btn"
                        onClick={() => { setShowDeactivateModal(true); setDeactivateStep("confirm"); setDeactivateReason(""); }}
                        className="shrink-0 rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-bold text-foreground hover:bg-secondary/70 transition-colors"
                      >
                        Deactivate
                      </button>
                    </div>

                    <div className="h-px bg-destructive/20" />

                    {/* Delete */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-destructive">Delete Account Permanently</p>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                          Permanently delete your account and all associated data including profile, listings, chats, and settings. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        type="button"
                        id="settings-delete-btn"
                        onClick={() => { setShowDeleteModal(true); setDeleteStep("confirm"); setDeleteConfirmText(""); }}
                        className="shrink-0 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90 transition-opacity"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  DEACTIVATE MODAL                                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showDeactivateModal && (
        <Modal onClose={() => setShowDeactivateModal(false)}>
          <div className="space-y-5">
            {/* Step 1: Choose reason */}
            {deactivateStep === "confirm" && (
              <>
                <div>
                  <h3 className="text-base font-black text-foreground">Deactivate Account</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Your profile and listings will be hidden. Log back in anytime to reactivate — no data is lost.
                  </p>
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
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowDeactivateModal(false)} className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary">Cancel</button>
                  <Button
                    type="button"
                    disabled={!deactivateReason || isSendingEmailOtp}
                    onClick={handleSendDeactivateOtp}
                    className="rounded-xl font-bold"
                  >
                    {isSendingEmailOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                    Continue
                  </Button>
                </div>
              </>
            )}


            {/* Step 3: OTP verification */}
            {deactivateStep === "otp" && (
              <>
                <div>
                  <h3 className="text-base font-black text-foreground">Confirm with Code</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter the 6-digit code sent to <strong className="text-primary">{user?.email}</strong>.
                  </p>
                </div>
                <div className="flex gap-2">
                  {deactivateOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`deactivate-otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const next = [...deactivateOtp]; next[idx] = val; setDeactivateOtp(next);
                        if (val && idx < 5) document.getElementById(`deactivate-otp-${idx + 1}`)?.focus();
                      }}
                      onKeyDown={(e) => { if (e.key === "Backspace" && !digit && idx > 0) document.getElementById(`deactivate-otp-${idx - 1}`)?.focus(); }}
                      className="h-10 w-10 rounded-xl border border-border bg-card text-center font-mono text-sm font-bold text-foreground outline-none focus:border-primary"
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={otpCountdown > 0 || isSendingEmailOtp}
                    onClick={handleSendDeactivateOtp}
                    className="text-xs font-bold text-primary hover:underline disabled:text-muted-foreground"
                  >
                    {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend Code"}
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setDeactivateStep("confirm"); setDeactivateOtp(["","","","","",""]); }} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">Back</button>
                    <Button type="button" disabled={isDeactivating || deactivateOtp.join("").length < 6} onClick={handleVerifyDeactivateOtp} className="rounded-xl text-xs font-bold">
                      {isDeactivating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify Code"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/*  DELETE MODAL                                              */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)} danger>
          <div className="space-y-5">
            {/* Step 1: Confirm with password */}
            {deleteStep === "confirm" && (
              <>
                <div>
                  <h3 className="text-base font-black text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Delete Account Permanently
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    All your data will be permanently erased. Enter your password to continue.
                  </p>
                </div>
                <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
                  Account: <strong>{user?.email}</strong>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    type="button" 
                    disabled={isSendingEmailOtp}
                    onClick={handleSendDeleteOtp} 
                    className="rounded-xl bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground hover:opacity-90 transition-opacity flex items-center justify-center w-full"
                  >
                    {isSendingEmailOtp ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
                    Send Verification Code
                  </button>
                  <button type="button" onClick={() => setShowDeleteModal(false)} className="text-xs text-muted-foreground hover:text-foreground mt-2">Cancel</button>
                </div>
              </>
            )}

            {/* OTP verification */}
            {deleteStep === "otp" && (
              <>
                <div>
                  <h3 className="text-base font-black text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Confirm with Code
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Enter the 6-digit code sent to <strong className="text-destructive">{user?.email}</strong>.
                  </p>
                </div>
                <div className="flex gap-2">
                  {deleteOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`delete-otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        const next = [...deleteOtp]; next[idx] = val; setDeleteOtp(next);
                        if (val && idx < 5) document.getElementById(`delete-otp-${idx + 1}`)?.focus();
                      }}
                      onKeyDown={(e) => { if (e.key === "Backspace" && !digit && idx > 0) document.getElementById(`delete-otp-${idx - 1}`)?.focus(); }}
                      className="h-10 w-10 rounded-xl border border-destructive/40 bg-card text-center font-mono text-sm font-bold text-destructive outline-none focus:border-destructive"
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={otpCountdown > 0 || isSendingEmailOtp}
                    onClick={handleSendDeleteOtp}
                    className="text-xs font-bold text-destructive hover:underline disabled:opacity-50"
                  >
                    {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend Code"}
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setDeleteStep("confirm"); setDeleteOtp(["","","","","",""]); }} className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">Back</button>
                    <button
                      type="button"
                      disabled={isDeleting || deleteOtp.join("").length < 6}
                      onClick={handleVerifyDeleteOtp}
                      className="rounded-xl bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify Code"}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Step 2: Final type-DELETE confirmation */}
            {deleteStep === "warning" && (
              <>
                <div>
                  <h3 className="text-base font-black text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Final Warning — Cannot Be Undone
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Type <strong className="text-foreground">DELETE</strong> to permanently delete your account.
                  </p>
                </div>
                <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 space-y-2">
                  <p className="text-xs font-bold text-destructive">What will be deleted:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2"><X className="h-3 w-3 text-destructive" /> Profile and all personal data</li>
                    <li className="flex items-center gap-2"><X className="h-3 w-3 text-destructive" /> All marketplace listings</li>
                    <li className="flex items-center gap-2"><X className="h-3 w-3 text-destructive" /> Account settings and preferences</li>
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <FieldLabel>Type DELETE to confirm</FieldLabel>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE here"
                    className="settings-input font-mono text-destructive border-destructive/40 focus:border-destructive"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowDeleteModal(false)} className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary">Cancel</button>
                  <button
                    type="button"
                    disabled={isDeleting || deleteConfirmText !== "DELETE"}
                    onClick={handleConfirmDelete}
                    className="rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete Permanently"}
                  </button>

                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
}

/* ── SMALL REUSABLE COMPONENTS ── */

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="text-xs font-bold text-muted-foreground">{children}</label>;
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

function StatusBadge({ label, value, color }: { label: string; value: string; color: "emerald" | "amber" | "blue" | "gray" }) {
  const colorMap = {
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    gray: "bg-secondary text-muted-foreground border-border",
  };
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${colorMap[color]}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${color === "emerald" ? "bg-emerald-500" : color === "amber" ? "bg-amber-500" : color === "blue" ? "bg-blue-500" : "bg-muted-foreground"}`} />
        {value}
      </span>
    </div>
  );
}

function Modal({ children, onClose, danger }: { children: React.ReactNode; onClose: () => void; danger?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className={`relative w-full max-w-md rounded-2xl border ${danger ? "border-destructive/40" : "border-border"} bg-card p-6 shadow-mega text-card-foreground animate-in zoom-in-95 duration-150`}>
        <button type="button" onClick={onClose}
          className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}
