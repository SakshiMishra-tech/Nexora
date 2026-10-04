/**
 * CampusConnectProfile.tsx
 * Campus Connect - My Profile section.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera, Check, ChevronDown, ChevronLeft, Loader2, Plus, Save, Trash2, AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fetchMyDatingProfile, upsertDatingProfile, uploadDatingPhoto, deleteDatingPhoto } from "@/services/dating.service";
import type { DatingProfile } from "@/types/dating";

const INTEREST_OPTIONS = ["Music", "Sports", "Coding", "Movies", "Anime", "Travel", "Reading", "Photography", "Fitness", "Gaming", "Dance", "Art", "Coffee", "Startups", "Design", "Cooking", "Hiking", "Yoga", "Pets", "Volunteering"];
const GOAL_OPTIONS = ["Dating", "Long Term", "Friends", "Study Partner", "Networking", "Open to Explore"];
const GENDER_OPTIONS = ["Woman", "Man", "Non-binary", "Other", "Prefer not to say"];
const INTERESTED_IN_OPTIONS = ["Women", "Men", "Everyone"];
const YEAR_OPTIONS = ["1st year", "2nd year", "3rd year", "4th year", "5th year", "Postgraduate"];

type FormState = {
  name: string; age: string; age_preference_min: string; age_preference_max: string;
  gender: string; interested_in: string; college: string; campus: string; department: string; course: string; year: string;
  bio: string; height: string; languages: string; relationship_goal: string; looking_for: string[]; interests: string[];
  favorite_spot: string; instagram: string; spotify: string;
  hide_department: boolean; hide_course: boolean; hide_year: boolean; hide_online: boolean; hide_distance: boolean; hide_instagram: boolean; pause_discover: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function profileToForm(p: DatingProfile): FormState {
  return {
    name: p.name, age: String(p.age || ""), age_preference_min: String(p.age_preference_min || "18"), age_preference_max: String(p.age_preference_max || "26"),
    gender: p.gender || "", interested_in: p.interested_in || "", college: p.college ?? "", campus: p.campus ?? "", department: p.department ?? "", course: p.course ?? "", year: p.year ?? "",
    bio: p.bio ?? "", height: p.height ?? "", languages: p.languages ?? "", relationship_goal: p.relationship_goal ?? "", looking_for: p.looking_for ?? [], interests: p.interests ?? [],
    favorite_spot: p.favorite_spot ?? "", instagram: p.instagram ?? "", spotify: p.spotify ?? "",
    hide_department: p.hide_department ?? false, hide_course: p.hide_course ?? false, hide_year: p.hide_year ?? false, hide_online: p.hide_online ?? false, hide_distance: p.hide_distance ?? false, hide_instagram: p.hide_instagram ?? true, pause_discover: p.pause_discover ?? false,
  };
}

function emptyForm(): FormState {
  return {
    name: "", age: "", age_preference_min: "18", age_preference_max: "26", gender: "", interested_in: "",
    college: "", campus: "", department: "", course: "", year: "", bio: "", height: "", languages: "", relationship_goal: "", looking_for: [], interests: [],
    favorite_spot: "", instagram: "", spotify: "",
    hide_department: false, hide_course: false, hide_year: false, hide_online: false, hide_distance: false, hide_instagram: true, pause_discover: false,
  };
}

function validateForm(form: FormState, photos: string[]): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim() || form.name.trim().length < 2) errors.name = "Full name is required.";
  const age = Number(form.age);
  if (!form.age || isNaN(age) || age < 17 || age > 60) errors.age = "Valid age is required.";
  if (!form.gender) errors.gender = "Gender is required.";
  if (!form.interested_in) errors.interested_in = "Interested in is required.";
  if (!form.college.trim()) errors.college = "College is required.";
  if (!form.campus.trim()) errors.campus = "Campus is required.";
  if (!form.department.trim()) errors.department = "Department is required.";
  if (!form.course.trim()) errors.course = "Course is required.";
  if (!form.year) errors.year = "Year is required.";
  if (!form.bio.trim() || form.bio.trim().length < 10) errors.bio = "Bio must be at least 10 characters.";
  return errors;
}

function getProfileCompletion(profile: DatingProfile | null, photos: string[]) {
  if (!profile) return 0;
  const checks = [
    photos.length >= 3,
    Boolean(profile.name?.trim()),
    Boolean(profile.age),
    Boolean(profile.gender),
    Boolean(profile.interested_in),
    Boolean(profile.college?.trim()),
    Boolean(profile.campus?.trim()),
    Boolean(profile.department?.trim()),
    Boolean(profile.course?.trim()),
    Boolean(profile.year),
    (profile.bio?.trim().length ?? 0) >= 10,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// ─── UI COMPONENTS ──────────────────────────────────────────

function SectionHeader({ title, subtitle, id }: { title: string; subtitle?: string; id?: string }) {
  return (
    <div className="mb-8 border-b border-border/50 pb-5" id={id}>
      <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="text-muted-foreground mt-2 text-sm md:text-base">{subtitle}</p>}
    </div>
  );
}

function FieldLabel({ children, required, sub }: { children: React.ReactNode; required?: boolean; sub?: string }) {
  return (
    <div className="mb-2">
      <span className="block text-sm font-bold text-foreground">
        {children}{required && <span className="text-destructive ml-1">*</span>}
      </span>
      {sub && <span className="block text-xs text-muted-foreground mt-0.5">{sub}</span>}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[12px] text-destructive font-semibold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{msg}</p>;
}

function TextInput({ value, onChange, placeholder, maxLength, disabled, type = "text" }: any) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      className="w-full rounded-2xl border-2 border-border/50 bg-muted/20 px-4 py-3 text-base font-medium text-foreground placeholder:text-muted-foreground/50 hover:border-border focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
    />
  );
}

function SelectInput({ value, onChange, options, placeholder, disabled }: any) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-2xl border-2 border-border/50 bg-muted/20 px-4 py-3 text-base font-medium text-foreground hover:border-border focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all pr-10 disabled:opacity-50"
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

function MultiChip({ options, selected, onChange, max }: any) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s: string) => s !== opt));
    } else if (!max || selected.length < max) {
      onChange([...selected, opt]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt: string) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
              active
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-105 border-2 border-primary"
                : "border-2 border-border/50 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function PrivacyToggle({ label, description, checked, onChange }: any) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full text-left flex items-center justify-between gap-4 p-5 rounded-3xl border-2 transition-all ${
        checked ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card hover:border-border/80"
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-foreground">{label}</p>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className={`w-12 h-7 rounded-full flex items-center p-1 transition-colors shrink-0 ${checked ? "bg-primary" : "bg-muted"}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </button>
  );
}

// ─── PHOTO GRID ──────────────────────────────────────────

function PhotoGrid({ photos, primaryPhoto, uploading, onUpload, onDelete, onSetPrimary }: any) {
  const fileRef = useRef<HTMLInputElement>(null);
  const maxPhotos = 6;
  const slots = [...photos, ...Array(Math.max(0, maxPhotos - photos.length)).fill(null)];

  const mainUrl = slots[0];
  const restSlots = slots.slice(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* MAIN PHOTO */}
      <div className="md:col-span-5 relative aspect-[3/4] md:aspect-auto md:h-full rounded-[2rem] overflow-hidden border-2 border-border/50 bg-muted/20 group min-h-[350px]">
        {mainUrl ? (
          <>
            <img src={mainUrl} alt="Main" className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-background/95 backdrop-blur text-foreground text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
              Main Photo
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => onDelete(mainUrl)}
                className="bg-destructive/90 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-destructive transition-colors shadow-xl"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-full flex flex-col items-center justify-center gap-4 hover:bg-primary/5 transition-colors border-2 border-dashed border-transparent hover:border-primary/30 m-1 rounded-[1.8rem]"
          >
            {uploading && photos.length === 0 ? (
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Camera className="w-10 h-10" />
                </div>
                <div className="text-center px-4">
                  <span className="block font-bold text-foreground text-lg">Add Main Photo <span className="text-destructive">*</span></span>
                  <span className="text-sm text-muted-foreground mt-1">Make a great first impression</span>
                </div>
              </>
            )}
          </button>
        )}
      </div>

      {/* SUPPORTING PHOTOS */}
      <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {restSlots.map((url, i) => {
          const isRequired = i < 2; // Slots 1 and 2 are required
          if (url) {
            const isPrimary = url === primaryPhoto;
            return (
              <div key={url} className="relative aspect-[3/4] rounded-2xl md:rounded-[1.5rem] overflow-hidden border-2 border-border/50 group bg-muted/20">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                  {!isPrimary && (
                    <button
                      type="button"
                      onClick={() => onSetPrimary(url)}
                      className="bg-white/90 text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-white transition-colors shadow-lg"
                    >
                      Make Main
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(url)}
                    className="bg-destructive/90 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-destructive transition-colors shadow-lg"
                  >
                    Remove
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
              className={`aspect-[3/4] rounded-2xl md:rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all ${
                isRequired 
                  ? "border-border bg-background hover:border-primary/40 hover:bg-primary/5" 
                  : "border-border/30 bg-muted/10 hover:border-border/80 hover:bg-muted/30"
              }`}
            >
              {uploading && i === photos.length - 1 ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <>
                  <Plus className={`w-8 h-8 ${isRequired ? "text-primary/70" : "text-muted-foreground/40"}`} />
                  {isRequired && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Required <span className="text-destructive">*</span></span>}
                </>
              )}
            </button>
          );
        })}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) onUpload(e.target.files);
          if (fileRef.current) fileRef.current.value = "";
        }}
      />
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────

export function CampusConnectProfile({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [serverProfile, setServerProfile] = useState<DatingProfile | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [primaryPhoto, setPrimaryPhoto] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);

    fetchMyDatingProfile(user.id).then((data) => {
      if (cancelled) return;
      if (data) {
        setServerProfile(data);
        setForm(profileToForm(data));
        setPhotos(data.photos ?? []);
        setPrimaryPhoto(data.primary_photo ?? null);
      }
    }).catch(console.error).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [user]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

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
      if (!primaryPhoto && next.length > 0) setPrimaryPhoto(next[0]);
      return next;
    });
    setUploading(false);
  }, [user, photos.length, primaryPhoto]);

  const handlePhotoDelete = useCallback(async (url: string) => {
    await deleteDatingPhoto(url);
    setPhotos((prev) => {
      const next = prev.filter((p) => p !== url);
      if (primaryPhoto === url) setPrimaryPhoto(next[0] ?? null);
      return next;
    });
  }, [primaryPhoto]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    
    const validationErrors = validateForm(form, photos);
    if (Object.keys(validationErrors).length > 0 || photos.length < 3) {
      setErrors(validationErrors);
      const firstErrorKey = Object.keys(validationErrors)[0] || "photos";
      document.getElementById(`section-${firstErrorKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSaving(true);
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
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [user, form, photos, primaryPhoto]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col bg-background">
        <div className="border-b border-border p-4">
          <button onClick={onBack} className="flex items-center gap-2 text-foreground/80 hover:text-foreground text-sm font-bold uppercase"><ChevronLeft className="w-4 h-4"/> Connect</button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const completion = getProfileCompletion(serverProfile, photos);

  return (
    <div className="min-h-screen bg-background text-foreground pb-40">
      
      {/* ── Fixed Header ── */}
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors text-sm font-bold tracking-widest uppercase group">
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Connect
          </button>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <span className="font-bold text-muted-foreground">Profile Strength</span>
              <span className={`font-black ${completion === 100 ? "text-emerald-500" : "text-foreground"}`}>{completion}%</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded-full text-sm font-bold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4" /> : null}
              {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Profile"}
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-1 bg-muted">
          <div className={`h-full transition-all duration-700 ${completion === 100 ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        
        <div className="mb-16">
          <h1 className="font-display font-black text-4xl md:text-6xl text-foreground leading-tight tracking-tight mb-4">
            Create your Campus Connect identity
          </h1>
          <p className="text-lg text-muted-foreground font-medium flex items-center gap-2">
            <span className="text-destructive font-black text-xl">*</span> Indicates required fields
          </p>
        </div>

        <div className="space-y-24">
          
          {/* ── PHOTOS ── */}
          <div id="section-photos">
            <SectionHeader title="Show your best side" subtitle="Add photos that help people get a feel for who you are." />
            <PhotoGrid photos={photos} primaryPhoto={primaryPhoto} uploading={uploading} onUpload={handlePhotoUpload} onDelete={handlePhotoDelete} onSetPrimary={setPrimaryPhoto} />
            {photos.length > 0 && photos.length < 3 && <FieldError msg={`${3 - photos.length} more photo${3 - photos.length > 1 ? "s" : ""} required to complete your profile.`} />}
          </div>

          {/* ── ABOUT YOU ── */}
          <div id="section-name">
            <SectionHeader title="About you" subtitle="The essentials." />
            <div className="grid gap-6 md:grid-cols-2">
              <div id="section-name">
                <FieldLabel required>Full Name</FieldLabel>
                <TextInput value={form.name} onChange={(v: string) => set("name", v)} placeholder="As it appears on your college ID" />
                <FieldError msg={errors.name} />
              </div>
              <div id="section-age">
                <FieldLabel required>Age</FieldLabel>
                <TextInput type="number" value={form.age} onChange={(v: string) => set("age", v)} placeholder="18" />
                <FieldError msg={errors.age} />
              </div>
              <div id="section-gender" className="md:col-span-2">
                <FieldLabel required>Gender</FieldLabel>
                <MultiChip options={GENDER_OPTIONS} selected={form.gender ? [form.gender] : []} onChange={(v: string[]) => set("gender", v[0] || "")} max={1} />
                <FieldError msg={errors.gender} />
              </div>
            </div>
          </div>

          {/* ── LOOKING FOR ── */}
          <div id="section-interested_in">
            <SectionHeader title="What brings you here?" subtitle="Help us find the right connections for you." />
            <div className="space-y-10">
              <div>
                <FieldLabel required>Interested In</FieldLabel>
                <MultiChip options={INTERESTED_IN_OPTIONS} selected={form.interested_in ? [form.interested_in] : []} onChange={(v: string[]) => set("interested_in", v[0] || "")} max={1} />
                <FieldError msg={errors.interested_in} />
              </div>
              
              <div>
                <FieldLabel>Relationship Goal</FieldLabel>
                <MultiChip options={GOAL_OPTIONS} selected={form.relationship_goal ? [form.relationship_goal] : []} onChange={(v: string[]) => set("relationship_goal", v[0] || "")} max={1} />
              </div>

              <div>
                <FieldLabel>Looking For (Select multiple)</FieldLabel>
                <MultiChip options={GOAL_OPTIONS} selected={form.looking_for} onChange={(v: string[]) => set("looking_for", v)} />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <FieldLabel>Preferred Age Range (Min)</FieldLabel>
                  <TextInput type="number" value={form.age_preference_min} onChange={(v: string) => set("age_preference_min", v)} placeholder="18" />
                </div>
                <div>
                  <FieldLabel>Preferred Age Range (Max)</FieldLabel>
                  <TextInput type="number" value={form.age_preference_max} onChange={(v: string) => set("age_preference_max", v)} placeholder="26" />
                </div>
              </div>
            </div>
          </div>

          {/* ── CAMPUS LIFE ── */}
          <div id="section-college">
            <SectionHeader title="Your campus life" subtitle="Connect with students near you." />
            <div className="grid gap-6 md:grid-cols-2">
              <div id="section-college" className="md:col-span-2">
                <FieldLabel required>College</FieldLabel>
                <TextInput value={form.college} onChange={(v: string) => set("college", v)} placeholder="Delhi University" />
                <FieldError msg={errors.college} />
              </div>
              <div id="section-campus">
                <FieldLabel required>Campus / Location</FieldLabel>
                <TextInput value={form.campus} onChange={(v: string) => set("campus", v)} placeholder="North Campus" />
                <FieldError msg={errors.campus} />
              </div>
              <div id="section-department">
                <FieldLabel required>Department / Branch</FieldLabel>
                <TextInput value={form.department} onChange={(v: string) => set("department", v)} placeholder="Computer Science" />
                <FieldError msg={errors.department} />
              </div>
              <div id="section-course">
                <FieldLabel required>Course</FieldLabel>
                <TextInput value={form.course} onChange={(v: string) => set("course", v)} placeholder="B.Tech" />
                <FieldError msg={errors.course} />
              </div>
              <div id="section-year">
                <FieldLabel required>Semester / Year</FieldLabel>
                <SelectInput value={form.year} onChange={(v: string) => set("year", v)} options={YEAR_OPTIONS} placeholder="Select year" />
                <FieldError msg={errors.year} />
              </div>
            </div>
          </div>

          {/* ── YOUR STORY ── */}
          <div id="section-bio">
            <SectionHeader title="Tell people about you" subtitle="Let your personality shine." />
            <div className="space-y-10">
              <div>
                <FieldLabel required sub="Minimum 10 characters">Short Bio</FieldLabel>
                <div className="relative">
                  <textarea
                    value={form.bio}
                    onChange={(e) => set("bio", e.target.value)}
                    rows={5}
                    maxLength={500}
                    placeholder="Tell people something genuine about yourself..."
                    className="w-full rounded-3xl border-2 border-border/50 bg-muted/20 p-5 text-base font-medium text-foreground placeholder:text-muted-foreground/50 hover:border-border focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  />
                  <span className="absolute bottom-5 right-5 text-xs font-bold text-muted-foreground">
                    {form.bio.length}/500
                  </span>
                </div>
                <FieldError msg={errors.bio} />
              </div>

              <div>
                <FieldLabel sub="Select up to 10">Interests & Hobbies</FieldLabel>
                <MultiChip options={INTEREST_OPTIONS} selected={form.interests} onChange={(v: string[]) => set("interests", v)} max={10} />
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>Favorite Hangout Spot</FieldLabel>
                  <TextInput value={form.favorite_spot} onChange={(v: string) => set("favorite_spot", v)} placeholder="Library steps, Café Beans…" />
                </div>
              </div>
            </div>
          </div>

          {/* ── PERSONAL DETAILS ── */}
          <div>
            <SectionHeader title="Personal details" subtitle="Add more flavor to your profile." />
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <FieldLabel>Height</FieldLabel>
                <TextInput value={form.height} onChange={(v: string) => set("height", v)} placeholder="5'7" or 170 cm" />
              </div>
              <div>
                <FieldLabel>Languages Spoken</FieldLabel>
                <TextInput value={form.languages} onChange={(v: string) => set("languages", v)} placeholder="Hindi, English..." />
              </div>
              <div>
                <FieldLabel>Instagram Handle</FieldLabel>
                <TextInput value={form.instagram} onChange={(v: string) => set("instagram", v)} placeholder="@username" />
              </div>
              <div>
                <FieldLabel>Spotify Profile URL</FieldLabel>
                <TextInput value={form.spotify} onChange={(v: string) => set("spotify", v)} placeholder="https://open.spotify.com/..." />
              </div>
            </div>
          </div>

          {/* ── DISCOVERY & PRIVACY ── */}
          <div>
            <SectionHeader title="Discovery & Privacy" subtitle="Control how your profile appears to other Campus Connect users." />
            <div className="space-y-4">
              <PrivacyToggle label="Hide Department" description="Your department won't appear on your public card." checked={form.hide_department} onChange={(v: boolean) => set("hide_department", v)} />
              <PrivacyToggle label="Hide Course" description="Your course won't be visible to other students." checked={form.hide_course} onChange={(v: boolean) => set("hide_course", v)} />
              <PrivacyToggle label="Hide Year" description="Your year of study will be hidden." checked={form.hide_year} onChange={(v: boolean) => set("hide_year", v)} />
              <PrivacyToggle label="Hide Online Status" description="Others won't see when you were last active." checked={form.hide_online} onChange={(v: boolean) => set("hide_online", v)} />
              <PrivacyToggle label="Hide Distance" description="Your approximate distance from other users won't show." checked={form.hide_distance} onChange={(v: boolean) => set("hide_distance", v)} />
              <PrivacyToggle label="Hide Instagram" description="Your Instagram handle won't be shared with matches." checked={form.hide_instagram} onChange={(v: boolean) => set("hide_instagram", v)} />
              <div className="pt-6 mt-6 border-t border-border/50">
                <PrivacyToggle label="Pause Discovery" description="Your profile won't appear in Discover while paused. You can still use the app normally." checked={form.pause_discover} onChange={(v: boolean) => set("pause_discover", v)} />
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
