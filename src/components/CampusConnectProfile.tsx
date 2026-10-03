/**
 * CampusConnectProfile.tsx
 * Campus Connect – My Profile section.
 * Handles profile fetch, creation, editing and photo upload via Supabase.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  PauseCircle,
  Plus,
  Save,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMyDatingProfile,
  upsertDatingProfile,
  uploadDatingPhoto,
  deleteDatingPhoto,
} from "@/services/dating.service";
import type { DatingProfile } from "@/types/dating";

// ─── Constants ────────────────────────────────────────────────────────────────

const INTEREST_OPTIONS = [
  "Music", "Sports", "Coding", "Movies", "Anime", "Travel", "Reading",
  "Photography", "Fitness", "Gaming", "Dance", "Art", "Coffee", "Startups",
  "Design", "Cooking", "Hiking", "Yoga", "Pets", "Volunteering",
];
const GOAL_OPTIONS = ["Dating", "Long Term", "Friends", "Study Partner", "Networking", "Open to Explore"];
const GENDER_OPTIONS = ["Woman", "Man", "Non-binary", "Other", "Prefer not to say"];
const INTERESTED_IN_OPTIONS = ["Women", "Men", "Everyone"];
const YEAR_OPTIONS = ["1st year", "2nd year", "3rd year", "4th year", "5th year", "Postgraduate"];

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  name: string;
  age: string;
  age_preference_min: string;
  age_preference_max: string;
  gender: string;
  interested_in: string;
  college: string;
  campus: string;
  department: string;
  course: string;
  year: string;
  bio: string;
  height: string;
  languages: string;
  relationship_goal: string;
  looking_for: string[];
  interests: string[];
  favorite_spot: string;
  instagram: string;
  spotify: string;
  hide_department: boolean;
  hide_course: boolean;
  hide_year: boolean;
  hide_online: boolean;
  hide_distance: boolean;
  hide_instagram: boolean;
  pause_discover: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function profileToForm(p: DatingProfile): FormState {
  return {
    name: p.name,
    age: String(p.age),
    age_preference_min: String(p.age_preference_min),
    age_preference_max: String(p.age_preference_max),
    gender: p.gender,
    interested_in: p.interested_in,
    college: p.college ?? "",
    campus: p.campus ?? "",
    department: p.department ?? "",
    course: p.course ?? "",
    year: p.year ?? "",
    bio: p.bio ?? "",
    height: p.height ?? "",
    languages: p.languages ?? "",
    relationship_goal: p.relationship_goal ?? "",
    looking_for: p.looking_for ?? [],
    interests: p.interests ?? [],
    favorite_spot: p.favorite_spot ?? "",
    instagram: p.instagram ?? "",
    spotify: p.spotify ?? "",
    hide_department: p.hide_department,
    hide_course: p.hide_course,
    hide_year: p.hide_year,
    hide_online: p.hide_online,
    hide_distance: p.hide_distance,
    hide_instagram: p.hide_instagram,
    pause_discover: p.pause_discover,
  };
}

function emptyForm(): FormState {
  return {
    name: "", age: "", age_preference_min: "18", age_preference_max: "26",
    gender: "", interested_in: "",
    college: "", campus: "", department: "", course: "", year: "",
    bio: "", height: "", languages: "", relationship_goal: "",
    looking_for: [], interests: [],
    favorite_spot: "", instagram: "", spotify: "",
    hide_department: false, hide_course: false, hide_year: false,
    hide_online: false, hide_distance: false, hide_instagram: true,
    pause_discover: false,
  };
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim() || form.name.trim().length < 2) errors.name = "Full name is required (min 2 characters).";
  const age = Number(form.age);
  if (!form.age || isNaN(age) || age < 17 || age > 60) errors.age = "Age must be between 17 and 60.";
  if (!form.gender) errors.gender = "Gender is required.";
  if (!form.interested_in) errors.interested_in = "Interested in is required.";
  if (!form.college.trim()) errors.college = "College name is required.";
  if (!form.campus.trim()) errors.campus = "Campus is required.";
  if (!form.department.trim()) errors.department = "Department is required.";
  if (!form.course.trim()) errors.course = "Course is required.";
  if (!form.year) errors.year = "Year is required.";
  if (!form.bio.trim() || form.bio.trim().length < 30) errors.bio = "Bio must be at least 30 characters.";
  if (!form.relationship_goal) errors.relationship_goal = "Relationship goal is required.";
  if (form.looking_for.length === 0) errors.looking_for = "Select at least one option.";
  if (form.interests.length < 5) errors.interests = "Select at least 5 interests.";
  return errors;
}

function getProfileCompletion(profile: DatingProfile | null, photos: string[]) {
  if (!profile) return 0;
  const checks = [
    photos.length >= 3,
    Boolean(profile.name?.trim()),
    Boolean(profile.gender),
    Boolean(profile.interested_in),
    Boolean(profile.college?.trim()),
    Boolean(profile.campus?.trim()),
    Boolean(profile.department?.trim()),
    Boolean(profile.course?.trim()),
    Boolean(profile.year),
    (profile.bio?.trim().length ?? 0) >= 30,
    Boolean(profile.relationship_goal),
    (profile.looking_for?.length ?? 0) > 0,
    (profile.interests?.length ?? 0) >= 5,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3 mt-6">
      {children}
    </p>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="block text-xs font-bold text-muted-foreground mb-1.5">
      {children}{required && <span className="text-destructive ml-0.5">*</span>}
    </span>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-destructive font-semibold mt-1">{msg}</p>;
}

function TextInput({
  value, onChange, placeholder, maxLength, disabled,
}: { value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; disabled?: boolean }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50"
    />
  );
}

function SelectInput({
  value, onChange, options, placeholder, disabled,
}: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; disabled?: boolean }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors pr-8 disabled:opacity-50"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}

function MultiChip({
  options, selected, onChange, max,
}: { options: string[]; selected: string[]; onChange: (v: string[]) => void; max?: number }) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else if (!max || selected.length < max) {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function PrivacyToggle({
  label, description, checked, onChange,
}: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full text-left flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${
        checked ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:border-border/80"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className={`w-10 h-6 rounded-full flex items-center transition-all shrink-0 ${checked ? "bg-primary justify-end" : "bg-border justify-start"}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm mx-0.5 transition-all`} />
      </div>
    </button>
  );
}

// ─── Photo Grid ───────────────────────────────────────────────────────────────

function PhotoGrid({
  photos,
  primaryPhoto,
  uploading,
  onUpload,
  onDelete,
  onSetPrimary,
}: {
  photos: string[];
  primaryPhoto: string | null;
  uploading: boolean;
  onUpload: (files: FileList) => void;
  onDelete: (url: string) => void;
  onSetPrimary: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const slots = [...photos, ...Array(Math.max(0, 6 - photos.length)).fill(null)];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {slots.map((url, i) => {
        if (url) {
          const isPrimary = url === primaryPhoto;
          return (
            <div key={url} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {isPrimary && (
                <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] font-black px-2 py-0.5 rounded-full">
                  Main
                </span>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-1.5 pb-2">
                {!isPrimary && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(url)}
                    title="Set as main photo"
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-foreground hover:bg-white transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(url)}
                  title="Remove photo"
                  className="w-7 h-7 rounded-full bg-destructive/90 flex items-center justify-center text-white hover:bg-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        }
        return (
          <button
            key={`empty-${i}`}
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-[3/4] rounded-xl border-2 border-dashed border-border bg-card flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all disabled:opacity-50"
          >
            {uploading && i === photos.length ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span className="text-[10px] font-bold">Add photo</span>
              </>
            )}
          </button>
        );
      })}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onUpload(e.target.files)}
      />
    </div>
  );
}

// ─── Profile Preview Card ─────────────────────────────────────────────────────

function ProfilePreviewCard({ form, photos, primaryPhoto }: { form: FormState; photos: string[]; primaryPhoto: string | null }) {
  const mainPhoto = primaryPhoto ?? photos[0] ?? null;
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm max-w-xs mx-auto">
      {mainPhoto ? (
        <div className="relative aspect-[3/4]">
          <img src={mainPhoto} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="font-display font-black text-2xl leading-tight">
                  {form.name || "Your name"}{form.age ? `, ${form.age}` : ""}
                </h3>
                <p className="text-xs text-white/80 font-medium mt-0.5">
                  {form.department && form.college ? `${form.department} · ${form.college}` : form.college || "College not set"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-black">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
            </div>
            {form.bio && (
              <p className="text-xs text-white/75 mt-2 line-clamp-2 leading-relaxed">{form.bio}</p>
            )}
            {form.interests.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.interests.slice(0, 4).map((tag) => (
                  <span key={tag} className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="aspect-[3/4] bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center text-muted-foreground">
          <User className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-bold opacity-60">Add photos to preview</p>
        </div>
      )}
    </div>
  );
}

// ─── Completion Bar ───────────────────────────────────────────────────────────

function CompletionBar({ percent }: { percent: number }) {
  const color = percent === 100 ? "bg-emerald-500" : percent >= 60 ? "bg-primary" : "bg-amber-500";
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-muted-foreground">Profile completion</span>
        <span className={`text-xs font-black ${percent === 100 ? "text-emerald-600" : "text-foreground"}`}>
          {percent}%{percent === 100 ? " · Discovery unlocked" : ""}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface CampusConnectProfileProps {
  onBack: () => void;
}

export function CampusConnectProfile({ onBack }: CampusConnectProfileProps) {
  const { user } = useAuth();

  // Server state
  const [serverProfile, setServerProfile] = useState<DatingProfile | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [primaryPhoto, setPrimaryPhoto] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeSection, setActiveSection] = useState<"edit" | "preview" | "privacy">("edit");

  // ── Load profile on mount ─────────────────────────────────
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoading(true);

    fetchMyDatingProfile(user.id)
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setServerProfile(data);
          setForm(profileToForm(data));
          setPhotos(data.photos ?? []);
          setPrimaryPhoto(data.primary_photo ?? null);
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user]);

  // ── Form helpers ──────────────────────────────────────────
  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  // ── Photo upload ──────────────────────────────────────────
  const handlePhotoUpload = useCallback(async (files: FileList) => {
    if (!user) return;
    const remaining = 6 - photos.length;
    if (remaining <= 0) return;
    const batch = Array.from(files).slice(0, remaining);
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of batch) {
      try {
        const url = await uploadDatingPhoto(user.id, file);
        uploaded.push(url);
      } catch (err) {
        console.error("Photo upload failed:", err);
      }
    }

    setPhotos((prev) => {
      const next = [...prev, ...uploaded];
      // Auto-set first photo as primary if none set
      if (!primaryPhoto && next.length > 0) setPrimaryPhoto(next[0]);
      return next;
    });
    setUploading(false);
  }, [user, photos.length, primaryPhoto]);

  // ── Photo delete ──────────────────────────────────────────
  const handlePhotoDelete = useCallback(async (url: string) => {
    await deleteDatingPhoto(url);
    setPhotos((prev) => {
      const next = prev.filter((p) => p !== url);
      if (primaryPhoto === url) setPrimaryPhoto(next[0] ?? null);
      return next;
    });
  }, [primaryPhoto]);

  // ── Save ──────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!user) return;
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      document.getElementById(`field-${firstErrorKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const saved = await upsertDatingProfile(user.id, {
        name: form.name.trim(),
        age: Number(form.age),
        age_preference_min: Number(form.age_preference_min) || 18,
        age_preference_max: Number(form.age_preference_max) || 26,
        gender: form.gender,
        interested_in: form.interested_in,
        college: form.college.trim() || null,
        campus: form.campus.trim() || null,
        department: form.department.trim() || null,
        course: form.course.trim() || null,
        year: form.year || null,
        bio: form.bio.trim() || null,
        height: form.height.trim() || null,
        languages: form.languages.trim() || null,
        relationship_goal: form.relationship_goal || null,
        looking_for: form.looking_for,
        interests: form.interests,
        favorite_spot: form.favorite_spot.trim() || null,
        instagram: form.instagram.trim() || null,
        spotify: form.spotify.trim() || null,
        photos,
        primary_photo: primaryPhoto,
        hide_department: form.hide_department,
        hide_course: form.hide_course,
        hide_year: form.hide_year,
        hide_online: form.hide_online,
        hide_distance: form.hide_distance,
        hide_instagram: form.hide_instagram,
        pause_discover: form.pause_discover,
      });

      setServerProfile(saved);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save. Please try again.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  }, [user, form, photos, primaryPhoto]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-center p-8">
        <div>
          <User className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
          <p className="font-bold text-foreground">Please sign in to manage your profile.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const completion = getProfileCompletion(serverProfile, photos);
  const isNew = !serverProfile;

  return (
    <div className="h-full w-full bg-background text-foreground">
      {/* ── Sticky Header ───────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display font-black text-lg text-foreground leading-tight">My Profile</h1>
              <p className="text-xs text-muted-foreground">{isNew ? "Create your profile to unlock discovery" : "Campus Connect"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Section toggle */}
            <div className="hidden sm:flex items-center border border-border rounded-xl overflow-hidden">
              {(["edit", "preview", "privacy"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveSection(s)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors capitalize ${
                    activeSection === s
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {s === "preview" ? "Preview" : s === "privacy" ? "Privacy" : "Edit"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-black hover:opacity-90 transition-all disabled:opacity-60 shadow-sm shadow-primary/20"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : saveSuccess ? "Saved!" : "Save"}
            </button>
          </div>
        </div>

        {/* Mobile section tabs */}
        <div className="sm:hidden flex border-t border-border">
          {(["edit", "preview", "privacy"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setActiveSection(s)}
              className={`flex-1 py-2 text-xs font-bold transition-colors capitalize ${
                activeSection === s ? "border-b-2 border-primary text-primary" : "text-muted-foreground"
              }`}
            >
              {s === "preview" ? "Preview" : s === "privacy" ? "Privacy" : "Edit"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* ── Completion Bar ─────────────────────────────── */}
        <CompletionBar percent={completion} />

        {/* ── Banners ────────────────────────────────────── */}
        {isNew && (
          <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm font-bold text-primary mb-0.5">Welcome to Campus Connect</p>
            <p className="text-xs text-muted-foreground">Complete all required fields (<span className="text-destructive">*</span>) and upload at least 3 photos to unlock discovery.</p>
          </div>
        )}
        {saveError && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-destructive">{saveError}</p>
          </div>
        )}

        {/* ── EDIT SECTION ────────────────────────────────── */}
        {activeSection === "edit" && (
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">

            {/* Photos column */}
            <div>
              <SectionLabel>Photos</SectionLabel>
              <p className="text-xs text-muted-foreground mb-3">
                Add at least 3 photos. Hover to remove or set as main. <span className="text-destructive font-bold">Min 3 required.</span>
              </p>
              <PhotoGrid
                photos={photos}
                primaryPhoto={primaryPhoto}
                uploading={uploading}
                onUpload={handlePhotoUpload}
                onDelete={handlePhotoDelete}
                onSetPrimary={setPrimaryPhoto}
              />
              {photos.length < 3 && (
                <p className="text-[11px] text-destructive font-semibold mt-2">
                  {3 - photos.length} more photo{3 - photos.length > 1 ? "s" : ""} needed.
                </p>
              )}
            </div>

            {/* Form column */}
            <div>

              {/* ── Basic Info ─── */}
              <SectionLabel>Basic Information</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">

                <div id="field-name">
                  <FieldLabel required>Full Name</FieldLabel>
                  <TextInput value={form.name} onChange={(v) => set("name", v)} placeholder="As it appears on your college ID" maxLength={60} />
                  <FieldError msg={errors.name} />
                </div>

                <div id="field-age">
                  <FieldLabel required>Age</FieldLabel>
                  <TextInput value={form.age} onChange={(v) => set("age", v)} placeholder="18" />
                  <FieldError msg={errors.age} />
                </div>

                <div id="field-gender">
                  <FieldLabel required>Gender</FieldLabel>
                  <SelectInput value={form.gender} onChange={(v) => set("gender", v)} options={GENDER_OPTIONS} placeholder="Select gender" />
                  <FieldError msg={errors.gender} />
                </div>

                <div id="field-interested_in">
                  <FieldLabel required>Interested In</FieldLabel>
                  <SelectInput value={form.interested_in} onChange={(v) => set("interested_in", v)} options={INTERESTED_IN_OPTIONS} placeholder="Select preference" />
                  <FieldError msg={errors.interested_in} />
                </div>

                <div>
                  <FieldLabel>Height</FieldLabel>
                  <TextInput value={form.height} onChange={(v) => set("height", v)} placeholder={`5'7" or 170 cm`} />
                </div>

                <div>
                  <FieldLabel>Languages</FieldLabel>
                  <TextInput value={form.languages} onChange={(v) => set("languages", v)} placeholder="Hindi, English" />
                </div>

              </div>

              {/* ── Education ─── */}
              <SectionLabel>Education</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">

                <div id="field-college">
                  <FieldLabel required>College</FieldLabel>
                  <TextInput value={form.college} onChange={(v) => set("college", v)} placeholder="Delhi University" />
                  <FieldError msg={errors.college} />
                </div>

                <div id="field-campus">
                  <FieldLabel required>Campus</FieldLabel>
                  <TextInput value={form.campus} onChange={(v) => set("campus", v)} placeholder="North Campus" />
                  <FieldError msg={errors.campus} />
                </div>

                <div id="field-department">
                  <FieldLabel required>Department</FieldLabel>
                  <TextInput value={form.department} onChange={(v) => set("department", v)} placeholder="Computer Science" />
                  <FieldError msg={errors.department} />
                </div>

                <div id="field-course">
                  <FieldLabel required>Course</FieldLabel>
                  <TextInput value={form.course} onChange={(v) => set("course", v)} placeholder="B.Tech" />
                  <FieldError msg={errors.course} />
                </div>

                <div id="field-year">
                  <FieldLabel required>Year</FieldLabel>
                  <SelectInput value={form.year} onChange={(v) => set("year", v)} options={YEAR_OPTIONS} placeholder="Select year" />
                  <FieldError msg={errors.year} />
                </div>

                <div>
                  <FieldLabel>Favourite Hangout Spot</FieldLabel>
                  <TextInput value={form.favorite_spot} onChange={(v) => set("favorite_spot", v)} placeholder="Library steps, Café Beans…" />
                </div>

              </div>

              {/* ── About ─── */}
              <SectionLabel>About You</SectionLabel>

              <div id="field-bio" className="mb-4">
                <FieldLabel required>Bio</FieldLabel>
                <div className="relative">
                  <textarea
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder="Tell people something interesting about yourself. Min 30 characters."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                  />
                  <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">
                    {form.bio.length}/500
                  </span>
                </div>
                <FieldError msg={errors.bio} />
              </div>

              {/* ── Intentions ─── */}
              <SectionLabel>Intentions</SectionLabel>

              <div id="field-relationship_goal" className="mb-4">
                <FieldLabel required>Relationship Goal</FieldLabel>
                <SelectInput value={form.relationship_goal} onChange={(v) => set("relationship_goal", v)} options={GOAL_OPTIONS} placeholder="Select goal" />
                <FieldError msg={errors.relationship_goal} />
              </div>

              <div id="field-looking_for" className="mb-4">
                <FieldLabel required>Looking For</FieldLabel>
                <MultiChip options={GOAL_OPTIONS} selected={form.looking_for} onChange={(v) => set("looking_for", v)} />
                <FieldError msg={errors.looking_for} />
              </div>

              {/* Age preference */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <FieldLabel>Preferred Age — Min</FieldLabel>
                  <TextInput value={form.age_preference_min} onChange={(v) => set("age_preference_min", v)} placeholder="18" />
                </div>
                <div>
                  <FieldLabel>Preferred Age — Max</FieldLabel>
                  <TextInput value={form.age_preference_max} onChange={(v) => set("age_preference_max", v)} placeholder="26" />
                </div>
              </div>

              {/* ── Interests ─── */}
              <SectionLabel>Interests</SectionLabel>
              <div id="field-interests">
                <p className="text-xs text-muted-foreground mb-3">
                  Pick at least 5. <span className="text-foreground font-bold">{form.interests.length} selected.</span>
                </p>
                <MultiChip options={INTEREST_OPTIONS} selected={form.interests} onChange={(v) => set("interests", v)} />
                <FieldError msg={errors.interests} />
              </div>

              {/* ── Social ─── */}
              <SectionLabel>Social &amp; Socials</SectionLabel>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Instagram</FieldLabel>
                  <TextInput value={form.instagram} onChange={(v) => set("instagram", v)} placeholder="@handle (optional)" />
                </div>
                <div>
                  <FieldLabel>Spotify</FieldLabel>
                  <TextInput value={form.spotify} onChange={(v) => set("spotify", v)} placeholder="Profile link (optional)" />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── PREVIEW SECTION ────────────────────────────── */}
        {activeSection === "preview" && (
          <div className="max-w-sm mx-auto">
            <p className="text-center text-sm text-muted-foreground mb-6">
              This is how your profile appears to others in Discover.
            </p>
            <ProfilePreviewCard form={form} photos={photos} primaryPhoto={primaryPhoto} />
            {photos.length >= 3 && form.name && form.gender && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Looking good! Save your profile to go live.</p>
              </div>
            )}
          </div>
        )}

        {/* ── PRIVACY SECTION ────────────────────────────── */}
        {activeSection === "privacy" && (
          <div className="max-w-xl">
            <p className="text-sm text-muted-foreground mb-6">
              Control what others see and manage your discoverability. Changes take effect immediately after saving.
            </p>

            <div className="space-y-3">
              <PrivacyToggle
                label="Hide Department"
                description="Your department won't appear on your public card."
                checked={form.hide_department}
                onChange={(v) => set("hide_department", v)}
              />
              <PrivacyToggle
                label="Hide Course"
                description="Your course won't be visible to other students."
                checked={form.hide_course}
                onChange={(v) => set("hide_course", v)}
              />
              <PrivacyToggle
                label="Hide Year"
                description="Your year of study will be hidden."
                checked={form.hide_year}
                onChange={(v) => set("hide_year", v)}
              />
              <PrivacyToggle
                label="Hide Online Status"
                description="Others won't see when you were last active."
                checked={form.hide_online}
                onChange={(v) => set("hide_online", v)}
              />
              <PrivacyToggle
                label="Hide Distance"
                description="Your approximate distance from other users won't show."
                checked={form.hide_distance}
                onChange={(v) => set("hide_distance", v)}
              />
              <PrivacyToggle
                label="Hide Instagram"
                description="Your Instagram handle won't be shared with matches."
                checked={form.hide_instagram}
                onChange={(v) => set("hide_instagram", v)}
              />

              <div className="pt-2 border-t border-border">
                <PrivacyToggle
                  label="Pause Discovery"
                  description="Your profile won't appear in Discover while paused. You can still use the app normally."
                  checked={form.pause_discover}
                  onChange={(v) => set("pause_discover", v)}
                />
              </div>

              {form.pause_discover && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5">
                  <PauseCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    Discovery is paused. Other students cannot find your profile.
                  </p>
                </div>
              )}
            </div>

            {/* Verification status */}
            <SectionLabel>Verification</SectionLabel>
            <div className="space-y-2">
              {["Verified Student", "ID Verified", "Campus Verified"].map((label) => (
                <div key={label} className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Save footer ─────────────────────────────────── */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            {isNew ? "Your profile won't be visible until you save for the first time." : `Last updated: ${serverProfile?.updated_at ? new Date(serverProfile.updated_at).toLocaleDateString() : "—"}`}
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm hover:opacity-90 transition-all disabled:opacity-60 shadow-md shadow-primary/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving changes…" : saveSuccess ? "Changes saved!" : isNew ? "Create Profile" : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}
