import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Camera,
  Check,
  Crop,
  EyeOff,
  Flag,
  Gift,
  Heart,
  Image as ImageIcon,
  ImagePlus,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Mic,
  Reply,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import student1 from "@/assets/student-1.jpg";
import student2 from "@/assets/student-2.jpg";
import student3 from "@/assets/student-3.jpg";

export const Route = createFileRoute("/dating")({
  head: () => ({ meta: [{ title: "Nexora - Campus Connect" }] }),
  component: Dating,
});

type ConnectProfile = {
  id: string;
  name: string;
  age: number;
  agePreferenceMin: number;
  agePreferenceMax: number;
  gender: string;
  interestedIn: string;
  college: string;
  campus: string;
  department: string;
  course: string;
  year: string;
  bio: string;
  height: string;
  languages: string;
  relationshipGoal: string;
  lookingFor: string[];
  interests: string[];
  favoriteSpot: string;
  instagram: string;
  spotify: string;
  photos: string[];
  primaryPhoto: string;
  hideDepartment: boolean;
  hideCourse: boolean;
  hideYear: boolean;
  hideOnline: boolean;
  hideDistance: boolean;
  hideInstagram: boolean;
  pauseDiscover: boolean;
};

type PublicProfile = {
  id: string;
  name: string;
  age: number;
  gender: string;
  interestedIn: string;
  image: string;
  photos: string[];
  course: string;
  department: string;
  year: string;
  campus: string;
  distance: string;
  online: boolean;
  recentlyActive: boolean;
  newThisWeek: boolean;
  verified: boolean;
  bio: string;
  interests: string[];
  relationshipGoal: string;
  lookingFor: string[];
  languages: string[];
  match: number;
  lifestyle: string;
  verificationBadges: string[];
  likedMe?: boolean;
};

type Tab = "discover" | "matches" | "chat" | "profile" | "safety";

const interestOptions = ["Music", "Sports", "Coding", "Movies", "Anime", "Travel", "Reading", "Photography", "Fitness", "Gaming", "Dance", "Art", "Coffee", "Startups", "Design"];
const goalOptions = ["Dating", "Long Term", "Friends", "Study Partner", "Networking", "Open to Explore"];
const reportReasons = ["Fake Profile", "Spam", "Harassment", "Inappropriate Images", "Abusive Language", "Scam", "Underage"];
const ageFilterOptions = ["Any", "18-20", "21-23", "24+"];
const distanceFilterOptions = ["Any", "Within 1 km", "Within 2 km", "Within 5 km"];

const seedProfiles: PublicProfile[] = [
  {
    id: "aisha",
    name: "Aisha",
    age: 21,
    gender: "Woman",
    interestedIn: "Men",
    image: student1,
    photos: [student1, student2, student3],
    course: "B.Tech",
    department: "CSE",
    year: "3rd year",
    campus: "North Campus",
    distance: "0.8 km",
    online: true,
    recentlyActive: true,
    newThisWeek: false,
    verified: true,
    bio: "Coffee, hackathons, indie playlists, and campus walks after labs.",
    interests: ["Coding", "Music", "Coffee", "Startups", "Photography"],
    relationshipGoal: "Long Term",
    lookingFor: ["Dating", "Study Partner"],
    languages: ["Hindi", "English"],
    match: 94,
    lifestyle: "Active in clubs",
    verificationBadges: ["Verified Student", "ID Verified", "Campus Verified"],
    likedMe: true,
  },
  {
    id: "rohan",
    name: "Rohan",
    age: 22,
    gender: "Man",
    interestedIn: "Women",
    image: student2,
    photos: [student2, student1, student3],
    course: "BBA",
    department: "Marketing",
    year: "2nd year",
    campus: "North Campus",
    distance: "1.4 km",
    online: false,
    recentlyActive: true,
    newThisWeek: true,
    verified: true,
    bio: "Basketball, startups, open mics and finding the best campus food.",
    interests: ["Sports", "Startups", "Music", "Travel", "Movies"],
    relationshipGoal: "Open to Explore",
    lookingFor: ["Friends", "Dating"],
    languages: ["English", "Punjabi"],
    match: 87,
    lifestyle: "Sports and open mics",
    verificationBadges: ["Verified Student", "ID Verified", "Campus Verified"],
  },
  {
    id: "priya",
    name: "Priya",
    age: 20,
    gender: "Woman",
    interestedIn: "Everyone",
    image: student3,
    photos: [student3, student1, student2],
    course: "Design",
    department: "Visual Design",
    year: "2nd year",
    campus: "South Campus",
    distance: "2.1 km",
    online: true,
    recentlyActive: true,
    newThisWeek: true,
    verified: true,
    bio: "Photography, zines, late studio nights and very specific playlists.",
    interests: ["Photography", "Art", "Design", "Reading", "Music"],
    relationshipGoal: "Friends",
    lookingFor: ["Friends", "Networking"],
    languages: ["Hindi", "English", "Gujarati"],
    match: 82,
    lifestyle: "Studio nights",
    verificationBadges: ["Verified Student", "ID Verified", "Campus Verified"],
  },
];

const emptyProfile: ConnectProfile = {
  id: "me",
  name: "",
  age: 18,
  agePreferenceMin: 18,
  agePreferenceMax: 26,
  gender: "",
  interestedIn: "",
  college: "",
  campus: "",
  department: "",
  course: "",
  year: "",
  bio: "",
  height: "",
  languages: "",
  relationshipGoal: "",
  lookingFor: [],
  interests: [],
  favoriteSpot: "",
  instagram: "",
  spotify: "",
  photos: [],
  primaryPhoto: "",
  hideDepartment: false,
  hideCourse: false,
  hideYear: false,
  hideOnline: false,
  hideDistance: false,
  hideInstagram: true,
  pauseDiscover: false,
};

function Dating() {
  const [profile, setProfile] = useState<ConnectProfile>(emptyProfile);
  const [activeTab, setActiveTab] = useState<Tab>("discover");
  const [query, setQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("Any");
  const [goalFilter, setGoalFilter] = useState("Any");
  const [ageFilter, setAgeFilter] = useState("Any");
  const [departmentFilter, setDepartmentFilter] = useState("Any");
  const [courseFilter, setCourseFilter] = useState("Any");
  const [yearFilter, setYearFilter] = useState("Any");
  const [interestFilter, setInterestFilter] = useState("Any");
  const [activityFilter, setActivityFilter] = useState("Any");
  const [distanceFilter, setDistanceFilter] = useState("Any");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [liked, setLiked] = useState<string[]>([]);
  const [passed, setPassed] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [matches, setMatches] = useState<string[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(["Profile verification pending.", "Complete profile to unlock discovery."]);
  const [reporting, setReporting] = useState<PublicProfile | null>(null);
  const completion = getCompletion(profile);
  const isComplete = completion.percent === 100;

  const discoverProfiles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return seedProfiles
      .filter((person) => !passed.includes(person.id))
      .filter((person) => !verifiedOnly || person.verified)
      .filter((person) => genderFilter === "Any" || person.gender === genderFilter)
      .filter((person) => goalFilter === "Any" || person.lookingFor.includes(goalFilter) || person.relationshipGoal === goalFilter)
      .filter((person) => matchesAgeFilter(person.age, ageFilter))
      .filter((person) => departmentFilter === "Any" || person.department === departmentFilter)
      .filter((person) => courseFilter === "Any" || person.course === courseFilter)
      .filter((person) => yearFilter === "Any" || person.year === yearFilter)
      .filter((person) => interestFilter === "Any" || person.interests.includes(interestFilter))
      .filter((person) => matchesActivityFilter(person, activityFilter))
      .filter((person) => matchesDistanceFilter(person.distance, distanceFilter))
      .filter((person) => {
        if (!normalized) return true;
        return [person.name, person.department, person.course, person.campus, person.bio, person.interests.join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .map((person) => ({ ...person, match: calculateMatch(profile, person) }))
      .sort((a, b) => b.match - a.match);
  }, [activityFilter, ageFilter, courseFilter, departmentFilter, distanceFilter, genderFilter, goalFilter, interestFilter, passed, profile, query, verifiedOnly, yearFilter]);

  const matchedProfiles = seedProfiles.filter((person) => matches.includes(person.id));
  const selectedChatProfile = matchedProfiles.find((person) => person.id === selectedChat) ?? matchedProfiles[0];

  const updateProfile = <Key extends keyof ConnectProfile>(key: Key, value: ConnectProfile[Key]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const notify = (message: string) => setNotifications((current) => [message, ...current].slice(0, 5));

  const sendLike = (person: PublicProfile) => {
    if (!isComplete) {
      setActiveTab("profile");
      notify("Complete your profile before sending interests.");
      return;
    }
    setLiked((current) => current.includes(person.id) ? current : [...current, person.id]);
    notify(`Interest sent to ${person.name}.`);
    if (person.likedMe) {
      setMatches((current) => current.includes(person.id) ? current : [...current, person.id]);
      setActiveTab("matches");
      notify(`It's a match with ${person.name}. Chat unlocked.`);
    }
  };

  return (
    <ModuleAccessBoundary moduleId="campus-connect">
      <CampusPageShell
        label="Campus Connect"
        title="Verified campus dating, without random noise."
        subtitle="A respectful student-only space with profile-first discovery, mutual matches, and campus safety controls."
        icon={Heart}
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {["Verified students only", "Profile required before discovery", "Report and block controls"].map((item) => (
            <div key={item} className="flex items-center gap-2 border border-border bg-card p-3 text-sm font-black shadow-soft">
              <ShieldCheck className="h-4 w-4 text-success" />
              {item}
            </div>
          ))}
        </div>

        {!isComplete && (
          <ProfileGate completion={completion} onCreate={() => setActiveTab("profile")} />
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {([
            ["discover", "Discover"],
            ["matches", `Matches (${matches.length})`],
            ["chat", "Chat"],
            ["profile", "My Profile"],
            ["safety", "Safety"],
          ] as Array<[Tab, string]>).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                activeTab === tab ? "bg-foreground text-background shadow-soft" : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <ProfileBuilder profile={profile} completion={completion} onChange={updateProfile} onNotify={notify} />
        )}

        {activeTab === "discover" && (
          <LockedSection locked={!isComplete} onUnlock={() => setActiveTab("profile")}>
            <DiscoverToolbar
              query={query}
              onQueryChange={setQuery}
              genderFilter={genderFilter}
              onGenderFilterChange={setGenderFilter}
              goalFilter={goalFilter}
              onGoalFilterChange={setGoalFilter}
              ageFilter={ageFilter}
              onAgeFilterChange={setAgeFilter}
              departmentFilter={departmentFilter}
              onDepartmentFilterChange={setDepartmentFilter}
              courseFilter={courseFilter}
              onCourseFilterChange={setCourseFilter}
              yearFilter={yearFilter}
              onYearFilterChange={setYearFilter}
              interestFilter={interestFilter}
              onInterestFilterChange={setInterestFilter}
              activityFilter={activityFilter}
              onActivityFilterChange={setActivityFilter}
              distanceFilter={distanceFilter}
              onDistanceFilterChange={setDistanceFilter}
              verifiedOnly={verifiedOnly}
              onVerifiedOnlyChange={setVerifiedOnly}
              notificationCount={notifications.length}
            />
            <div className="grid gap-4 md:grid-cols-3">
              {discoverProfiles.map((person) => (
                <ProfileCard
                  key={person.id}
                  person={person}
                  liked={liked.includes(person.id)}
                  saved={saved.includes(person.id)}
                  onLike={() => sendLike(person)}
                  onPass={() => setPassed((current) => [...current, person.id])}
                  onSave={() => setSaved((current) => current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id])}
                  onReport={() => setReporting(person)}
                />
              ))}
            </div>
          </LockedSection>
        )}

        {activeTab === "matches" && (
          <LockedSection locked={!isComplete} onUnlock={() => setActiveTab("profile")}>
            <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <div className="grid gap-4 md:grid-cols-2">
                {matchedProfiles.length ? matchedProfiles.map((person) => (
                  <MatchCard key={person.id} person={person} onChat={() => { setSelectedChat(person.id); setActiveTab("chat"); }} />
                )) : (
                  <EmptyState title="No matches yet" text="Send interests. Chat unlocks only when both students like each other." />
                )}
              </div>
              <NotificationsPanel notifications={notifications} />
            </section>
          </LockedSection>
        )}

        {activeTab === "chat" && (
          <LockedSection locked={!isComplete || matchedProfiles.length === 0} onUnlock={() => setActiveTab(isComplete ? "matches" : "profile")}>
            {selectedChatProfile ? <ChatPanel person={selectedChatProfile} onReport={() => setReporting(selectedChatProfile)} /> : <EmptyState title="Chat locked" text="Match with someone first to unlock messages." />}
          </LockedSection>
        )}

        {activeTab === "safety" && <SafetyPanel />}

        {reporting && (
          <ReportModal person={reporting} onClose={() => setReporting(null)} onSubmit={(reason) => {
            notify(`Report submitted for review: ${reason}.`);
            setReporting(null);
          }} />
        )}
      </CampusPageShell>
    </ModuleAccessBoundary>
  );
}

function ProfileGate({ completion, onCreate }: { completion: ReturnType<typeof getCompletion>; onCreate: () => void }) {
  return (
    <section className="mb-4 border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-destructive">Discovery locked</p>
          <h2 className="font-display text-3xl font-black">Complete your profile to start discovering verified students.</h2>
          <p className="mt-2 text-sm font-semibold text-muted-foreground">Browsing and sending interests unlock only at 100% completion.</p>
        </div>
        <div className="grid h-24 w-24 place-items-center rounded-full bg-destructive/10 text-2xl font-black text-destructive">{completion.percent}%</div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-destructive" style={{ width: `${completion.percent}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {completion.missing.map((item) => <span key={item} className="bg-secondary px-2 py-1 text-xs font-black text-muted-foreground">{item}</span>)}
      </div>
      <button type="button" onClick={onCreate} className="mt-4 inline-flex items-center gap-2 bg-foreground px-4 py-3 text-sm font-black text-background">
        <Lock className="h-4 w-4" />
        Create profile
      </button>
    </section>
  );
}

function ProfileBuilder({ profile, completion, onChange, onNotify }: {
  profile: ConnectProfile;
  completion: ReturnType<typeof getCompletion>;
  onChange: <Key extends keyof ConnectProfile>(key: Key, value: ConnectProfile[Key]) => void;
  onNotify: (message: string) => void;
}) {
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, 6 - profile.photos.length);
    const urls = files.map((file) => URL.createObjectURL(file));
    const nextPhotos = [...profile.photos, ...urls].slice(0, 6);
    onChange("photos", nextPhotos);
    if (!profile.primaryPhoto && nextPhotos[0]) onChange("primaryPhoto", nextPhotos[0]);
  };

  const movePhoto = (from: number, to: number) => {
    if (to < 0 || to >= profile.photos.length) return;
    const next = [...profile.photos];
    const [photo] = next.splice(from, 1);
    next.splice(to, 0, photo);
    onChange("photos", next);
  };

  return (
    <section className="border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <p className="text-xs font-black uppercase text-destructive">Mandatory profile creation</p>
          <h2 className="font-display text-3xl font-black">My Campus Connect profile</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">Minimum 3 photos and all required details are needed before going public.</p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-black text-primary">{completion.percent}% complete</span>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[380px_1fr]">
        <section className="rounded-3xl border border-border bg-background p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-muted-foreground">Profile photos</h3>
            <span className="text-xs font-black text-destructive">{profile.photos.length}/6</span>
          </div>
          <label className="mt-3 grid min-h-28 cursor-pointer place-items-center rounded-3xl border border-dashed border-border bg-card p-4 text-center">
            <ImagePlus className="h-8 w-8 text-primary" />
            <span className="mt-2 text-sm font-black">Upload photos</span>
            <span className="text-xs font-bold text-muted-foreground">Minimum 3, maximum 6</span>
            <input className="hidden" type="file" accept="image/*" multiple onChange={handlePhotoUpload} />
          </label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {profile.photos.map((photo, index) => (
              <div key={photo} className="relative">
                <img src={photo} alt="" className="aspect-square w-full rounded-2xl object-cover" />
                {profile.primaryPhoto === photo && <span className="absolute left-1 top-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-black text-success">Primary</span>}
                <div className="absolute bottom-1 right-1 flex flex-wrap justify-end gap-1">
                  <button type="button" onClick={() => movePhoto(index, index - 1)} className="grid h-6 w-6 place-items-center rounded-full bg-background text-muted-foreground"><ArrowLeft className="h-3 w-3" /></button>
                  <button type="button" onClick={() => movePhoto(index, index + 1)} className="grid h-6 w-6 place-items-center rounded-full bg-background text-muted-foreground"><ArrowRight className="h-3 w-3" /></button>
                  <button type="button" onClick={() => onNotify("Crop preview ready. Final cropping can connect to the media service later.")} className="grid h-6 w-6 place-items-center rounded-full bg-background text-primary"><Crop className="h-3 w-3" /></button>
                  <button type="button" onClick={() => onChange("primaryPhoto", photo)} className="grid h-6 w-6 place-items-center rounded-full bg-background text-primary"><Star className="h-3 w-3" /></button>
                  <button type="button" onClick={() => {
                    const next = profile.photos.filter((item) => item !== photo);
                    onChange("photos", next);
                    if (profile.primaryPhoto === photo) onChange("primaryPhoto", next[0] ?? "");
                  }} className="grid h-6 w-6 place-items-center rounded-full bg-background text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
                <span className="absolute right-1 top-1 rounded-full bg-foreground/70 px-1.5 py-0.5 text-[10px] font-black text-background">{index + 1}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4">
          <FormSection title="Basic Details">
            <TextField label="Full Name" value={profile.name} onChange={(value) => onChange("name", value)} />
            <NumberField label="Age" value={profile.age} onChange={(value) => onChange("age", value)} />
            <SelectField label="Gender" value={profile.gender} options={["", "Woman", "Man", "Non-binary", "Other"]} onChange={(value) => onChange("gender", value)} />
            <SelectField label="Interested In" value={profile.interestedIn} options={["", "Women", "Men", "Everyone"]} onChange={(value) => onChange("interestedIn", value)} />
            <TextField label="Height" value={profile.height} placeholder="5'7" onChange={(value) => onChange("height", value)} />
            <TextField label="Languages" value={profile.languages} placeholder="Hindi, English" onChange={(value) => onChange("languages", value)} />
            <NumberField label="Preferred Age Min" value={profile.agePreferenceMin} onChange={(value) => onChange("agePreferenceMin", value)} />
            <NumberField label="Preferred Age Max" value={profile.agePreferenceMax} onChange={(value) => onChange("agePreferenceMax", value)} />
          </FormSection>

          <FormSection title="Education">
            <TextField label="College" value={profile.college} onChange={(value) => onChange("college", value)} />
            <TextField label="Campus" value={profile.campus} onChange={(value) => onChange("campus", value)} />
            <TextField label="Department" value={profile.department} onChange={(value) => onChange("department", value)} />
            <TextField label="Course" value={profile.course} onChange={(value) => onChange("course", value)} />
            <TextField label="Year" value={profile.year} placeholder="2nd year" onChange={(value) => onChange("year", value)} />
            <TextField label="Favorite Hangout Spot" value={profile.favoriteSpot} placeholder="Library steps, Cafe Beans..." onChange={(value) => onChange("favoriteSpot", value)} />
          </FormSection>

          <FormSection title="Intentions">
            <SelectField label="Relationship Goal" value={profile.relationshipGoal} options={["", ...goalOptions]} onChange={(value) => onChange("relationshipGoal", value)} />
            <MultiChoice label="Looking For" values={profile.lookingFor} options={goalOptions} min={1} onChange={(values) => onChange("lookingFor", values)} />
            <MultiChoice label="Interests (minimum 5)" values={profile.interests} options={interestOptions} min={5} onChange={(values) => onChange("interests", values)} />
          </FormSection>

          <FormSection title="Bio and Social">
            <label className="sm:col-span-2">
              <span className="text-xs font-black uppercase text-muted-foreground">Bio</span>
              <textarea value={profile.bio} onChange={(event) => onChange("bio", event.target.value)} rows={5} className="mt-2 w-full rounded-2xl border border-border bg-background p-3 text-sm font-bold outline-none transition focus:border-primary" />
            </label>
            <TextField label="Instagram (optional)" value={profile.instagram} onChange={(value) => onChange("instagram", value)} />
            <TextField label="Spotify (optional)" value={profile.spotify} onChange={(value) => onChange("spotify", value)} />
          </FormSection>

          <FormSection title="Privacy">
            {([
              ["hideDepartment", "Hide Department"],
              ["hideCourse", "Hide Course"],
              ["hideYear", "Hide Exact Year"],
              ["hideOnline", "Hide Online Status"],
              ["hideDistance", "Hide Distance"],
              ["hideInstagram", "Hide Instagram"],
              ["pauseDiscover", "Pause Discoverability"],
            ] as Array<[keyof ConnectProfile, string]>).map(([key, label]) => (
              <ToggleRow key={key} label={label} checked={Boolean(profile[key])} onChange={(value) => onChange(key, value as never)} />
            ))}
          </FormSection>

          <FormSection title="Verification and Settings">
            {["Verified Student", "ID Verified", "Campus Verified"].map((label) => (
              <div key={label} className="flex min-h-12 items-center gap-2 rounded-2xl border border-success/20 bg-success/10 px-3 text-sm font-black text-success">
                <BadgeCheck className="h-4 w-4" />
                {label}
              </div>
            ))}
            {["Notification Settings", "Blocked Users", "Hidden Users", "Pause Profile", "Delete Account"].map((label) => (
              <button key={label} type="button" className="flex min-h-12 items-center justify-between rounded-2xl border border-border bg-card px-3 text-sm font-black text-muted-foreground">
                {label}
                <MoreHorizontal className="h-4 w-4" />
              </button>
            ))}
          </FormSection>

          <button
            type="button"
            onClick={() => onNotify(completion.percent === 100 ? "Profile complete. Discover unlocked." : "Complete missing items before going public.")}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-black text-background shadow-soft"
          >
            <Check className="h-4 w-4" />
            Save Profile
          </button>
        </div>
      </div>
    </section>
  );
}

function DiscoverToolbar(props: {
  query: string;
  onQueryChange: (value: string) => void;
  genderFilter: string;
  onGenderFilterChange: (value: string) => void;
  goalFilter: string;
  onGoalFilterChange: (value: string) => void;
  ageFilter: string;
  onAgeFilterChange: (value: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (value: string) => void;
  courseFilter: string;
  onCourseFilterChange: (value: string) => void;
  yearFilter: string;
  onYearFilterChange: (value: string) => void;
  interestFilter: string;
  onInterestFilterChange: (value: string) => void;
  activityFilter: string;
  onActivityFilterChange: (value: string) => void;
  distanceFilter: string;
  onDistanceFilterChange: (value: string) => void;
  verifiedOnly: boolean;
  onVerifiedOnlyChange: (value: boolean) => void;
  notificationCount: number;
}) {
  const departments = ["Any", ...Array.from(new Set(seedProfiles.map((person) => person.department)))];
  const courses = ["Any", ...Array.from(new Set(seedProfiles.map((person) => person.course)))];
  const years = ["Any", ...Array.from(new Set(seedProfiles.map((person) => person.year)))];

  return (
    <section className="mb-4 border border-border bg-card p-4 shadow-soft">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-primary" />
          <input value={props.query} onChange={(event) => props.onQueryChange(event.target.value)} className="w-full bg-transparent text-sm font-bold outline-none" placeholder="Search interests, course, department..." />
        </div>
        <SelectCompact value={props.genderFilter} options={["Any", "Woman", "Man", "Non-binary", "Other"]} onChange={props.onGenderFilterChange} />
        <SelectCompact value={props.goalFilter} options={["Any", ...goalOptions]} onChange={props.onGoalFilterChange} />
        <button type="button" onClick={() => props.onVerifiedOnlyChange(!props.verifiedOnly)} className={`rounded-full px-4 py-2 text-sm font-black ${props.verifiedOnly ? "bg-foreground text-background" : "border border-border bg-background text-muted-foreground"}`}>
          Verified Only
        </button>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-4 xl:grid-cols-7">
        <SelectCompact value={props.ageFilter} options={ageFilterOptions} onChange={props.onAgeFilterChange} />
        <SelectCompact value={props.departmentFilter} options={departments} onChange={props.onDepartmentFilterChange} />
        <SelectCompact value={props.courseFilter} options={courses} onChange={props.onCourseFilterChange} />
        <SelectCompact value={props.yearFilter} options={years} onChange={props.onYearFilterChange} />
        <SelectCompact value={props.interestFilter} options={["Any", ...interestOptions]} onChange={props.onInterestFilterChange} />
        <SelectCompact value={props.activityFilter} options={["Any", "Online Now", "Recently Active", "New This Week"]} onChange={props.onActivityFilterChange} />
        <SelectCompact value={props.distanceFilter} options={distanceFilterOptions} onChange={props.onDistanceFilterChange} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-muted-foreground">
        <span className="inline-flex items-center gap-1 bg-secondary px-3 py-1"><Bell className="h-3.5 w-3.5 text-primary" />{props.notificationCount} notifications</span>
        <span className="bg-secondary px-3 py-1">Nearby Campus</span>
        <span className="bg-secondary px-3 py-1">Suggested For You</span>
        <span className="bg-secondary px-3 py-1">Online Now</span>
      </div>
    </section>
  );
}

function ProfileCard({ person, liked, saved, onLike, onPass, onSave, onReport }: {
  person: PublicProfile;
  liked: boolean;
  saved: boolean;
  onLike: () => void;
  onPass: () => void;
  onSave: () => void;
  onReport: () => void;
}) {
  return (
    <article className="paper-lift overflow-hidden border border-border bg-card">
      <div className="relative">
        <img src={person.image} alt="" className="h-80 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-black text-primary">{person.match}% Match</span>
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 bg-background/90 px-2 py-1 text-xs font-black text-success"><BadgeCheck className="h-3.5 w-3.5" />verified</span>
        <div className="absolute bottom-4 left-4 right-4 text-background">
          <h2 className="font-display text-3xl font-black">{person.name}, {person.age}</h2>
          <p className="text-sm font-bold text-background/85">{person.department} · {person.course} · {person.distance}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2">
          {person.online && <span className="bg-success/10 px-2 py-1 text-[10px] font-black uppercase text-success">Online now</span>}
          {person.newThisWeek && <span className="bg-primary/10 px-2 py-1 text-[10px] font-black uppercase text-primary">New this week</span>}
          {person.recentlyActive && <span className="bg-secondary px-2 py-1 text-[10px] font-black uppercase text-muted-foreground">Recently active</span>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {person.verificationBadges.map((badge) => (
            <span key={badge} className="inline-flex items-center gap-1 bg-success/10 px-2 py-1 text-[10px] font-black uppercase text-success">
              <BadgeCheck className="h-3 w-3" />
              {badge}
            </span>
          ))}
        </div>
        <p className="mt-3 line-clamp-2 text-sm font-semibold">{person.bio}</p>
        <p className="mt-2 text-xs font-bold text-muted-foreground">{person.lifestyle} · {person.languages.join(", ")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {person.interests.slice(0, 5).map((tag) => <span key={tag} className="bg-destructive/10 px-2 py-1 text-[10px] font-black uppercase text-destructive">{tag}</span>)}
        </div>
        <div className="mt-4 grid grid-cols-5 gap-2">
          <button type="button" onClick={onPass} className="grid min-h-11 place-items-center rounded-full border border-border bg-background"><X className="h-4 w-4" /></button>
          <button type="button" onClick={onLike} className={`col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-black ${liked ? "bg-destructive/10 text-destructive" : "bg-foreground text-background"}`}><Heart className="h-4 w-4" />{liked ? "Sent" : "Like"}</button>
          <button type="button" onClick={onSave} className={`grid min-h-11 place-items-center rounded-full border ${saved ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}><Star className="h-4 w-4" /></button>
          <button type="button" onClick={onReport} className="grid min-h-11 place-items-center rounded-full border border-border bg-background text-muted-foreground"><Flag className="h-4 w-4" /></button>
        </div>
      </div>
    </article>
  );
}

function MatchCard({ person, onChat }: { person: PublicProfile; onChat: () => void }) {
  return (
    <article className="border border-border bg-card p-4 shadow-soft">
      <div className="flex gap-3">
        <img src={person.image} alt="" className="h-24 w-24 rounded-3xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase text-destructive">It's a Match</p>
          <h2 className="font-display text-2xl font-black">{person.name}</h2>
          <p className="text-sm font-bold text-muted-foreground">{person.match}% compatibility · Chat unlocked</p>
          <button type="button" onClick={onChat} className="mt-3 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-black text-background"><MessageCircle className="h-4 w-4" />Open Chat</button>
        </div>
      </div>
    </article>
  );
}

function ChatPanel({ person, onReport }: { person: PublicProfile; onReport: () => void }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <img src={person.image} alt="" className="h-14 w-14 rounded-full object-cover" />
          <div>
            <h2 className="font-display text-xl font-black">{person.name}</h2>
            <p className="text-xs font-bold text-success">Matched · read receipts on</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-primary" />
          <input className="w-full bg-transparent text-xs font-bold outline-none" placeholder="Search conversation" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black">
          <span className="bg-secondary px-3 py-2 text-muted-foreground">Typing indicator</span>
          <span className="bg-secondary px-3 py-2 text-muted-foreground">Read receipts</span>
          <span className="bg-secondary px-3 py-2 text-muted-foreground">Photo sharing</span>
          <span className="bg-secondary px-3 py-2 text-muted-foreground">GIF support</span>
        </div>
        <button type="button" onClick={onReport} className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-black text-destructive"><ShieldAlert className="h-4 w-4" />Report or Block</button>
      </aside>
      <div className="border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <p className="text-xs font-black uppercase text-primary">Campus chat</p>
            <h2 className="font-display text-2xl font-black">{person.name}</h2>
          </div>
          <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="grid gap-3 p-4">
          <Bubble mine={false}>Hey, we matched. Your campus cafe list sounds elite.</Bubble>
          <Bubble mine>Haha thanks. Favorite spot?</Bubble>
          <Bubble mine={false}>Cafe Beans after 5. Typing...</Bubble>
          <div className="ml-auto flex flex-wrap justify-end gap-2 text-[10px] font-black uppercase text-muted-foreground">
            <button type="button" className="inline-flex items-center gap-1 bg-secondary px-2 py-1"><Reply className="h-3 w-3" />Reply</button>
            <button type="button" className="inline-flex items-center gap-1 bg-secondary px-2 py-1"><Trash2 className="h-3 w-3" />Delete for me</button>
            <button type="button" className="inline-flex items-center gap-1 bg-secondary px-2 py-1"><Trash2 className="h-3 w-3" />Delete for everyone</button>
          </div>
        </div>
        <div className="flex gap-2 border-t border-border p-4">
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background"><Camera className="h-4 w-4" /></button>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background"><ImageIcon className="h-4 w-4" /></button>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background"><Gift className="h-4 w-4" /></button>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background"><Smile className="h-4 w-4" /></button>
          <button type="button" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-background"><Mic className="h-4 w-4" /></button>
          <input className="min-h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm font-bold outline-none" placeholder="Message after match..." />
          <button type="button" className="rounded-full bg-foreground px-5 text-sm font-black text-background">Send</button>
        </div>
      </div>
    </section>
  );
}

function SafetyPanel() {
  return (
    <section className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SafetyCard icon={<ShieldCheck className="h-5 w-5" />} title="Consent-first actions" text="Users can only chat after a mutual match. Like, pass, report and block remain visible." />
        <SafetyCard icon={<EyeOff className="h-5 w-5" />} title="Privacy controls" text="Hide department, course, year, online status, distance, Instagram and last seen." />
        <SafetyCard icon={<Flag className="h-5 w-5" />} title="Mandatory reporting" text="Fake profiles, spam, harassment, inappropriate images, scams and underage reports go to admin review." />
        <SafetyCard icon={<BadgeCheck className="h-5 w-5" />} title="Verified students only" text="Profiles display verified student, ID verified and campus verified signals." />
      </div>
      <section className="border border-border bg-card p-4 shadow-soft">
        <p className="text-xs font-black uppercase text-primary">Admin review queue</p>
        <h2 className="font-display text-3xl font-black">Trust controls</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {["Review reports", "Ban fake profiles", "Remove photos", "Suspend users", "Review verification"].map((item) => (
            <button key={item} type="button" className="min-h-20 border border-border bg-background px-3 text-sm font-black text-muted-foreground transition hover:border-primary hover:text-primary">
              {item}
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function ReportModal({ person, onClose, onSubmit }: { person: PublicProfile; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = useState(reportReasons[0]);
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm">
      <section className="w-full max-w-md border border-border bg-card p-4 shadow-glow">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <p className="text-xs font-black uppercase text-destructive">Report profile</p>
            <h2 className="font-display text-2xl font-black">{person.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center border border-border bg-background"><X className="h-4 w-4" /></button>
        </div>
        <label className="mt-4 block">
          <span className="text-xs font-black uppercase text-muted-foreground">Reason</span>
          <select value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm font-bold outline-none">
            {reportReasons.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-border bg-background px-4 py-3 text-sm font-black">Cancel</button>
          <button type="button" onClick={() => onSubmit(reason)} className="rounded-full bg-destructive px-4 py-3 text-sm font-black text-destructive-foreground">Submit</button>
        </div>
      </section>
    </div>
  );
}

function LockedSection({ locked, onUnlock, children }: { locked: boolean; onUnlock: () => void; children: React.ReactNode }) {
  if (!locked) return <>{children}</>;
  return (
    <section className="grid min-h-[360px] place-items-center border border-border bg-card p-6 text-center shadow-soft">
      <div>
        <Lock className="mx-auto h-8 w-8 text-destructive" />
        <h2 className="mt-3 font-display text-3xl font-black">Locked until profile is complete</h2>
        <p className="mt-2 max-w-md text-sm font-semibold text-muted-foreground">Create a complete verified profile with at least 3 photos before discovering, liking, matching or chatting.</p>
        <button type="button" onClick={onUnlock} className="mt-5 rounded-full bg-foreground px-5 py-3 text-sm font-black text-background">Complete Profile</button>
      </div>
    </section>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-background/70 p-4">
      <h3 className="mb-3 text-xs font-black uppercase text-primary">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function TextField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-black uppercase text-muted-foreground">{label}</span>
      <input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm font-bold outline-none transition focus:border-primary" />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span className="text-xs font-black uppercase text-muted-foreground">{label}</span>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm font-bold outline-none transition focus:border-primary" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="text-xs font-black uppercase text-muted-foreground">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm font-bold outline-none transition focus:border-primary">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function SelectCompact({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-full border border-border bg-background px-3 text-sm font-black outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select>;
}

function MultiChoice({ label, values, options, min, onChange }: { label: string; values: string[]; options: string[]; min: number; onChange: (values: string[]) => void }) {
  return (
    <div className="sm:col-span-2">
      <span className="text-xs font-black uppercase text-muted-foreground">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button key={option} type="button" onClick={() => onChange(active ? values.filter((item) => item !== option) : [...values, option])} className={`rounded-full px-3 py-2 text-xs font-black ${active ? "bg-foreground text-background" : "border border-border bg-card text-muted-foreground"}`}>
              {option}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs font-bold text-muted-foreground">{values.length}/{min} minimum selected</p>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`flex min-h-12 items-center justify-between rounded-2xl border px-3 text-sm font-black ${checked ? "border-success bg-success/10 text-success" : "border-border bg-card text-muted-foreground"}`}>
      {label}
      <span className={`h-5 w-5 rounded-full border ${checked ? "border-success bg-success" : "border-border"}`} />
    </button>
  );
}

function Bubble({ mine, children }: { mine?: boolean; children: React.ReactNode }) {
  return <p className={`max-w-[75%] rounded-3xl px-4 py-3 text-sm font-semibold ${mine ? "ml-auto bg-foreground text-background" : "bg-secondary text-foreground"}`}>{children}</p>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="grid min-h-[280px] place-items-center border border-border bg-card p-6 text-center shadow-soft"><div><Sparkles className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-3 font-display text-3xl font-black">{title}</h2><p className="mt-2 max-w-md text-sm font-semibold text-muted-foreground">{text}</p></div></div>;
}

function NotificationsPanel({ notifications }: { notifications: string[] }) {
  return <aside className="h-fit border border-border bg-card p-4 shadow-soft"><h2 className="font-display text-2xl font-black">Notifications</h2><div className="mt-3 grid gap-2">{notifications.map((note, index) => <p key={`${note}-${index}`} className="border-l-2 border-destructive bg-secondary/60 px-3 py-2 text-xs font-bold text-muted-foreground">{note}</p>)}</div></aside>;
}

function SafetyCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="border border-border bg-card p-4 shadow-soft"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-success/15 text-success">{icon}</span><h2 className="mt-4 font-display text-2xl font-black">{title}</h2><p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">{text}</p></article>;
}

function getCompletion(profile: ConnectProfile) {
  const checks = [
    ["Photos", profile.photos.length >= 3 && Boolean(profile.primaryPhoto)],
    ["Full name", profile.name.trim().length > 1],
    ["Age", profile.age >= 18],
    ["Gender", Boolean(profile.gender)],
    ["Interested in", Boolean(profile.interestedIn)],
    ["Education", Boolean(profile.college && profile.campus && profile.department && profile.course && profile.year)],
    ["Bio", profile.bio.trim().length >= 30],
    ["Height", Boolean(profile.height)],
    ["Languages", Boolean(profile.languages)],
    ["Relationship goal", Boolean(profile.relationshipGoal)],
    ["Looking for", profile.lookingFor.length > 0],
    ["Interests", profile.interests.length >= 5],
    ["Hangout spot", Boolean(profile.favoriteSpot)],
  ] as const;
  const complete = checks.filter(([, ok]) => ok).length;
  return {
    percent: Math.round((complete / checks.length) * 100),
    missing: checks.filter(([, ok]) => !ok).map(([label]) => label),
  };
}

function calculateMatch(profile: ConnectProfile, person: PublicProfile) {
  if (!profile.name) return person.match;
  let score = 48;
  const myInterests = new Set(profile.interests.map((item) => item.toLowerCase()));
  const shared = person.interests.filter((item) => myInterests.has(item.toLowerCase()));
  score += Math.min(25, shared.length * 5);
  if (profile.campus && profile.campus === person.campus) score += 10;
  if (profile.department && profile.department === person.department) score += 5;
  if (profile.course && profile.course === person.course) score += 5;
  if (profile.relationshipGoal && (person.relationshipGoal === profile.relationshipGoal || person.lookingFor.includes(profile.relationshipGoal))) score += 8;
  if (profile.lookingFor.some((goal) => person.lookingFor.includes(goal))) score += 7;
  if (person.age >= profile.agePreferenceMin && person.age <= profile.agePreferenceMax) score += 5;
  if (person.online || person.recentlyActive) score += 3;
  return Math.min(98, Math.max(65, score));
}

function matchesAgeFilter(age: number, filter: string) {
  if (filter === "18-20") return age >= 18 && age <= 20;
  if (filter === "21-23") return age >= 21 && age <= 23;
  if (filter === "24+") return age >= 24;
  return true;
}

function matchesActivityFilter(person: PublicProfile, filter: string) {
  if (filter === "Online Now") return person.online;
  if (filter === "Recently Active") return person.recentlyActive;
  if (filter === "New This Week") return person.newThisWeek;
  return true;
}

function matchesDistanceFilter(distance: string, filter: string) {
  if (filter === "Any") return true;
  const kms = Number(distance.replace(" km", ""));
  if (Number.isNaN(kms)) return true;
  if (filter === "Within 1 km") return kms <= 1;
  if (filter === "Within 2 km") return kms <= 2;
  if (filter === "Within 5 km") return kms <= 5;
  return true;
}

function CampusPageShell({ label, title, subtitle, icon: Icon, children }: { label: string; title: string; subtitle: string; icon: typeof Heart; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="commons-wall mb-5 border border-border p-5 shadow-soft">
          <span className="inline-flex items-center gap-2 bg-destructive/10 px-3 py-1 text-xs font-black uppercase text-destructive"><Icon className="h-4 w-4" />{label}</span>
          <h1 className="mt-3 font-display text-4xl font-black sm:text-6xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted-foreground sm:text-base">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
