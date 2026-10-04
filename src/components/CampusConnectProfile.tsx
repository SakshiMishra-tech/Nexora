/**
 * CampusConnectProfile.tsx
 * Campus Connect - My Profile section.
 * Handles profile fetch, creation, editing and photo upload via Supabase.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  MapPin,
  Trash2,
  Eye,
  Settings,
  Shield,
  Heart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchMyDatingProfile,
  upsertDatingProfile,
  uploadDatingPhoto,
  deleteDatingPhoto,
} from "@/services/dating.service";
import { toast } from "sonner";
import type { DatingProfile } from "@/types/dating";
import type { UpsertDatingProfilePayload } from "@/services/dating.service";

// --- Constants ---

const INTEREST_OPTIONS = [
  "Music", "Sports", "Travel", "Food", "Movies", "Books", "Gaming", "Art",
  "Fitness", "Technology", "Photography", "Dance", "Nature", "College Life",
  "Coding", "Entrepreneurship"
];

const GENDER_OPTIONS = ["Woman", "Man", "Non-binary", "Other", "Prefer not to say"];
const INTERESTED_IN_OPTIONS = ["Women", "Men", "Everyone"];
const YEAR_OPTIONS = ["1st year", "2nd year", "3rd year", "4th year", "5th year", "Postgraduate"];

const CAROUSEL_IMAGES = [
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=2049&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
];

// --- Types ---

type FormState = {
  name: string;
  age: string;
  gender: string;
  languages: string;
  college: string;
  campus: string;
  department: string;
  course: string;
  year: string;
  interests: string[];
  bio: string;
  interested_in: string;
  age_preference_min: string;
  age_preference_max: string;
  hide_department: boolean;
  hide_course: boolean;
  hide_year: boolean;
  hide_online: boolean;
  hide_distance: boolean;
  hide_instagram: boolean;
  pause_discover: boolean;
};

type FormErrors = Partial<Record<keyof FormState | "photos", string>>;

function profileToForm(p: DatingProfile): FormState {
  return {
    name: p.name || "",
    age: p.age ? String(p.age) : "",
    gender: p.gender || "",
    languages: p.languages || "",
    college: p.college || "",
    campus: p.campus || "",
    department: p.department || "",
    course: p.course || "",
    year: p.year || "",
    interests: p.interests || [],
    bio: p.bio || "",
    interested_in: p.interested_in || "",
    age_preference_min: String(p.age_preference_min || "18"),
    age_preference_max: String(p.age_preference_max || "26"),
    hide_department: p.hide_department ?? false,
    hide_course: p.hide_course ?? false,
    hide_year: p.hide_year ?? false,
    hide_online: p.hide_online ?? false,
    hide_distance: p.hide_distance ?? false,
    hide_instagram: p.hide_instagram ?? true,
    pause_discover: p.pause_discover ?? false,
  };
}

function emptyForm(): FormState {
  return {
    name: "", age: "", gender: "", languages: "",
    college: "", campus: "", department: "", course: "", year: "",
    interests: [], bio: "",
    interested_in: "", age_preference_min: "18", age_preference_max: "26",
    hide_department: false, hide_course: false, hide_year: false,
    hide_online: false, hide_distance: false, hide_instagram: true, pause_discover: false,
  };
}

// --- Shared UI Components ---

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-bold text-foreground mb-2">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 font-bold mt-1.5">{msg}</p>;
}

function TextInput(props: any) {
  const { value, onChange, placeholder, type = "text", maxLength } = props;
  return (
    <input
      type={type}
      maxLength={maxLength}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-5 py-3.5 bg-muted/50 border-2 border-border/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-background transition-all font-medium"
    />
  );
}

function TextArea(props: any) {
  const { value, onChange, placeholder, maxLength } = props;
  return (
    <div className="relative">
      <textarea
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-5 py-4 bg-muted/50 border-2 border-border/50 rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-background transition-all font-medium min-h-[140px] resize-none"
      />
      {maxLength && (
        <span className="absolute bottom-4 right-4 text-xs font-bold text-muted-foreground">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

function SelectInput(props: any) {
  const { value, onChange, options, placeholder } = props;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-5 py-3.5 bg-muted/50 border-2 border-border/50 rounded-2xl text-foreground focus:outline-none focus:border-primary focus:bg-background transition-all font-medium appearance-none cursor-pointer ${!value ? 'text-muted-foreground' : ''}`}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((opt: string) => (
        <option key={opt} value={opt} className="text-foreground">{opt}</option>
      ))}
    </select>
  );
}

function PrivacyToggle({ label, description, checked, onChange }: any) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`w-full text-left flex items-center justify-between gap-4 p-5 rounded-3xl border-2 transition-all ${checked ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card hover:border-border/80"}`}>
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

// --- Main Profile Wizard ---

const WIZARD_STEPS = ["About You", "Photos", "Campus & Interests", "Your Story", "Preferences & Review"];

function WizardHeader({ currentStep, onBack }: { currentStep: number; onBack: () => void }) {
  return (
    <div className="flex items-start pt-6 justify-between px-6 lg:px-10 h-24 shrink-0 w-full z-10 relative">
      <div className="w-[120px] h-9 flex items-center">
         <button onClick={onBack} className="flex items-center gap-2 text-foreground/80 hover:text-foreground text-sm font-bold uppercase tracking-widest">
            <ChevronLeft className="w-4 h-4" /> Connect
         </button>
      </div>
      
      <div className="hidden lg:flex flex-1 max-w-2xl mx-auto items-start relative px-4">
         <div className="absolute top-[17px] left-[7%] right-[7%] h-[2px] bg-muted-foreground/20 -z-10" />
         <div 
           className="absolute top-[17px] left-[7%] h-[2px] bg-primary -z-10 transition-all duration-500" 
           style={{ width: `${Math.max(0, ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 86)}%` }} 
         />
         
         {WIZARD_STEPS.map((label, idx) => {
           const stepNumber = idx + 1;
           const isActive = stepNumber === currentStep;
           const isCompleted = stepNumber < currentStep;
           
           return (
              <div key={label} className="flex flex-col items-center flex-1">
                 <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors bg-background ${
                    isActive ? 'border-primary bg-primary text-primary-foreground' : 
                    isCompleted ? 'border-primary bg-primary text-primary-foreground' : 
                    'border-muted-foreground/30 text-muted-foreground'
                 }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
                 </div>
                 <span className={`text-xs mt-1.5 font-bold transition-colors ${
                    isActive ? 'text-primary' : 
                    isCompleted ? 'text-foreground' : 
                    'text-muted-foreground'
                 }`}>
                    {label}
                 </span>
              </div>
           );
         })}
      </div>
      
      <div className="w-[120px] h-9 flex items-center justify-end">
         <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
            Step {currentStep} of {WIZARD_STEPS.length}
         </span>
      </div>
    </div>
  );
}

function CampusCarousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length), 4000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="w-full h-full bg-muted rounded-[2.5rem] relative overflow-hidden">
       {CAROUSEL_IMAGES.map((img, i) => (
         <img key={img} src={img} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`} alt="Campus" />
       ))}
    </div>
  );
}

export function CampusConnectProfile({ onBack, onSaveSuccess }: { onBack: () => void, onSaveSuccess?: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [serverProfile, setServerProfile] = useState<DatingProfile | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [photos, setPhotos] = useState<string[]>([]);
  const [primaryPhoto, setPrimaryPhoto] = useState<string | null>(null);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
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

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const handleNext = () => setStep((s) => s + 1);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const basePayload: any = serverProfile ? { ...serverProfile } : {};
      delete basePayload.id;
      delete basePayload.created_at;
      delete basePayload.updated_at;

      const p: UpsertDatingProfilePayload = {
        ...basePayload,
        name: form.name,
        age: parseInt(form.age, 10),
        gender: form.gender,
        languages: form.languages,
        college: form.college,
        campus: form.campus,
        department: form.department,
        course: form.course,
        year: form.year,
        interests: form.interests,
        bio: form.bio,
        interested_in: form.interested_in,
        age_preference_min: parseInt(form.age_preference_min, 10),
        age_preference_max: parseInt(form.age_preference_max, 10),
        hide_department: form.hide_department,
        hide_course: form.hide_course,
        hide_year: form.hide_year,
        hide_online: form.hide_online,
        hide_distance: form.hide_distance,
        hide_instagram: form.hide_instagram,
        pause_discover: form.pause_discover,
        photos,
        primary_photo: primaryPhoto || (photos.length > 0 ? photos[0] : null),
        looking_for: basePayload.looking_for || [],
        height: basePayload.height || null,
        relationship_goal: basePayload.relationship_goal || null,
        favorite_spot: basePayload.favorite_spot || null,
        instagram: basePayload.instagram || null,
        spotify: basePayload.spotify || null,
      };

      await upsertDatingProfile(user.id, p);
      
      toast.success("Profile saved successfully!");
      if (onSaveSuccess) {
        onSaveSuccess();
      } else {
        onBack();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile: " + ((error as any).message || JSON.stringify(error)));
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file: File, index: number) => {
    if (!user) return;
    try {
      const url = await uploadDatingPhoto(user.id, file);
      if (!url) return;
      const newPhotos = [...photos];
      newPhotos[index] = url;
      setPhotos(newPhotos.filter(Boolean));
      if (index === 0) setPrimaryPhoto(url);
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload photo");
    }
  };

  const removePhoto = async (index: number) => {
    if (!user) return;
    const url = photos[index];
    if (!url) return;
    try {
      await deleteDatingPhoto(url);
      const newPhotos = photos.filter((_, i) => i !== index);
      setPhotos(newPhotos);
      if (index === 0) {
        setPrimaryPhoto(newPhotos.length > 0 ? newPhotos[0] : null);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete photo");
    }
  };

  if (!user || loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Step 1: About You ---
  if (step === 1) {
    const requiredFilled = !!(form.name && form.age && form.gender && form.languages);
    
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-background w-full">
         <WizardHeader currentStep={1} onBack={onBack} />
         <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full max-w-[1400px] mx-auto px-6 lg:px-10 pb-6 gap-8">
            <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col h-full py-2">
               <div className="shrink-0 mb-8">
                 <h1 className="font-display font-black text-4xl lg:text-5xl tracking-tight mb-2">Let's start with the basics</h1>
                 <p className="text-muted-foreground text-lg">Tell us who you are. This information will be displayed on your profile.</p>
               </div>
               <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                 <div>
                   <FieldLabel required>First Name</FieldLabel>
                   <TextInput value={form.name} onChange={(v: string) => set("name", v)} placeholder="e.g. Aditi" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <FieldLabel required>Age</FieldLabel>
                     <TextInput type="number" value={form.age} onChange={(v: string) => set("age", v)} placeholder="Must be 17+" />
                   </div>
                   <div>
                     <FieldLabel required>Gender</FieldLabel>
                     <SelectInput value={form.gender} onChange={(v: string) => set("gender", v)} options={GENDER_OPTIONS} placeholder="Select gender" />
                   </div>
                 </div>
                 <div>
                   <FieldLabel required>Languages</FieldLabel>
                   <TextInput value={form.languages} onChange={(v: string) => set("languages", v)} placeholder="e.g. English, Hindi" />
                 </div>
               </div>
               <div className="mt-auto pt-6 shrink-0">
                  <button onClick={handleNext} disabled={!requiredFilled || parseInt(form.age || "0") < 17} className="w-full py-4 rounded-full bg-primary text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50">
                     Next <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
            <div className="hidden lg:block lg:w-[55%] xl:w-[60%] h-full p-2">
               <CampusCarousel />
            </div>
         </div>
      </div>
    );
  }

  // --- Step 2: Photos ---
  if (step === 2) {
    const requiredFilled = photos.filter(Boolean).length >= 2;
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-background w-full">
         <WizardHeader currentStep={2} onBack={() => setStep(1)} />
         <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full max-w-[1400px] mx-auto px-6 lg:px-10 pb-6 gap-8">
            <div className="w-full lg:w-[40%] xl:w-[35%] flex flex-col h-full py-2">
               <div className="shrink-0 mb-8">
                 <h1 className="font-display font-black text-4xl lg:text-5xl tracking-tight mb-2">Show your world</h1>
                 <p className="text-muted-foreground text-lg">Add at least two photos that feel like you. Your first photo is your main profile picture.</p>
               </div>
               <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                 {/* Photo 1 */}
                 <div className="relative aspect-[3/4] w-full max-w-[280px] bg-muted rounded-3xl overflow-hidden border-2 border-border/50 group hover:border-primary/50 transition-colors">
                    {photos[0] ? (
                      <>
                        <img src={photos[0]} className="w-full h-full object-cover" alt="Primary" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button onClick={() => removePhoto(0)} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform">
                             <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                      </>
                    ) : (
                      <button onClick={() => fileInputRef1.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <div className="w-14 h-14 bg-background rounded-full shadow-sm flex items-center justify-center mb-3">
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm">Main Photo <span className="text-red-500">*</span></span>
                      </button>
                    )}
                    <input type="file" ref={fileInputRef1} hidden accept="image/*" onChange={(e) => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0], 0); }} />
                 </div>
                 
                 {/* Photo 2 */}
                 <div className="relative aspect-[3/4] w-full max-w-[280px] bg-muted rounded-3xl overflow-hidden border-2 border-border/50 group hover:border-primary/50 transition-colors">
                    {photos[1] ? (
                      <>
                        <img src={photos[1]} className="w-full h-full object-cover" alt="Secondary" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <button onClick={() => removePhoto(1)} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform">
                             <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                      </>
                    ) : (
                      <button onClick={() => fileInputRef2.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                        <div className="w-14 h-14 bg-background rounded-full shadow-sm flex items-center justify-center mb-3">
                          <Plus className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm">Second Photo <span className="text-red-500">*</span></span>
                      </button>
                    )}
                    <input type="file" ref={fileInputRef2} hidden accept="image/*" onChange={(e) => { if (e.target.files?.[0]) uploadPhoto(e.target.files[0], 1); }} />
                 </div>
               </div>
               <div className="mt-auto pt-6 shrink-0">
                  <button onClick={handleNext} disabled={!requiredFilled} className="w-full py-4 rounded-full bg-primary text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50">
                     Next <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
         </div>
      </div>
    );
  }

  // --- Step 3: Campus & Interests ---
  if (step === 3) {
    const requiredFilled = !!(form.college && form.campus && form.department && form.course && form.year) && form.interests.length > 0;
    
    const toggleInterest = (opt: string) => {
      if (form.interests.includes(opt)) set("interests", form.interests.filter(i => i !== opt));
      else if (form.interests.length < 5) set("interests", [...form.interests, opt]);
    };

    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-background w-full">
         <WizardHeader currentStep={3} onBack={() => setStep(2)} />
         <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full max-w-[1400px] mx-auto px-6 lg:px-10 pb-6 gap-8">
            {/* LEFT: Campus */}
            <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col h-full py-2 border-r border-border/50 pr-8">
               <div className="shrink-0 mb-8">
                 <h1 className="font-display font-black text-4xl tracking-tight mb-2">Where you belong & what you're into</h1>
                 <p className="text-muted-foreground text-lg">Tell us a little about your campus world and the things that make you, you.</p>
               </div>
               <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                  <div>
                    <h3 className="text-lg font-black mb-4">Your campus</h3>
                    <div className="space-y-4">
                      <div>
                        <FieldLabel required>College / University</FieldLabel>
                        <TextInput value={form.college} onChange={(v: string) => set("college", v)} placeholder="Search your college" />
                      </div>
                      <div>
                        <FieldLabel required>Campus</FieldLabel>
                        <TextInput value={form.campus} onChange={(v: string) => set("campus", v)} placeholder="Select your campus" />
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-black mb-4">Academic Details</h3>
                    <div className="space-y-4">
                      <div>
                        <FieldLabel required>Department</FieldLabel>
                        <TextInput value={form.department} onChange={(v: string) => set("department", v)} placeholder="e.g. Computer Science" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <FieldLabel required>Course / Program</FieldLabel>
                          <TextInput value={form.course} onChange={(v: string) => set("course", v)} placeholder="e.g. B.Tech" />
                        </div>
                        <div>
                          <FieldLabel required>Current Year</FieldLabel>
                          <SelectInput value={form.year} onChange={(v: string) => set("year", v)} options={YEAR_OPTIONS} placeholder="Year" />
                        </div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>

            {/* RIGHT: Interests / Vibe */}
            <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] flex-col h-full py-2 pl-4">
               {/* Editorial Visual Header */}
               <div className="w-full h-48 rounded-3xl overflow-hidden relative mb-8 shrink-0 shadow-lg">
                  <img src="https://images.unsplash.com/photo-1529070538774-1843cb1665e8?q=80&w=2070&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover" alt="Campus Life" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-white/80 font-bold text-sm tracking-wider uppercase mb-1">Discover your crowd</p>
                    <p className="text-white font-black text-2xl">Connect over shared passions.</p>
                  </div>
               </div>

               {/* Interests Vibe Selector */}
               <div className="flex-1 overflow-y-auto">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-xl font-black text-foreground">Your vibe</h3>
                   <span className="text-sm font-bold text-muted-foreground">{form.interests.length} interests selected</span>
                 </div>
                 <div className="flex flex-wrap gap-2.5 mb-8">
                   {INTEREST_OPTIONS.map((opt) => {
                     const active = form.interests.includes(opt);
                     return (
                       <button
                         key={opt}
                         type="button"
                         onClick={() => toggleInterest(opt)}
                         className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                           active ? "bg-[#4338ca] text-white shadow-lg shadow-[#4338ca]/30 scale-105 border-2 border-[#4338ca]"
                                  : "border-2 border-border/50 bg-card text-muted-foreground hover:border-[#4338ca]/40 hover:text-foreground"
                         }`}
                       >
                         {active && <Check className="w-3.5 h-3.5 inline-block mr-1.5 -ml-1" />}
                         {opt}
                       </button>
                     );
                   })}
                 </div>
               </div>

               <div className="mt-auto pt-6 shrink-0 flex justify-end">
                  <button onClick={handleNext} disabled={!requiredFilled} className="w-[300px] py-4 rounded-full bg-primary text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50">
                     Next <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
         </div>
      </div>
    );
  }

  // --- Step 4: Your Story ---
  if (step === 4) {
    const requiredFilled = form.bio.trim().length > 10;
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-background w-full">
         <WizardHeader currentStep={4} onBack={() => setStep(3)} />
         <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full max-w-[1400px] mx-auto px-6 lg:px-10 pb-6 gap-8">
            <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col h-full py-2">
               <div className="shrink-0 mb-8">
                 <h1 className="font-display font-black text-4xl lg:text-5xl tracking-tight mb-2">Tell your story</h1>
                 <p className="text-muted-foreground text-lg">A great bio helps spark better conversations.</p>
               </div>
               <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                 <div>
                   <FieldLabel required>Bio (min 10 chars)</FieldLabel>
                   <TextArea value={form.bio} onChange={(v: string) => set("bio", v)} placeholder="What makes you interesting?" maxLength={500} />
                 </div>
               </div>
               <div className="mt-auto pt-6 shrink-0">
                  <button onClick={handleNext} disabled={!requiredFilled} className="w-full py-4 rounded-full bg-primary text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50">
                     Next <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>
            <div className="hidden lg:flex lg:w-[55%] xl:w-[60%] items-center justify-center bg-muted rounded-[2.5rem] overflow-hidden">
                <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Story" />
            </div>
         </div>
      </div>
    );
  }

  // --- Step 5: Preferences & Review ---
  if (step === 5) {
    const requiredFilled = !!(form.interested_in && form.age_preference_min && form.age_preference_max);
    return (
      <div className="flex flex-col h-[100dvh] overflow-hidden bg-background w-full">
         <WizardHeader currentStep={5} onBack={() => setStep(4)} />
         <div className="flex flex-col lg:flex-row flex-1 overflow-hidden w-full max-w-[1400px] mx-auto px-6 lg:px-10 pb-6 gap-8">
            {/* Preferences */}
            <div className="w-full lg:w-[50%] flex flex-col h-full py-2 border-r border-border/50 pr-8">
               <div className="shrink-0 mb-8">
                 <h1 className="font-display font-black text-4xl lg:text-5xl tracking-tight mb-2">Final touches</h1>
                 <p className="text-muted-foreground text-lg">Who are you looking for and what do you want to share?</p>
               </div>
               <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                 <div>
                   <h3 className="text-lg font-black mb-4">Discovery Preferences</h3>
                   <div className="space-y-4">
                     <div>
                       <FieldLabel required>Interested In</FieldLabel>
                       <SelectInput value={form.interested_in} onChange={(v: string) => set("interested_in", v)} options={INTERESTED_IN_OPTIONS} placeholder="Select preference" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <FieldLabel required>Min Age</FieldLabel>
                         <TextInput type="number" value={form.age_preference_min} onChange={(v: string) => set("age_preference_min", v)} placeholder="18" />
                       </div>
                       <div>
                         <FieldLabel required>Max Age</FieldLabel>
                         <TextInput type="number" value={form.age_preference_max} onChange={(v: string) => set("age_preference_max", v)} placeholder="26" />
                       </div>
                     </div>
                   </div>
                 </div>
                 <div className="pt-4 border-t border-border/50">
                   <h3 className="text-lg font-black mb-4">Privacy Controls</h3>
                   <div className="space-y-3">
                     <PrivacyToggle label="Hide my department" checked={form.hide_department} onChange={(c: boolean) => set("hide_department", c)} />
                     <PrivacyToggle label="Hide my course year" checked={form.hide_year} onChange={(c: boolean) => set("hide_year", c)} />
                     <PrivacyToggle label="Pause discovery" description="You won't be shown to new people" checked={form.pause_discover} onChange={(c: boolean) => set("pause_discover", c)} />
                   </div>
                 </div>
               </div>
            </div>

            {/* Review & Save */}
            <div className="w-full lg:w-[50%] flex flex-col h-full py-2 pl-4">
               <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card rounded-3xl border-2 border-border shadow-sm text-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary mb-6 shadow-xl">
                    <img src={photos[0]} className="w-full h-full object-cover" alt="Profile preview" />
                  </div>
                  <h2 className="text-3xl font-black mb-1">{form.name}, {form.age}</h2>
                  <p className="text-lg font-medium text-muted-foreground mb-6">{form.course} • {form.college}</p>
                  <div className="flex flex-wrap justify-center gap-2 mb-8">
                     {form.interests.map(i => (
                       <span key={i} className="px-3 py-1 bg-primary/10 text-primary text-sm font-bold rounded-full">{i}</span>
                     ))}
                  </div>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto italic">"{form.bio.substring(0, 80)}{form.bio.length > 80 ? '...' : ''}"</p>
               </div>
               <div className="mt-auto pt-6 shrink-0">
                  <button onClick={handleSave} disabled={!requiredFilled || saving} className="w-full py-4 rounded-full bg-primary text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50">
                     {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save Profile</>}
                  </button>
               </div>
            </div>
         </div>
      </div>
    );
  }

  return null;
}
