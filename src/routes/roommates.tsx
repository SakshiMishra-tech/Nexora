import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  Check,
  Flag,
  Filter,
  Handshake,
  Heart,
  Home,
  Languages,
  MapPin,
  MessageCircle,
  Moon,
  PauseCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ModuleAccessBoundary } from "@/components/ModuleAccessControl";
import { SiteNav } from "@/components/SiteNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import student1 from "@/assets/student-1.jpg";
import student2 from "@/assets/student-2.jpg";
import student3 from "@/assets/student-3.jpg";

export const Route = createFileRoute("/roommates")({
  head: () => ({ meta: [{ title: "Nexora - Roommates" }] }),
  component: Roommates,
});

type Roommate = {
  id: number;
  listingId?: string;
  ownerId?: string;
  name: string;
  image: string;
  campus: string;
  college: string;
  course: string;
  branch: string;
  semester: string;
  gender: string;
  religion: string;
  roomType: string;
  occupancy: string;
  budgetMin: number;
  budgetMax: number;
  location: string;
  area: string;
  currentAddress: string;
  preferredArea: string;
  food: string;
  smoking: string;
  alcohol: string;
  sleepSchedule: string;
  wakeUpTime: string;
  cleanliness: string;
  visitors: string;
  studyStyle: string;
  personality: string;
  languages: string[];
  pets: string;
  professionalStatus: string;
  relationshipPreference: string;
  age: number;
  moveInDate: string;
  verified: boolean;
  availability: string;
  match: number;
  profileCompletion: number;
  roomSharing: string;
  aboutMe: string;
  interests: string[];
  hobbies: string[];
  dailyRoutine: string;
  compatibilityScore: number;
  commonInterests: string[];
  commonSchedule: string;
  mutualFriends: string;
  gallery: string[];
  socialVerification: string[];
  receiveRequests?: boolean;
  receiveChats?: boolean;
  matchReasons?: string[];
  createdAt?: string;
  recentlyActiveAt?: string;
};

type Filters = {
  campus: string;
  college: string;
  course: string;
  branch: string;
  semester: string;
  gender: string;
  religion: string;
  roomType: string;
  occupancy: string;
  budgetMin: number;
  budgetMax: number;
  location: string;
  food: string;
  smoking: string;
  alcohol: string;
  sleepSchedule: string;
  wakeUpTime: string;
  cleanliness: string;
  visitors: string;
  studyStyle: string;
  personality: string;
  language: string;
  pets: string;
  professionalStatus: string;
  relationshipPreference: string;
  ageMin: number;
  ageMax: number;
  moveInDate: string;
  verifiedOnly: boolean;
  availability: string;
};

type RoommateListingForm = {
  isLookingEnabled: boolean;
  isListingEnabled: boolean;
  name: string;
  gender: string;
  course: string;
  year: string;
  college: string;
  department: string;
  budgetMin: number;
  budgetMax: number;
  moveInDate: string;
  roomType: string;
  occupancy: string;
  preferredHousing: string;
  food: string;
  smoking: string;
  alcohol: string;
  visitors: string;
  sleepSchedule: string;
  studyStyle: string;
  cleanliness: string;
  noiseLevel: string;
  musicPreference: string;
  cooking: string;
  religionPreference: string;
  genderPreference: string;
  preferredAgeMin: number;
  preferredAgeMax: number;
  areaPreference: string;
  about: string;
  languages: string;
  interests: string;
  age: number;
  dailyRoutine: string;
  photoUrls: string;
  acRequired: boolean;
  coolerRequired: boolean;
  attachedWashroom: boolean;
  balcony: boolean;
  wifi: boolean;
  parking: boolean;
  laundry: boolean;
  gym: boolean;
  hidePhone: boolean;
  hideExactLocation: boolean;
  contactPreference: string;
  instagram: string;
  visibility: "public" | "campus_only" | "hidden";
  receiveRequests: boolean;
  receiveChats: boolean;
  paused: boolean;
  campus: string;
  currentAddress: string;
};

type RoommateListingRow = {
  id: string;
  user_id: string;
  is_looking_enabled: boolean;
  is_listing_enabled: boolean;
  visibility: "public" | "campus_only" | "hidden";
  paused: boolean;
  budget_min: number;
  budget_max: number;
  move_in_date: string | null;
  room_type: string | null;
  occupancy: string | null;
  food: string | null;
  smoking: string | null;
  alcohol: string | null;
  visitors: string | null;
  sleep_schedule: string | null;
  study_style: string | null;
  cleanliness: string | null;
  religion_preference: string | null;
  gender_preference: string | null;
  area_preference: string | null;
  about: string | null;
  languages: string[] | null;
  interests: string[] | null;
  age: number | null;
  daily_routine: string | null;
  photo_urls: string[] | null;
  verification_status: "pending" | "verified" | "rejected";
  receive_requests: boolean;
  receive_chats: boolean;
  display_name: string | null;
  avatar_url: string | null;
  course: string | null;
  college: string | null;
  branch: string | null;
  semester: string | null;
  gender: string | null;
  campus: string | null;
  current_address: string | null;
  recently_active_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SortMode = "highest_match" | "nearest" | "budget" | "newest" | "recently_active" | "verified";

const defaultFilters: Filters = {
  campus: "Any",
  college: "Any",
  course: "Any",
  branch: "Any",
  semester: "Any",
  gender: "Any",
  religion: "No Preference",
  roomType: "Any",
  occupancy: "Any",
  budgetMin: 5000,
  budgetMax: 20000,
  location: "Any",
  food: "No Preference",
  smoking: "Any",
  alcohol: "Any",
  sleepSchedule: "Any",
  wakeUpTime: "Any",
  cleanliness: "Any",
  visitors: "Any",
  studyStyle: "Any",
  personality: "Any",
  language: "Any",
  pets: "Any",
  professionalStatus: "Both",
  relationshipPreference: "No Preference",
  ageMin: 18,
  ageMax: 30,
  moveInDate: "",
  verifiedOnly: false,
  availability: "Any",
};

const defaultListingForm: RoommateListingForm = {
  isLookingEnabled: true,
  isListingEnabled: false,
  name: "",
  gender: "No Preference",
  course: "",
  year: "",
  college: "",
  department: "",
  budgetMin: 7000,
  budgetMax: 12000,
  moveInDate: "",
  roomType: "Double",
  occupancy: "Looking for 1 roommate",
  preferredHousing: "Hostel",
  food: "No Preference",
  smoking: "No",
  alcohol: "No",
  visitors: "Sometimes",
  sleepSchedule: "Balanced",
  studyStyle: "Library",
  cleanliness: "Average",
  noiseLevel: "Moderate",
  musicPreference: "Music Friendly",
  cooking: "Sometimes",
  religionPreference: "No Preference",
  genderPreference: "No Preference",
  preferredAgeMin: 18,
  preferredAgeMax: 26,
  areaPreference: "",
  about: "",
  languages: "English, Hindi",
  interests: "",
  age: 21,
  dailyRoutine: "",
  photoUrls: "",
  acRequired: false,
  coolerRequired: false,
  attachedWashroom: false,
  balcony: false,
  wifi: true,
  parking: false,
  laundry: false,
  gym: false,
  hidePhone: true,
  hideExactLocation: true,
  contactPreference: "Chat Only",
  instagram: "",
  visibility: "campus_only",
  receiveRequests: true,
  receiveChats: true,
  paused: false,
  campus: "",
  currentAddress: "",
};

const roommates: Roommate[] = [
  {
    id: 1,
    name: "Maya",
    image: student1,
    campus: "North Campus",
    college: "Nexora Institute",
    course: "B.Tech",
    branch: "CSE",
    semester: "5",
    gender: "Woman",
    religion: "Hindu",
    roomType: "Hostel",
    occupancy: "Looking for 1 roommate",
    budgetMin: 7000,
    budgetMax: 9000,
    location: "Hostel Block",
    area: "Block C",
    currentAddress: "Girls Hostel, Block B, North Campus",
    preferredArea: "Block C or Library lane",
    food: "Veg",
    smoking: "No",
    alcohol: "No",
    sleepSchedule: "Early",
    wakeUpTime: "6:30 AM",
    cleanliness: "Very Clean",
    visitors: "Sometimes",
    studyStyle: "Library",
    personality: "Ambivert",
    languages: ["Hindi", "English"],
    pets: "No pets",
    professionalStatus: "Student",
    relationshipPreference: "No Preference",
    age: 21,
    moveInDate: "2026-07-05",
    verified: true,
    availability: "Available now",
    match: 94,
    profileCompletion: 96,
    roomSharing: "Double",
    aboutMe: "CSE student who keeps a quiet room, cooks simple meals, and prefers planned study hours during weekdays.",
    interests: ["Hackathons", "Coffee", "Startups", "Design systems"],
    hobbies: ["Badminton", "Journaling", "Campus walks"],
    dailyRoutine: "Gym at 6:30 AM, classes till afternoon, library after dinner.",
    compatibilityScore: 94,
    commonInterests: ["Coding", "Library study", "Early mornings"],
    commonSchedule: "Weekday evenings and Sunday planning blocks overlap well.",
    mutualFriends: "Future ready",
    gallery: [student1, student2, student3],
    socialVerification: ["Campus ID verified", "College email verified", "Peer references available"],
  },
  {
    id: 2,
    name: "Jordan",
    image: student2,
    campus: "North Campus",
    college: "Nexora Business School",
    course: "BBA",
    branch: "Marketing",
    semester: "3",
    gender: "Man",
    religion: "Christian",
    roomType: "PG",
    occupancy: "2 roommates",
    budgetMin: 6000,
    budgetMax: 8000,
    location: "Nearby PG",
    area: "Hostel 5",
    currentAddress: "Hostel 5, North Campus",
    preferredArea: "Nearby PG or Hostel 5",
    food: "Non Veg",
    smoking: "Occasionally",
    alcohol: "Occasionally",
    sleepSchedule: "Night Owl",
    wakeUpTime: "8:30 AM",
    cleanliness: "Average",
    visitors: "Allowed",
    studyStyle: "Group Study",
    personality: "Extrovert",
    languages: ["English", "Punjabi"],
    pets: "Pet friendly",
    professionalStatus: "Student",
    relationshipPreference: "No Preference",
    age: 20,
    moveInDate: "2026-07-18",
    verified: true,
    availability: "This month",
    match: 88,
    profileCompletion: 91,
    roomSharing: "Triple",
    aboutMe: "Social, sports-friendly roommate who is usually out for clubs and team work, but keeps shared spaces predictable.",
    interests: ["Basketball", "Startups", "Music", "Food trails"],
    hobbies: ["Guitar", "Street food hunts", "Podcasts"],
    dailyRoutine: "Late classes, basketball in the evening, project work after 10 PM.",
    compatibilityScore: 88,
    commonInterests: ["Group study", "Campus events"],
    commonSchedule: "Best overlap is late evening and weekend afternoons.",
    mutualFriends: "Future ready",
    gallery: [student2, student1, student3],
    socialVerification: ["Campus ID verified", "Club membership verified", "Phone verified"],
  },
  {
    id: 3,
    name: "Priya",
    image: student3,
    campus: "South Campus",
    college: "Nexora Design College",
    course: "Design",
    branch: "Visual Design",
    semester: "7",
    gender: "Woman",
    religion: "Jain",
    roomType: "Flat",
    occupancy: "Looking for 1 roommate",
    budgetMin: 8000,
    budgetMax: 10000,
    location: "Walking distance",
    area: "Library side",
    currentAddress: "Design studio residence, South Campus",
    preferredArea: "Library side or Gate 2",
    food: "Vegan",
    smoking: "No",
    alcohol: "No",
    sleepSchedule: "Balanced",
    wakeUpTime: "7:00 AM",
    cleanliness: "Very Clean",
    visitors: "Sometimes",
    studyStyle: "Silent",
    personality: "Introvert",
    languages: ["Hindi", "English", "Gujarati"],
    pets: "No pets",
    professionalStatus: "Student",
    relationshipPreference: "Single",
    age: 22,
    moveInDate: "2026-08-01",
    verified: true,
    availability: "Next semester",
    match: 91,
    profileCompletion: 93,
    roomSharing: "Single",
    aboutMe: "Design student with a quiet routine, very clean desk habits, and a preference for low-noise evenings.",
    interests: ["Photography", "Zines", "Typography", "Indie films"],
    hobbies: ["Sketching", "Photo walks", "Reading"],
    dailyRoutine: "Studio during the day, silent work block after 8 PM, sleeps before midnight.",
    compatibilityScore: 91,
    commonInterests: ["Quiet rooms", "Library schedule"],
    commonSchedule: "Morning routines and study slots align closely.",
    mutualFriends: "Future ready",
    gallery: [student3, student1, student2],
    socialVerification: ["Campus ID verified", "Portfolio verified", "College email verified"],
  },
  {
    id: 4,
    name: "Aarav",
    image: student2,
    campus: "Tech Park Campus",
    college: "Nexora Institute",
    course: "M.Tech",
    branch: "AI",
    semester: "2",
    gender: "Man",
    religion: "Sikh",
    roomType: "Apartment",
    occupancy: "3 roommates",
    budgetMin: 12000,
    budgetMax: 16000,
    location: "Apartment",
    area: "Metro lane",
    currentAddress: "Metro lane apartment, Tech Park Campus",
    preferredArea: "Apartment near Metro lane",
    food: "Eggitarian",
    smoking: "No",
    alcohol: "No",
    sleepSchedule: "Balanced",
    wakeUpTime: "7:30 AM",
    cleanliness: "Average",
    visitors: "Not Allowed",
    studyStyle: "Late Night",
    personality: "Ambivert",
    languages: ["Hindi", "English", "Punjabi"],
    pets: "No pets",
    professionalStatus: "Both",
    relationshipPreference: "No Preference",
    age: 24,
    moveInDate: "2026-07-12",
    verified: false,
    availability: "Available now",
    match: 84,
    profileCompletion: 82,
    roomSharing: "Any",
    aboutMe: "AI grad student balancing freelance work and labs, prefers practical house rules and clear expense splits.",
    interests: ["AI tools", "Open source", "Finance", "Chess"],
    hobbies: ["Chess", "Cooking", "Reading papers"],
    dailyRoutine: "Lab till 6 PM, freelance calls at night, meal prep twice a week.",
    compatibilityScore: 84,
    commonInterests: ["Late-night study", "Tech projects"],
    commonSchedule: "Evening overlap is strong, mornings are flexible.",
    mutualFriends: "Future ready",
    gallery: [student2, student3, student1],
    socialVerification: ["Phone verified", "GitHub linked"],
  },
  {
    id: 5,
    name: "Sara",
    image: student1,
    campus: "South Campus",
    college: "Nexora Arts College",
    course: "BA",
    branch: "Psychology",
    semester: "4",
    gender: "Woman",
    religion: "Muslim",
    roomType: "Double",
    occupancy: "Looking for 1 roommate",
    budgetMin: 9000,
    budgetMax: 12000,
    location: "Walking distance",
    area: "Gate 2",
    currentAddress: "Gate 2 PG, South Campus",
    preferredArea: "Gate 2 or Arts block",
    food: "Non Veg",
    smoking: "No",
    alcohol: "No",
    sleepSchedule: "Early",
    wakeUpTime: "6:00 AM",
    cleanliness: "Very Clean",
    visitors: "Sometimes",
    studyStyle: "Silent",
    personality: "Introvert",
    languages: ["Urdu", "Hindi", "English"],
    pets: "Pet friendly",
    professionalStatus: "Student",
    relationshipPreference: "Single",
    age: 21,
    moveInDate: "2026-07-25",
    verified: true,
    availability: "This month",
    match: 89,
    profileCompletion: 90,
    roomSharing: "Double",
    aboutMe: "Psychology student who values calm conversations, clean shared spaces, and respectful visitor boundaries.",
    interests: ["Psychology", "Theatre", "Poetry", "Cafe study"],
    hobbies: ["Theatre", "Poetry", "Baking"],
    dailyRoutine: "Classes in the morning, cafe study in the evening, quiet nights.",
    compatibilityScore: 89,
    commonInterests: ["Silent study", "Early routine"],
    commonSchedule: "Morning and evening routines fit well.",
    mutualFriends: "Future ready",
    gallery: [student1, student3, student2],
    socialVerification: ["Campus ID verified", "College email verified", "Student society verified"],
  },
  {
    id: 6,
    name: "Kabir",
    image: student2,
    campus: "North Campus",
    college: "Nexora Institute",
    course: "B.Tech",
    branch: "ECE",
    semester: "6",
    gender: "Man",
    religion: "Buddhist",
    roomType: "Triple",
    occupancy: "2 roommates",
    budgetMin: 5000,
    budgetMax: 7000,
    location: "Hostel Block",
    area: "Block A",
    currentAddress: "Boys Hostel, Block A, North Campus",
    preferredArea: "Block A or Block C",
    food: "Veg",
    smoking: "No",
    alcohol: "Occasionally",
    sleepSchedule: "Night Owl",
    wakeUpTime: "9:00 AM",
    cleanliness: "Average",
    visitors: "Allowed",
    studyStyle: "Group Study",
    personality: "Extrovert",
    languages: ["Hindi", "English", "Marathi"],
    pets: "No pets",
    professionalStatus: "Student",
    relationshipPreference: "No Preference",
    age: 22,
    moveInDate: "2026-08-10",
    verified: true,
    availability: "Next semester",
    match: 86,
    profileCompletion: 88,
    roomSharing: "Triple",
    aboutMe: "ECE student with a lively group-study routine, okay with visitors, and flexible about shared chores.",
    interests: ["Robotics", "Cricket", "Electronics", "Gaming"],
    hobbies: ["Cricket", "Gaming", "DIY circuits"],
    dailyRoutine: "Classes, lab work, cricket after 5 PM, group study late night.",
    compatibilityScore: 86,
    commonInterests: ["Group study", "Campus sports"],
    commonSchedule: "Late-night work blocks overlap well.",
    mutualFriends: "Future ready",
    gallery: [student2, student1, student3],
    socialVerification: ["Campus ID verified", "Lab group verified", "Phone verified"],
  },
];

const optionGroups = {
  campus: ["Any", "North Campus", "South Campus", "Tech Park Campus"],
  college: ["Any", "Nexora Institute", "Nexora Business School", "Nexora Design College", "Nexora Arts College"],
  course: ["Any", "B.Tech", "M.Tech", "BBA", "BA", "Design"],
  branch: ["Any", "CSE", "ECE", "AI", "Marketing", "Psychology", "Visual Design"],
  semester: ["Any", "1", "2", "3", "4", "5", "6", "7", "8"],
  gender: ["Any", "Woman", "Man", "Non-binary", "No Preference"],
  religion: ["No Preference", "Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"],
  roomType: ["Any", "Single", "Double", "Triple", "Four Sharing", "PG", "Flat", "Hostel", "Apartment"],
  occupancy: ["Any", "Looking for 1 roommate", "2 roommates", "3 roommates", "4 roommates"],
  location: ["Any", "Hostel Block", "Nearby PG", "Apartment", "Walking distance"],
  food: ["No Preference", "Veg", "Non Veg", "Vegan", "Eggitarian"],
  smoking: ["Any", "Yes", "No", "Occasionally"],
  alcohol: ["Any", "Yes", "No", "Occasionally"],
  sleepSchedule: ["Any", "Early", "Balanced", "Night Owl"],
  wakeUpTime: ["Any", "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:30 AM", "9:00 AM"],
  cleanliness: ["Any", "Very Clean", "Average", "Doesn't Matter"],
  visitors: ["Any", "Allowed", "Sometimes", "Not Allowed"],
  studyStyle: ["Any", "Silent", "Group Study", "Late Night", "Library"],
  personality: ["Any", "Introvert", "Extrovert", "Ambivert"],
  language: ["Any", "Hindi", "English", "Punjabi", "Gujarati", "Urdu", "Marathi"],
  pets: ["Any", "No pets", "Pet friendly", "Has pets"],
  professionalStatus: ["Both", "Student", "Working Professional"],
  relationshipPreference: ["No Preference", "Single", "Any"],
  availability: ["Any", "Available now", "This month", "Next semester"],
} as const;

const choiceSections = [
  {
    title: "Academics",
    fields: [
      ["campus", "Campus"],
      ["college", "College"],
      ["course", "Course"],
      ["branch", "Branch"],
      ["semester", "Year/Semester"],
    ],
  },
  {
    title: "Identity",
    fields: [
      ["gender", "Gender"],
      ["religion", "Religion"],
      ["language", "Languages Spoken"],
      ["relationshipPreference", "Relationship Status preference (Optional)"],
    ],
  },
  {
    title: "Room",
    fields: [
      ["roomType", "Room Type"],
      ["occupancy", "Occupancy"],
      ["location", "Location"],
      ["availability", "Availability"],
    ],
  },
  {
    title: "Lifestyle",
    fields: [
      ["food", "Food"],
      ["smoking", "Smoking"],
      ["alcohol", "Alcohol"],
      ["sleepSchedule", "Sleep Schedule"],
      ["wakeUpTime", "Wake-up Time"],
      ["cleanliness", "Cleanliness"],
      ["visitors", "Visitors"],
      ["studyStyle", "Study Style"],
      ["personality", "Personality"],
      ["pets", "Pets"],
      ["professionalStatus", "Working Professional / Student"],
    ],
  },
] as const;

function Roommates() {
  return (
    <ModuleAccessBoundary moduleId="roommates">
      <RoommatesContent />
    </ModuleAccessBoundary>
  );
}

function RoommatesContent() {
  const { user, profile } = useAuth();
  const [activeMode, setActiveMode] = useState<"home" | "looking" | "become">("home");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedRoommate, setSelectedRoommate] = useState<Roommate | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(defaultFilters);
  const [listingForm, setListingForm] = useState<RoommateListingForm>(defaultListingForm);
  const [listingId, setListingId] = useState<string | null>(null);
  const [remoteRoommates, setRemoteRoommates] = useState<Roommate[]>([]);
  const [setupStatus, setSetupStatus] = useState("");
  const [isSavingListing, setIsSavingListing] = useState(false);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("highest_match");

  const availableRoommates = remoteRoommates.length > 0 ? remoteRoommates : roommates;
  const recommendedRoommates = useMemo(
    () =>
      listingForm.isLookingEnabled
        ? sortRoommates(
          filterRoommates(availableRoommates, appliedFilters).map((person) =>
            applyCompatibility(person, listingForm, profile as any),
          ),
            sortMode,
            listingForm,
          )
        : [],
    [appliedFilters, availableRoommates, listingForm, profile, sortMode],
  );
  const previewCount = useMemo(() => filterRoommates(availableRoommates, draftFilters).length, [availableRoommates, draftFilters]);
  const activeFilterCount = getActiveFilterCount(appliedFilters);

  useEffect(() => {
    const hydrateDefaults = () => {
      const fullName = profile?.full_name?.trim() || "";
      setListingForm((current) => ({
        ...current,
        name: current.name || fullName || "",
        college: current.college || profile?.college_name || "",
        campus: current.campus || profile?.college_name || "",
        currentAddress: current.currentAddress || profile?.college_name || "",
        about: current.about || fullName || "",
      }));
    };

    hydrateDefaults();
  }, [profile]);

  useEffect(() => {
    let mounted = true;

    const loadListings = async () => {
      setIsLoadingListings(true);

      const { data, error } = await supabase
        .from("roommate_listings")
        .select("*")
        .eq("is_listing_enabled", true)
        .eq("paused", false)
        .in("visibility", ["public", "campus_only"]);

      if (!mounted) return;

      if (error) {
        console.error("Roommate listings lookup failed", error);
        setRemoteRoommates([]);
      } else {
        setRemoteRoommates((data as RoommateListingRow[]).map(mapListingToRoommate));
      }

      setIsLoadingListings(false);
    };

    void loadListings();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const loadMyListing = async () => {
      const { data, error } = await supabase
        .from("roommate_listings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<RoommateListingRow>();

      if (!mounted) return;

      if (error) {
        console.error("My roommate listing lookup failed", error);
        return;
      }

      if (data) {
        setListingId(data.id);
        setListingForm(listingRowToForm(data));
      }
    };

    void loadMyListing();

    return () => {
      mounted = false;
    };
  }, [user]);

  const saveListing = async (overrides: Partial<RoommateListingForm> = {}) => {
    if (!user) {
      setSetupStatus("Sign in to publish and sync your roommate listing.");
      return;
    }

    const nextForm = { ...listingForm, ...overrides };
    setIsSavingListing(true);
    setSetupStatus("Saving listing...");

    const payload = listingFormToRow(nextForm, user.id, profile);
    const { data, error } = await supabase
      .from("roommate_listings")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single<RoommateListingRow>();

    setIsSavingListing(false);

    if (error) {
      console.error("Roommate listing save failed", error);
      setSetupStatus("Could not sync listing. Check Supabase schema and try again.");
      return;
    }

    setListingForm(nextForm);
    setListingId(data.id);
    setSetupStatus(nextForm.isListingEnabled ? "Listing synced and visible based on your visibility setting." : "Preferences saved.");
    setRemoteRoommates((current) => {
      const mapped = mapListingToRoommate(data);
      const withoutMine = current.filter((item) => item.listingId !== data.id);
      if (!data.is_listing_enabled || data.paused || data.visibility === "hidden") return withoutMine;
      return [mapped, ...withoutMine];
    });
  };

  const deleteListing = async () => {
    if (!user || !listingId) {
      setListingForm(defaultListingForm);
      return;
    }

    setIsSavingListing(true);
    const { error } = await supabase.from("roommate_listings").delete().eq("id", listingId);
    setIsSavingListing(false);

    if (error) {
      console.error("Roommate listing delete failed", error);
      setSetupStatus("Could not delete listing.");
      return;
    }

    setListingId(null);
    setListingForm(defaultListingForm);
    setRemoteRoommates((current) => current.filter((item) => item.listingId !== listingId));
    setSetupStatus("Listing deleted.");
  };

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setIsFilterOpen(true);
  };

  const clearFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setIsFilterOpen(false);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {activeMode === "home" && <SiteNav />}

      {activeMode === "home" && (
        <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveMode("become")}
            className="min-h-[320px] border border-warm/40 bg-warm/10 p-6 text-left shadow-soft transition hover:-translate-y-1 hover:shadow-glow"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-warm text-warm-foreground">
              <Home className="h-7 w-7" />
            </span>
            <p className="mt-10 text-xs font-black uppercase text-warm">Become a Roommate</p>
            <h1 className="mt-2 font-display text-4xl font-black">I want to be someone's roommate</h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-muted-foreground">
              Add your age, gender, budget, room preference, area, amenities, lifestyle and privacy settings. Your profile becomes discoverable by matching students.
            </p>
          </button>

          <article className="min-h-[320px] border border-primary/40 bg-card p-6 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-primary-foreground">
                <Search className="h-7 w-7" />
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !listingForm.isLookingEnabled;
                  setListingForm((current) => ({ ...current, isLookingEnabled: next }));
                  void saveListing({ isLookingEnabled: next });
                  if (next) setActiveMode("looking");
                }}
                className={`relative h-10 w-16 rounded-full transition ${listingForm.isLookingEnabled ? "bg-success" : "bg-muted"}`}
                aria-pressed={listingForm.isLookingEnabled}
              >
                <span className={`absolute top-1 h-8 w-8 rounded-full bg-background shadow-soft transition ${listingForm.isLookingEnabled ? "left-7" : "left-1"}`} />
              </button>
            </div>
            <p className="mt-10 text-xs font-black uppercase text-primary">Looking for Roommate</p>
            <h1 className="mt-2 font-display text-4xl font-black">I am looking for a roommate</h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-muted-foreground">
              Browse profiles, filter by budget, gender, area, PG/hostel/flat, AC/cooler, food habits, age, sleep schedule and compatibility.
            </p>
            <button
              type="button"
              onClick={() => setActiveMode("looking")}
              className="mt-8 rounded-full bg-foreground px-5 py-3 text-sm font-black text-background"
            >
              Open roommate discovery
            </button>
          </article>
        </section>
      )}

      {activeMode === "become" && (
        <>
          <RoommateModeHeader
            tone="bg-warm/15 text-warm"
            eyebrow="Become a Roommate"
            title="Create your roommate profile"
            description="Add your details and requirements. Once published, students with matching preferences can discover and request you."
            onBack={() => setActiveMode("home")}
          />
          <section className="mx-auto max-w-7xl px-4 py-4">
            <ListingSetupFlow
              form={listingForm}
              userSignedIn={Boolean(user)}
              status={setupStatus}
              isSaving={isSavingListing}
              onChange={setListingForm}
              onSave={() => void saveListing({ isListingEnabled: true })}
              onPause={() => void saveListing({ paused: !listingForm.paused })}
              onDelete={() => void deleteListing()}
            />
          </section>
        </>
      )}

      {activeMode === "looking" && (
        <>
          <RoommateModeHeader
            tone="bg-primary/10 text-primary"
            eyebrow="Looking for Roommate"
            title="Find compatible roommates"
            description="Search, filter, save profiles and send roommate requests. Highest compatibility appears first."
            onBack={() => setActiveMode("home")}
            action={
              <button
                type="button"
                onClick={() => {
                  const next = !listingForm.isLookingEnabled;
                  setListingForm((current) => ({ ...current, isLookingEnabled: next }));
                  void saveListing({ isLookingEnabled: next });
                }}
                className={`relative h-10 w-16 rounded-full transition ${listingForm.isLookingEnabled ? "bg-success" : "bg-muted"}`}
                aria-pressed={listingForm.isLookingEnabled}
              >
                <span className={`absolute top-1 h-8 w-8 rounded-full bg-background shadow-soft transition ${listingForm.isLookingEnabled ? "left-7" : "left-1"}`} />
              </button>
            }
          />

          <section className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <button
                type="button"
                onClick={openFilters}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-black text-background shadow-soft transition hover:-translate-y-0.5"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-success px-1.5 text-[10px] text-success-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto py-1">
                <FilterPill>{isLoadingListings ? "Syncing listings..." : `${recommendedRoommates.length} suggested matches`}</FilterPill>
                <FilterPill>{formatBudget(appliedFilters.budgetMin, appliedFilters.budgetMax)}</FilterPill>
                {activeFilterCount === 0 ? (
                  <>
                    <FilterPill>All campuses</FilterPill>
                    <FilterPill>All lifestyles</FilterPill>
                  </>
                ) : (
                  getActiveFilterLabels(appliedFilters).map((label) => <FilterPill key={label}>{label}</FilterPill>)
                )}
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="hidden min-h-11 shrink-0 rounded-full border border-border bg-card px-4 text-sm font-black text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:inline-flex sm:items-center"
                >
                  Clear
                </button>
              )}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-4">
            {recommendedRoommates.length > 0 ? (
              <>
                <RecommendationHeader sortMode={sortMode} onSortChange={setSortMode} topMatch={recommendedRoommates[0]} />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {recommendedRoommates.map((person) => (
                    <RoommateCard key={person.id} person={person} onSelect={() => setSelectedRoommate(person)} />
                  ))}
                </div>
              </>
            ) : (
              <div className="grid min-h-[360px] place-items-center border border-border bg-card p-6 text-center shadow-soft">
                <div>
                  <Sparkles className="mx-auto h-8 w-8 text-primary" />
                  <h2 className="mt-3 font-display text-3xl font-black">No roommate matches yet</h2>
                  <p className="mt-2 max-w-md text-sm font-semibold text-muted-foreground">
                    Try widening budget, location, food, or sleep preferences. You can also create your own profile so matching students find you.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={clearFilters} className="rounded-full bg-foreground px-5 py-3 text-sm font-black text-background">
                      Clear Filters
                    </button>
                    <button type="button" onClick={() => setActiveMode("become")} className="rounded-full border border-warm/40 bg-warm/10 px-5 py-3 text-sm font-black text-warm">
                      Become a Roommate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}

      {isFilterOpen && (
        <FilterDrawer
          filters={draftFilters}
          previewCount={previewCount}
          onChange={setDraftFilters}
          onClose={() => setIsFilterOpen(false)}
          onClear={clearFilters}
          onApply={applyFilters}
        />
      )}

      {selectedRoommate && (
        <RoommateDetailsPanel person={selectedRoommate} userId={user?.id ?? null} onClose={() => setSelectedRoommate(null)} />
      )}
    </main>
  );
}

function ModeCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <article className={`border p-4 shadow-soft transition ${enabled ? "border-primary bg-primary/8" : "border-border bg-card"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${enabled ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"}`}>
          {icon}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-success" : "bg-muted"}`}
          aria-pressed={enabled}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-background shadow-soft transition ${enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>
      <h2 className="mt-4 font-display text-2xl font-black">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

function RoommateModeHeader({
  tone,
  eyebrow,
  title,
  description,
  action,
  onBack,
}: {
  tone: string;
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  onBack: () => void;
}) {
  return (
    <header className="border-b border-border bg-background px-4 py-4">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground shadow-soft transition hover:-translate-y-0.5"
            aria-label="Back to roommate modes"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase ${tone}`}>{eyebrow}</span>
            <h1 className="mt-2 font-display text-3xl font-black sm:text-4xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm font-semibold text-muted-foreground">{description}</p>
          </div>
        </div>
        {action}
      </div>
    </header>
  );
}

function ListingSetupFlow({
  form,
  userSignedIn,
  status,
  isSaving,
  onChange,
  onSave,
  onPause,
  onDelete,
}: {
  form: RoommateListingForm;
  userSignedIn: boolean;
  status: string;
  isSaving: boolean;
  onChange: (form: RoommateListingForm) => void;
  onSave: () => void;
  onPause: () => void;
  onDelete: () => void;
}) {
  const update = <Key extends keyof RoommateListingForm>(key: Key, value: RoommateListingForm[Key]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <section className={`overflow-hidden border border-border bg-card shadow-soft transition ${form.isListingEnabled ? "opacity-100" : "opacity-70"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <p className="text-xs font-black uppercase text-primary">Create your roommate listing</p>
          <h2 className="font-display text-3xl font-black">Let others find me</h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${form.paused ? "bg-warm/15 text-warm" : "bg-success/15 text-success"}`}>
          {form.paused ? "Paused" : form.isListingEnabled ? "Ready to publish" : "Draft"}
        </span>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-2">
        <SetupSection title="Personal Information">
          <TextField label="Name" value={form.name} placeholder="Your display name" onChange={(value) => update("name", value)} />
          <NumberField label="Age" value={form.age} onChange={(value) => update("age", value)} />
          <SelectField label="Gender" value={form.gender} options={["Woman", "Man", "Non-binary", "Other", "No Preference"]} onChange={(value) => update("gender", value)} />
          <TextField label="Course" value={form.course} placeholder="B.Tech, BBA, Design..." onChange={(value) => update("course", value)} />
          <TextField label="Year / Semester" value={form.year} placeholder="2nd year / Sem 4" onChange={(value) => update("year", value)} />
          <TextField label="College" value={form.college} placeholder="Nexora Institute" onChange={(value) => update("college", value)} />
          <TextField label="Department" value={form.department} placeholder="CSE, ECE, Marketing..." onChange={(value) => update("department", value)} />
          <TextField label="Languages" value={form.languages} placeholder="Hindi, English" onChange={(value) => update("languages", value)} />
        </SetupSection>

        <SetupSection title="Living Preferences">
          <NumberField label="Budget Min" value={form.budgetMin} onChange={(value) => update("budgetMin", value)} />
          <NumberField label="Budget Max" value={form.budgetMax} onChange={(value) => update("budgetMax", value)} />
          <TextField label="Move-in Date" type="date" value={form.moveInDate} onChange={(value) => update("moveInDate", value)} />
          <SelectField label="Housing Type" value={form.preferredHousing} options={["PG", "Hostel", "Flat", "Apartment", "Any"]} onChange={(value) => update("preferredHousing", value)} />
          <SelectField label="Room Type" value={form.roomType} options={["Single", "Double", "Triple", "Four Sharing", "Any"]} onChange={(value) => update("roomType", value)} />
          <SelectField label="Occupancy" value={form.occupancy} options={["Looking for 1 roommate", "2 roommates", "3 roommates", "4 roommates", "Any"]} onChange={(value) => update("occupancy", value)} />
          <SelectField label="Food" value={form.food} options={["Veg", "Non Veg", "Vegan", "Eggitarian", "No Preference"]} onChange={(value) => update("food", value)} />
          <SelectField label="Smoking" value={form.smoking} options={["Yes", "No", "Occasionally"]} onChange={(value) => update("smoking", value)} />
          <SelectField label="Alcohol" value={form.alcohol} options={["Yes", "No", "Occasionally"]} onChange={(value) => update("alcohol", value)} />
          <SelectField label="Visitors" value={form.visitors} options={["Allowed", "Sometimes", "Not Allowed"]} onChange={(value) => update("visitors", value)} />
          <SelectField label="Sleep Schedule" value={form.sleepSchedule} options={["Early", "Balanced", "Night Owl"]} onChange={(value) => update("sleepSchedule", value)} />
          <SelectField label="Study Style" value={form.studyStyle} options={["Silent", "Group Study", "Late Night", "Library"]} onChange={(value) => update("studyStyle", value)} />
          <SelectField label="Cleanliness" value={form.cleanliness} options={["Very Clean", "Average", "Flexible"]} onChange={(value) => update("cleanliness", value)} />
          <SelectField label="Noise Level" value={form.noiseLevel} options={["Silent", "Moderate", "Flexible"]} onChange={(value) => update("noiseLevel", value)} />
          <SelectField label="Music Preference" value={form.musicPreference} options={["No Music", "Music Friendly", "Headphones Only"]} onChange={(value) => update("musicPreference", value)} />
          <SelectField label="Cooking" value={form.cooking} options={["Daily", "Sometimes", "Never", "Flexible"]} onChange={(value) => update("cooking", value)} />
        </SetupSection>

        <SetupSection title="Preferences">
          <SelectField label="Religion Preference" value={form.religionPreference} options={["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "No Preference"]} onChange={(value) => update("religionPreference", value)} />
          <SelectField label="Preferred Roommate Gender" value={form.genderPreference} options={["Woman", "Man", "Non-binary", "Other", "No Preference"]} onChange={(value) => update("genderPreference", value)} />
          <NumberField label="Preferred Age Min" value={form.preferredAgeMin} onChange={(value) => update("preferredAgeMin", value)} />
          <NumberField label="Preferred Age Max" value={form.preferredAgeMax} onChange={(value) => update("preferredAgeMax", value)} />
          <TextField label="Area Preference" value={form.areaPreference} placeholder="Hostel block, nearby PG, apartment lane..." onChange={(value) => update("areaPreference", value)} />
          <TextField label="Campus" value={form.campus} placeholder="North Campus" onChange={(value) => update("campus", value)} />
          <TextField label="Current Address" value={form.currentAddress} placeholder="Hostel / PG / apartment address" onChange={(value) => update("currentAddress", value)} />
        </SetupSection>

        <SetupSection title="Amenities">
          <ToggleRow icon={<Check className="h-4 w-4" />} label="AC Required" checked={form.acRequired} onChange={(value) => update("acRequired", value)} />
          <ToggleRow icon={<Check className="h-4 w-4" />} label="Cooler Required" checked={form.coolerRequired} onChange={(value) => update("coolerRequired", value)} />
          <ToggleRow icon={<Check className="h-4 w-4" />} label="Attached Washroom" checked={form.attachedWashroom} onChange={(value) => update("attachedWashroom", value)} />
          <ToggleRow icon={<Check className="h-4 w-4" />} label="Balcony" checked={form.balcony} onChange={(value) => update("balcony", value)} />
          <ToggleRow icon={<Check className="h-4 w-4" />} label="WiFi" checked={form.wifi} onChange={(value) => update("wifi", value)} />
          <ToggleRow icon={<Check className="h-4 w-4" />} label="Parking" checked={form.parking} onChange={(value) => update("parking", value)} />
          <ToggleRow icon={<Check className="h-4 w-4" />} label="Laundry" checked={form.laundry} onChange={(value) => update("laundry", value)} />
          <ToggleRow icon={<Check className="h-4 w-4" />} label="Gym" checked={form.gym} onChange={(value) => update("gym", value)} />
        </SetupSection>

        <SetupSection title="About Yourself">
          <TextField label="Interests" value={form.interests} placeholder="Coding, gym, music..." onChange={(value) => update("interests", value)} />
          <TextField label="Instagram (optional)" value={form.instagram} placeholder="@username" onChange={(value) => update("instagram", value)} />
          <label className="xl:col-span-2">
            <span className="text-xs font-black uppercase text-muted-foreground">About Yourself</span>
            <textarea
              value={form.about}
              onChange={(event) => update("about", event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-border bg-background p-3 text-sm font-bold outline-none transition focus:border-primary"
              placeholder="Room habits, lifestyle, boundaries, routine, and what kind of roommate fits you."
            />
          </label>
        </SetupSection>

        <SetupSection title="Photos">
          <label className="xl:col-span-2">
            <span className="text-xs font-black uppercase text-muted-foreground">Photo URLs</span>
            <textarea
              value={form.photoUrls}
              onChange={(event) => update("photoUrls", event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-border bg-background p-3 text-sm font-bold outline-none transition focus:border-primary"
              placeholder="Add image URLs separated by commas. These sync to Supabase as photo_urls."
            />
          </label>
        </SetupSection>

        <SetupSection title="Verification">
          <InfoNotice icon={<ShieldCheck className="h-4 w-4" />} title="Social Verification" text="Your listing stores verification status in Supabase. Admin verification can move it from pending to verified." />
        </SetupSection>

        <SetupSection title="Profile Visibility">
          <SegmentedChoice
            value={form.visibility}
            options={[
              ["public", "Public"],
              ["campus_only", "Campus Only"],
              ["hidden", "Hidden"],
            ]}
            onChange={(value) => update("visibility", value as RoommateListingForm["visibility"])}
          />
        </SetupSection>

        <SetupSection title="Notification Preferences">
          <SelectField label="Contact Preference" value={form.contactPreference} options={["Chat Only", "Phone", "Instagram", "Campus Request"]} onChange={(value) => update("contactPreference", value)} />
          <ToggleRow icon={<Bell className="h-4 w-4" />} label="Receive Requests" checked={form.receiveRequests} onChange={(value) => update("receiveRequests", value)} />
          <ToggleRow icon={<MessageCircle className="h-4 w-4" />} label="Receive Chats" checked={form.receiveChats} onChange={(value) => update("receiveChats", value)} />
          <ToggleRow icon={<ShieldCheck className="h-4 w-4" />} label="Hide Phone" checked={form.hidePhone} onChange={(value) => update("hidePhone", value)} />
          <ToggleRow icon={<MapPin className="h-4 w-4" />} label="Hide Exact Location" checked={form.hideExactLocation} onChange={(value) => update("hideExactLocation", value)} />
        </SetupSection>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/70 p-4">
        <p className="text-sm font-bold text-muted-foreground">
          {userSignedIn ? status || "Changes save to Supabase when you publish." : "Sign in to sync this listing with Supabase."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onPause} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-black text-muted-foreground hover:bg-secondary">
            <PauseCircle className="h-4 w-4" />
            {form.paused ? "Resume Listing" : "Pause Listing"}
          </button>
          <button type="button" onClick={onDelete} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-4 text-sm font-black text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <Trash2 className="h-4 w-4" />
            Delete Listing
          </button>
          <button type="button" onClick={onSave} disabled={isSaving} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-black text-background shadow-soft disabled:opacity-60">
            <Check className="h-4 w-4" />
            {isSaving ? "Syncing..." : "Save & Sync"}
          </button>
        </div>
      </div>
    </section>
  );
}

function SetupSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-background/70 p-4">
      <h3 className="mb-3 text-xs font-black uppercase text-primary">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function TextField({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm font-bold outline-none transition focus:border-primary"
      />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span className="text-xs font-black uppercase text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm font-bold outline-none transition focus:border-primary"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm font-bold outline-none transition focus:border-primary"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function InfoNotice({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 sm:col-span-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-success/15 text-success">{icon}</span>
      <span>
        <strong className="block text-sm font-black">{title}</strong>
        <span className="text-xs font-bold leading-5 text-muted-foreground">{text}</span>
      </span>
    </div>
  );
}

function SegmentedChoice({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
      {options.map(([optionValue, label]) => (
        <button
          key={optionValue}
          type="button"
          onClick={() => onChange(optionValue)}
          className={`min-h-11 rounded-2xl border px-3 text-sm font-black transition ${
            value === optionValue ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-secondary"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-3 text-sm font-black transition ${
        checked ? "border-success bg-success/10 text-success" : "border-border bg-card text-muted-foreground"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className={`h-5 w-5 rounded-full border ${checked ? "border-success bg-success" : "border-border"}`} />
    </button>
  );
}

function RecommendationHeader({
  sortMode,
  topMatch,
  onSortChange,
}: {
  sortMode: SortMode;
  topMatch: Roommate;
  onSortChange: (mode: SortMode) => void;
}) {
  const sortOptions: Array<[SortMode, string]> = [
    ["highest_match", "Highest Match"],
    ["nearest", "Nearest"],
    ["budget", "Budget"],
    ["newest", "Newest"],
    ["recently_active", "Recently Active"],
    ["verified", "Verified"],
  ];

  return (
    <div className="mb-4 border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-primary">AI Roommate Recommendations</p>
          <h2 className="font-display text-3xl font-black">Sorted by compatibility</h2>
          <p className="mt-1 text-sm font-bold text-muted-foreground">
            Top recommendation: {topMatch.name} at {topMatch.compatibilityScore}% Match
          </p>
        </div>
        <div className="flex max-w-full gap-2 overflow-x-auto">
          {sortOptions.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onSortChange(value)}
              className={`min-h-10 shrink-0 rounded-full px-3 text-xs font-black transition ${
                sortMode === value ? "bg-foreground text-background shadow-soft" : "border border-border bg-background text-muted-foreground hover:bg-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoommateCard({ person, onSelect }: { person: Roommate; onSelect: () => void }) {
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect();
      }}
      className="group paper-lift cursor-pointer overflow-hidden border border-border bg-card transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-glow focus:outline-none focus:ring-4 focus:ring-primary/15"
    >
      <div className="relative h-44">
        <img src={person.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/22 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        <span className="absolute left-3 top-3 rounded-full bg-background/92 px-3 py-1 text-xs font-black text-primary shadow-soft">
          {person.match}% match
        </span>
        {person.verified && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-success/95 px-3 py-1 text-xs font-black text-success-foreground">
            <BadgeCheck className="h-3.5 w-3.5" />
            Verified
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl font-black">{person.name}</h2>
            <p className="text-sm font-bold text-muted-foreground">
              {person.course} {person.branch} · Sem {person.semester}
            </p>
          </div>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-black text-primary">{person.age}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold">
          <InfoLine icon={<Wallet className="h-4 w-4 text-warm" />}>
            {formatBudget(person.budgetMin, person.budgetMax)}
          </InfoLine>
          <InfoLine icon={<MapPin className="h-4 w-4 text-success" />}>{person.area}</InfoLine>
          <InfoLine icon={<Moon className="h-4 w-4 text-electric" />}>{person.sleepSchedule}</InfoLine>
          <InfoLine icon={<CalendarDays className="h-4 w-4 text-primary" />}>{formatMoveIn(person.moveInDate)}</InfoLine>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[person.roomType, person.food, person.cleanliness, person.studyStyle, person.personality].map((tag) => (
            <span key={tag} className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-black text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-2 rounded-2xl bg-secondary/60 p-3 text-xs font-bold text-muted-foreground">
          <span className="flex items-center gap-2">
            <Languages className="h-3.5 w-3.5 text-primary" />
            {person.languages.join(", ")}
          </span>
          <span className="flex items-center gap-2">
            <BriefcaseBusiness className="h-3.5 w-3.5 text-primary" />
            {person.professionalStatus} · {person.availability}
          </span>
        </div>

        <button type="button" className="mt-4 w-full rounded-full bg-foreground px-4 py-3 text-sm font-black text-background transition hover:-translate-y-0.5">
          View roommate details
        </button>
      </div>
    </article>
  );
}

function RoommateDetailsPanel({ person, userId, onClose }: { person: Roommate; userId: string | null; onClose: () => void }) {
  const [actionStatus, setActionStatus] = useState("");

  const syncAction = async (kind: "save" | "chat" | "visit" | "request") => {
    if (!userId || !person.listingId || !person.ownerId) {
      setActionStatus("Sign in and open a synced Supabase listing to use this action.");
      return;
    }

    if (userId === person.ownerId) {
      setActionStatus("This is your listing.");
      return;
    }

    if ((kind === "chat" && person.receiveChats === false) || ((kind === "visit" || kind === "request") && person.receiveRequests === false)) {
      setActionStatus("This student has paused that action for now.");
      return;
    }

    const actionMap = {
      save: () =>
        supabase
          .from("roommate_saved_profiles")
          .upsert({ listing_id: person.listingId, user_id: userId }, { onConflict: "listing_id,user_id" }),
      chat: () =>
        supabase.from("roommate_messages").insert({
          listing_id: person.listingId,
          sender_id: userId,
          receiver_id: person.ownerId,
          body: "Hi, I found your roommate listing and would like to chat.",
        }),
      visit: () =>
        supabase.from("roommate_visit_schedules").insert({
          listing_id: person.listingId,
          requester_id: userId,
          owner_id: person.ownerId,
          note: "Visit requested from roommate listing.",
        }),
      request: () =>
        supabase.from("roommate_requests").insert({
          listing_id: person.listingId,
          requester_id: userId,
          owner_id: person.ownerId,
          message: "I am interested in becoming roommates.",
        }),
    };

    setActionStatus("Syncing...");
    const { error } = await actionMap[kind]();

    if (error) {
      console.error("Roommate action failed", error);
      setActionStatus("Could not sync action. Check Supabase tables and permissions.");
      return;
    }

    setActionStatus(
      {
        save: "Saved to Supabase.",
        chat: "Message sent.",
        visit: "Visit request scheduled.",
        request: "Roommate request sent.",
      }[kind],
    );
  };

  const profileFacts = [
    ["Name", person.name],
    ["Age", `${person.age}`],
    ["College", person.college],
    ["Branch", person.branch],
    ["Semester", `Semester ${person.semester}`],
    ["Gender", person.gender],
    ["Religion", person.religion],
    ["Languages", person.languages.join(", ")],
    ["Current Address", person.currentAddress],
    ["Preferred Area", person.preferredArea],
    ["Budget", formatBudget(person.budgetMin, person.budgetMax)],
    ["Move-in Date", formatFullDate(person.moveInDate)],
  ];

  const lifestyleFacts = [
    ["Food Preference", person.food],
    ["Sleep Schedule", `${person.sleepSchedule} · ${person.wakeUpTime}`],
    ["Study Style", person.studyStyle],
    ["Cleanliness", person.cleanliness],
    ["Smoking", person.smoking],
    ["Alcohol", person.alcohol],
    ["Visitors", person.visitors],
  ];

  return (
    <div className="roommate-detail-overlay fixed inset-0 z-[90] bg-foreground/35 backdrop-blur-md" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close roommate details" className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} />
      <aside className="roommate-detail-panel absolute right-0 top-0 z-10 flex h-full w-full max-w-[620px] flex-col overflow-hidden border-l border-white/50 bg-background/82 shadow-glow backdrop-blur-2xl">
        <div className="relative h-72 shrink-0 overflow-hidden">
          <img src={person.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/12 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/70 bg-background/80 text-foreground shadow-soft backdrop-blur-xl transition hover:scale-105 hover:bg-foreground hover:text-background"
            aria-label="Close roommate details"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-4 right-4 text-background">
            <div className="flex flex-wrap items-center gap-2">
              {person.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-xs font-black text-success-foreground">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
              <span className="rounded-full bg-background/18 px-3 py-1 text-xs font-black backdrop-blur-xl">
                {person.profileCompletion}% profile complete
              </span>
            </div>
            <h2 className="mt-3 font-display text-4xl font-black">{person.name}, {person.age}</h2>
            <p className="text-sm font-bold text-background/80">{person.college} · {person.branch} · Sem {person.semester}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <section className="glass rounded-[28px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-primary">Compatibility Score</p>
                <h3 className="font-display text-3xl font-black">{person.compatibilityScore}%</h3>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-lg font-black text-success">
                {person.match}%
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full rounded-full bg-success" style={{ width: `${person.profileCompletion}%` }} />
            </div>
          </section>

          <DetailsSection title="Profile">
            <div className="grid gap-2 sm:grid-cols-2">
              {profileFacts.map(([label, value]) => (
                <DetailTile key={label} label={label} value={value} />
              ))}
            </div>
          </DetailsSection>

          <DetailsSection title="Room Sharing">
            <div className="grid grid-cols-4 gap-2">
              {["Single", "Double", "Triple", "Any"].map((item) => (
                <span
                  key={item}
                  className={`grid min-h-11 place-items-center rounded-2xl border px-2 text-sm font-black ${
                    person.roomSharing === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          </DetailsSection>

          <DetailsSection title="Lifestyle">
            <div className="grid gap-2 sm:grid-cols-2">
              {lifestyleFacts.map(([label, value]) => (
                <DetailTile key={label} label={label} value={value} />
              ))}
            </div>
          </DetailsSection>

          <DetailsSection title="About Me">
            <p className="rounded-3xl border border-border bg-card p-4 text-sm font-semibold leading-7 text-muted-foreground">
              {person.aboutMe}
            </p>
          </DetailsSection>

          <DetailsSection title="Interests">
            <TagCloud tags={person.interests} />
          </DetailsSection>

          <DetailsSection title="Hobbies">
            <TagCloud tags={person.hobbies} />
          </DetailsSection>

          <DetailsSection title="Daily Routine">
            <p className="rounded-3xl border border-border bg-card p-4 text-sm font-semibold leading-7 text-muted-foreground">
              {person.dailyRoutine}
            </p>
          </DetailsSection>

          <DetailsSection title="Compatibility">
            <div className="grid gap-2">
              <DetailTile label="Common Interests" value={person.commonInterests.join(", ")} />
              <DetailTile label="Common Schedule" value={person.commonSchedule} />
              <DetailTile label="Mutual Friends (Future Ready)" value={person.mutualFriends} />
            </div>
          </DetailsSection>

          <DetailsSection title="Gallery">
            <div className="grid grid-cols-3 gap-2">
              {person.gallery.map((image, index) => (
                <img key={`${person.id}-gallery-${index}`} src={image} alt="" className="aspect-square rounded-3xl object-cover shadow-soft" />
              ))}
            </div>
          </DetailsSection>

          <DetailsSection title="Social Verification">
            <div className="grid gap-2">
              {person.socialVerification.map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm font-black">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  {item}
                </span>
              ))}
            </div>
          </DetailsSection>
        </div>

        <div className="border-t border-white/50 bg-background/86 p-4 backdrop-blur-2xl">
          <div className="grid grid-cols-2 gap-2">
            <PanelAction icon={<Heart className="h-4 w-4" />} label="Save" onClick={() => void syncAction("save")} />
            <PanelAction icon={<MessageCircle className="h-4 w-4" />} label="Chat" onClick={() => void syncAction("chat")} />
            <PanelAction icon={<CalendarCheck className="h-4 w-4" />} label="Schedule Visit" onClick={() => void syncAction("visit")} />
            <PanelAction icon={<Handshake className="h-4 w-4" />} label="Send Request" strong onClick={() => void syncAction("request")} />
          </div>
          {actionStatus && <p className="mt-2 text-center text-xs font-black text-muted-foreground">{actionStatus}</p>}
          <button type="button" className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full text-xs font-black text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
            <Flag className="h-3.5 w-3.5" />
            Report Profile
          </button>
        </div>
      </aside>
    </div>
  );
}

function DetailsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="mb-2 text-xs font-black uppercase text-primary">{title}</h3>
      {children}
    </section>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/82 p-3 shadow-soft backdrop-blur">
      <p className="text-[0.68rem] font-black uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-black leading-5">{value}</p>
    </div>
  );
}

function TagCloud({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full border border-border bg-card/82 px-3 py-2 text-xs font-black text-muted-foreground shadow-soft">
          {tag}
        </span>
      ))}
    </div>
  );
}

function PanelAction({
  icon,
  label,
  strong = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  strong?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-3 text-sm font-black transition hover:-translate-y-0.5 ${
        strong ? "bg-foreground text-background shadow-soft" : "border border-border bg-card text-foreground hover:bg-secondary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function FilterDrawer({
  filters,
  previewCount,
  onChange,
  onClose,
  onClear,
  onApply,
}: {
  filters: Filters;
  previewCount: number;
  onChange: (filters: Filters) => void;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
}) {
  const update = <Key extends keyof Filters>(key: Key, value: Filters[Key]) => {
    onChange({ ...filters, [key]: value });
  };

  const updateRange = (key: "budgetMin" | "budgetMax" | "ageMin" | "ageMax", value: number) => {
    const next = { ...filters, [key]: value };
    if (next.budgetMin > next.budgetMax) {
      if (key === "budgetMin") next.budgetMax = value;
      if (key === "budgetMax") next.budgetMin = value;
    }
    if (next.ageMin > next.ageMax) {
      if (key === "ageMin") next.ageMax = value;
      if (key === "ageMax") next.ageMin = value;
    }
    onChange(next);
  };

  return (
    <div className="fixed inset-0 z-[80] bg-foreground/35 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close filters" className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} />
      <aside className="absolute bottom-0 left-0 right-0 z-10 flex max-h-[90svh] flex-col overflow-hidden rounded-t-[28px] border border-border bg-background shadow-glow md:bottom-auto md:left-auto md:top-0 md:h-full md:max-h-none md:w-[460px] md:rounded-none">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
          <div>
            <p className="text-xs font-black uppercase text-primary">Roommate Filters</p>
            <h2 className="font-display text-2xl font-black">{previewCount} matching students</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground transition hover:bg-foreground hover:text-background"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <FilterSection title="Budget">
            <div className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center justify-between text-sm font-black">
                <span>{formatBudget(filters.budgetMin, filters.budgetMax)}</span>
                <span className="text-muted-foreground">Range Slider</span>
              </div>
              <div className="mt-3 grid gap-3">
                <input
                  type="range"
                  min="5000"
                  max="20000"
                  step="500"
                  value={filters.budgetMin}
                  onChange={(event) => updateRange("budgetMin", Number(event.target.value))}
                />
                <input
                  type="range"
                  min="5000"
                  max="20000"
                  step="500"
                  value={filters.budgetMax}
                  onChange={(event) => updateRange("budgetMax", Number(event.target.value))}
                />
              </div>
            </div>
          </FilterSection>

          {choiceSections.map((section) => (
            <FilterSection key={section.title} title={section.title}>
              {section.fields.map(([key, label]) => (
                <SelectFilter
                  key={key}
                  label={label}
                  value={String(filters[key])}
                  options={[...optionGroups[key]]}
                  onChange={(value) => update(key, value)}
                />
              ))}
            </FilterSection>
          ))}

          <FilterSection title="Age Range">
            <div className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center justify-between text-sm font-black">
                <span>{filters.ageMin} - {filters.ageMax} years</span>
                <span className="text-muted-foreground">Age Range</span>
              </div>
              <div className="mt-3 grid gap-3">
                <input
                  type="range"
                  min="18"
                  max="30"
                  value={filters.ageMin}
                  onChange={(event) => updateRange("ageMin", Number(event.target.value))}
                />
                <input
                  type="range"
                  min="18"
                  max="30"
                  value={filters.ageMax}
                  onChange={(event) => updateRange("ageMax", Number(event.target.value))}
                />
              </div>
            </div>
          </FilterSection>

          <FilterSection title="Move-in Date">
            <label className="block rounded-2xl border border-border bg-card p-3">
              <span className="text-xs font-black uppercase text-muted-foreground">Move-in Date</span>
              <input
                type="date"
                value={filters.moveInDate}
                onChange={(event) => update("moveInDate", event.target.value)}
                className="mt-2 w-full bg-transparent text-sm font-black outline-none"
              />
            </label>
          </FilterSection>

          <FilterSection title="Verification">
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border bg-card p-3">
              <span>
                <span className="block text-sm font-black">Verified only</span>
                <span className="text-xs font-bold text-muted-foreground">Show profiles with campus verification</span>
              </span>
              <input
                type="checkbox"
                checked={filters.verifiedOnly}
                onChange={(event) => update("verifiedOnly", event.target.checked)}
                className="h-5 w-5 accent-primary"
              />
            </label>
          </FilterSection>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border bg-background p-4">
          <button
            type="button"
            onClick={onClear}
            className="min-h-12 rounded-full border border-border bg-card px-4 text-sm font-black text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            Clear Filters
          </button>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-black text-background transition hover:-translate-y-0.5"
          >
            <Check className="h-4 w-4" />
            Apply Filters
          </button>
        </div>
      </aside>
    </div>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-2xl border border-border bg-card p-3">
      <span className="text-xs font-black uppercase text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full bg-transparent text-sm font-black outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-xs font-black uppercase text-primary">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function FilterPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-border bg-card px-3 text-xs font-black text-muted-foreground shadow-soft">
      {children}
    </span>
  );
}

function InfoLine({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-2 rounded-2xl bg-background px-3 py-2">
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

function filterRoommates(items: Roommate[], filters: Filters) {
  return items.filter((person) => {
    return (
      matches(filters.campus, person.campus) &&
      matches(filters.college, person.college) &&
      matches(filters.course, person.course) &&
      matches(filters.branch, person.branch) &&
      matches(filters.semester, person.semester) &&
      matches(filters.gender, person.gender) &&
      matches(filters.religion, person.religion) &&
      matches(filters.roomType, person.roomType) &&
      matches(filters.occupancy, person.occupancy) &&
      person.budgetMin <= filters.budgetMax &&
      person.budgetMax >= filters.budgetMin &&
      matches(filters.location, person.location) &&
      matches(filters.food, person.food) &&
      matches(filters.smoking, person.smoking) &&
      matches(filters.alcohol, person.alcohol) &&
      matches(filters.sleepSchedule, person.sleepSchedule) &&
      matches(filters.wakeUpTime, person.wakeUpTime) &&
      matches(filters.cleanliness, person.cleanliness) &&
      matches(filters.visitors, person.visitors) &&
      matches(filters.studyStyle, person.studyStyle) &&
      matches(filters.personality, person.personality) &&
      matchesLanguage(filters.language, person.languages) &&
      matches(filters.pets, person.pets) &&
      matchesProfessional(filters.professionalStatus, person.professionalStatus) &&
      matches(filters.relationshipPreference, person.relationshipPreference) &&
      person.age >= filters.ageMin &&
      person.age <= filters.ageMax &&
      matchesMoveIn(filters.moveInDate, person.moveInDate) &&
      (!filters.verifiedOnly || person.verified) &&
      matches(filters.availability, person.availability)
    );
  });
}

function applyCompatibility(
  person: Roommate,
  preferences: RoommateListingForm,
  profile: {
    full_name: string | null;
    college_name?: string | null;
  } | null,
) {
  const reasons: string[] = [];
  let score = 42;

  const add = (condition: boolean, points: number, reason: string) => {
    if (!condition) return;
    score += points;
    reasons.push(reason);
  };

  const preferredLanguages = parseCsv(preferences.languages);
  const preferredInterests = parseCsv(preferences.interests);
  const allPreferredInterests = preferredInterests;
  const profileBranch = "";
  const profileSemester = "";
  const budgetOverlap = person.budgetMin <= preferences.budgetMax && person.budgetMax >= preferences.budgetMin;
  const sameArea =
    Boolean(preferences.areaPreference) &&
    normalizeText(person.area).includes(normalizeText(preferences.areaPreference));
  const sameBranch = Boolean(profileBranch) && normalizeText(person.branch) === normalizeText(profileBranch);
  const sameSemester = Boolean(profileSemester) && person.semester === profileSemester;
  const sharedLanguages = person.languages.filter((language) =>
    preferredLanguages.some((preferred) => normalizeText(preferred) === normalizeText(language)),
  );
  const sharedInterests = person.interests.filter((interest) =>
    allPreferredInterests.some((preferred) => normalizeText(preferred) === normalizeText(interest)),
  );

  add(budgetOverlap, 10, "Same Budget");
  add(sameArea, 8, "Same Area Preference");
  add(sameBranch, 9, "Same Branch");
  add(sameSemester, 5, "Same Semester");
  add(person.sleepSchedule === preferences.sleepSchedule, 8, "Same Sleep Schedule");
  add(matchesPreference(preferences.food, person.food), 7, person.food === "Veg" ? "Both Vegetarian" : "Same Food Preference");
  add(matchesPreference(preferences.smoking, person.smoking), 5, "Smoking Preference Match");
  add(matchesPreference(preferences.alcohol, person.alcohol), 5, "Alcohol Preference Match");
  add(matchesPreference(preferences.religionPreference, person.religion), 4, "Religion Preference Match");
  add(matchesPreference(preferences.genderPreference, person.gender), 4, "Gender Preference Match");
  add(person.age >= preferences.preferredAgeMin && person.age <= preferences.preferredAgeMax, 4, "Preferred Age Range");
  add(matchesPreference(preferences.preferredHousing, person.roomType), 5, "Housing Type Match");
  add(matchesPreference(preferences.roomType, person.roomSharing), 5, "Room Sharing Match");
  add(sharedLanguages.length > 0, 5, `${sharedLanguages.length} Shared Language${sharedLanguages.length > 1 ? "s" : ""}`);
  add(person.studyStyle === preferences.studyStyle, 7, "Similar Study Style");
  add(person.cleanliness === preferences.cleanliness, 5, "Cleanliness Match");
  add(person.visitors === preferences.visitors, 4, "Visitor Preference Match");
  add(sharedInterests.length > 0, 7, `${sharedInterests.length} Common Interest${sharedInterests.length > 1 ? "s" : ""}`);
  add(Math.abs(person.age - preferences.age) <= 2, 4, "Similar Age");
  add(routineSimilarity(person.dailyRoutine, preferences.dailyRoutine), 4, "Compatible Daily Routine");
  add(moveInClose(person.moveInDate, preferences.moveInDate), 4, "Move-in Timeline Match");
  add(person.verified, 3, "Verified Profile");

  const compatibilityScore = Math.min(98, Math.max(55, score));
  const matchReasons = reasons.length ? reasons : ["Compatible campus profile", "Shared roommate preferences"];

  return {
    ...person,
    match: compatibilityScore,
    compatibilityScore,
    matchReasons,
    commonInterests: sharedInterests.length ? sharedInterests : person.commonInterests,
    commonSchedule: routineSimilarity(person.dailyRoutine, preferences.dailyRoutine)
      ? "Daily routines show strong overlap."
      : person.commonSchedule,
  };
}

function sortRoommates(items: Roommate[], sortMode: SortMode, preferences: RoommateListingForm) {
  const sorted = [...items];

  return sorted.sort((a, b) => {
    if (sortMode === "highest_match") return b.compatibilityScore - a.compatibilityScore;
    if (sortMode === "nearest") return areaDistanceScore(a, preferences) - areaDistanceScore(b, preferences);
    if (sortMode === "budget") return budgetDistance(a, preferences) - budgetDistance(b, preferences);
    if (sortMode === "newest") return dateValue(b.createdAt) - dateValue(a.createdAt);
    if (sortMode === "recently_active") return dateValue(b.recentlyActiveAt) - dateValue(a.recentlyActiveAt);
    if (sortMode === "verified") return Number(b.verified) - Number(a.verified) || b.compatibilityScore - a.compatibilityScore;
    return 0;
  });
}

function matchesPreference(preference: string, value: string) {
  return preference === "Any" || preference === "No Preference" || normalizeText(preference) === normalizeText(value);
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function routineSimilarity(a: string, b: string) {
  if (!a || !b) return false;
  const aWords = new Set(normalizeText(a).split(/\W+/).filter(Boolean));
  return normalizeText(b)
    .split(/\W+/)
    .filter(Boolean)
    .some((word) => aWords.has(word));
}

function moveInClose(a: string, b: string) {
  if (!a || !b) return false;
  const diff = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return diff <= 1000 * 60 * 60 * 24 * 21;
}

function areaDistanceScore(person: Roommate, preferences: RoommateListingForm) {
  if (!preferences.areaPreference) return 1;
  return normalizeText(person.area).includes(normalizeText(preferences.areaPreference)) ? 0 : 1;
}

function budgetDistance(person: Roommate, preferences: RoommateListingForm) {
  const personMid = (person.budgetMin + person.budgetMax) / 2;
  const preferredMid = (preferences.budgetMin + preferences.budgetMax) / 2;
  return Math.abs(personMid - preferredMid);
}

function dateValue(value?: string) {
  return value ? new Date(value).getTime() : 0;
}

function matches(filterValue: string, itemValue: string) {
  return filterValue === "Any" || filterValue === "No Preference" || filterValue === itemValue;
}

function matchesLanguage(filterValue: string, itemLanguages: string[]) {
  return filterValue === "Any" || itemLanguages.includes(filterValue);
}

function matchesProfessional(filterValue: string, itemValue: string) {
  return filterValue === "Both" || itemValue === "Both" || filterValue === itemValue;
}

function matchesMoveIn(filterValue: string, itemDate: string) {
  if (!filterValue) return true;
  return new Date(itemDate).getTime() <= new Date(filterValue).getTime();
}

function getActiveFilterCount(filters: Filters) {
  return Object.entries(filters).filter(([key, value]) => {
    const defaultValue = defaultFilters[key as keyof Filters];
    return value !== defaultValue;
  }).length;
}

function getActiveFilterLabels(filters: Filters) {
  const labels: string[] = [];
  const entries: Array<[keyof Filters, string]> = [
    ["campus", filters.campus],
    ["college", filters.college],
    ["course", filters.course],
    ["branch", filters.branch],
    ["gender", filters.gender],
    ["religion", filters.religion],
    ["roomType", filters.roomType],
    ["location", filters.location],
    ["food", filters.food],
    ["sleepSchedule", filters.sleepSchedule],
    ["availability", filters.availability],
  ];

  entries.forEach(([key, value]) => {
    if (value !== defaultFilters[key]) labels.push(value);
  });

  if (filters.verifiedOnly) labels.push("Verified only");
  if (filters.moveInDate) labels.push(`Move by ${formatMoveIn(filters.moveInDate)}`);

  return labels.slice(0, 8);
}

function listingRowToForm(row: RoommateListingRow): RoommateListingForm {
  return {
    isLookingEnabled: row.is_looking_enabled,
    isListingEnabled: row.is_listing_enabled,
    name: row.display_name ?? "",
    gender: row.gender ?? row.gender_preference ?? defaultListingForm.gender,
    course: row.course ?? "",
    year: row.semester ?? "",
    college: row.college ?? "",
    department: row.branch ?? "",
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    moveInDate: row.move_in_date ?? "",
    roomType: row.room_type ?? defaultListingForm.roomType,
    occupancy: row.occupancy ?? defaultListingForm.occupancy,
    preferredHousing: row.room_type ?? defaultListingForm.preferredHousing,
    food: row.food ?? defaultListingForm.food,
    smoking: row.smoking ?? defaultListingForm.smoking,
    alcohol: row.alcohol ?? defaultListingForm.alcohol,
    visitors: row.visitors ?? defaultListingForm.visitors,
    sleepSchedule: row.sleep_schedule ?? defaultListingForm.sleepSchedule,
    studyStyle: row.study_style ?? defaultListingForm.studyStyle,
    cleanliness: row.cleanliness ?? defaultListingForm.cleanliness,
    noiseLevel: defaultListingForm.noiseLevel,
    musicPreference: defaultListingForm.musicPreference,
    cooking: defaultListingForm.cooking,
    religionPreference: row.religion_preference ?? defaultListingForm.religionPreference,
    genderPreference: row.gender_preference ?? defaultListingForm.genderPreference,
    preferredAgeMin: defaultListingForm.preferredAgeMin,
    preferredAgeMax: defaultListingForm.preferredAgeMax,
    areaPreference: row.area_preference ?? "",
    about: row.about ?? "",
    languages: (row.languages ?? []).join(", "),
    interests: (row.interests ?? []).join(", "),
    age: row.age ?? defaultListingForm.age,
    dailyRoutine: row.daily_routine ?? "",
    photoUrls: (row.photo_urls ?? []).join(", "),
    acRequired: defaultListingForm.acRequired,
    coolerRequired: defaultListingForm.coolerRequired,
    attachedWashroom: defaultListingForm.attachedWashroom,
    balcony: defaultListingForm.balcony,
    wifi: defaultListingForm.wifi,
    parking: defaultListingForm.parking,
    laundry: defaultListingForm.laundry,
    gym: defaultListingForm.gym,
    hidePhone: defaultListingForm.hidePhone,
    hideExactLocation: defaultListingForm.hideExactLocation,
    contactPreference: defaultListingForm.contactPreference,
    instagram: defaultListingForm.instagram,
    visibility: row.visibility,
    receiveRequests: row.receive_requests,
    receiveChats: row.receive_chats,
    paused: row.paused,
    campus: row.campus ?? "",
    currentAddress: row.current_address ?? "",
  };
}

function listingFormToRow(
  form: RoommateListingForm,
  userId: string,
  profile: {
    full_name?: string | null;
    college_name?: string | null;
  } | null,
) {
  const fullName = profile?.full_name?.trim() || "";
  const amenitySummary = [
    form.acRequired && "AC",
    form.coolerRequired && "Cooler",
    form.attachedWashroom && "Attached washroom",
    form.balcony && "Balcony",
    form.wifi && "WiFi",
    form.parking && "Parking",
    form.laundry && "Laundry",
    form.gym && "Gym",
  ].filter(Boolean).join(", ");
  const enrichedAbout = [
    form.about,
    form.preferredHousing && `Preferred housing: ${form.preferredHousing}`,
    amenitySummary && `Amenities: ${amenitySummary}`,
    form.noiseLevel && `Noise: ${form.noiseLevel}`,
    form.musicPreference && `Music: ${form.musicPreference}`,
    form.cooking && `Cooking: ${form.cooking}`,
    form.instagram && `Instagram: ${form.instagram}`,
    form.hideExactLocation && "Exact location hidden",
    form.hidePhone && "Phone hidden",
  ].filter(Boolean).join("\n");
  
  return {
    user_id: userId,
    is_looking_enabled: form.isLookingEnabled,
    is_listing_enabled: form.isListingEnabled,
    visibility: form.visibility,
    paused: form.paused,
    budget_min: form.budgetMin,
    budget_max: form.budgetMax,
    move_in_date: form.moveInDate || null,
    room_type: form.preferredHousing || form.roomType,
    occupancy: form.occupancy,
    food: form.food,
    smoking: form.smoking,
    alcohol: form.alcohol,
    visitors: form.visitors,
    sleep_schedule: form.sleepSchedule,
    study_style: form.studyStyle,
    cleanliness: form.cleanliness,
    religion_preference: form.religionPreference,
    gender_preference: form.genderPreference,
    area_preference: form.areaPreference,
    about: enrichedAbout,
    languages: parseCsv(form.languages),
    interests: parseCsv(form.interests),
    age: form.age,
    daily_routine: form.dailyRoutine,
    photo_urls: parsePhotoUrls(form.photoUrls),
    receive_requests: form.receiveRequests,
    receive_chats: form.receiveChats,
    display_name: form.name || fullName || "Nexora student",
    avatar_url: null,
    course: form.course || null,
    college: form.college || profile?.college_name || null,
    branch: form.department || null,
    semester: form.year || null,
    gender: form.gender || null,
    campus: form.campus,
    current_address: form.currentAddress,
    updated_at: new Date().toISOString(),
  };
}

function mapListingToRoommate(row: RoommateListingRow): Roommate {
  const photos = row.photo_urls?.filter(Boolean) ?? [];
  const name = row.display_name ?? "Nexora student";
  const branch = row.branch ?? "Open";
  const semester = row.semester ?? "NA";
  const food = row.food ?? "No Preference";
  const sleep = row.sleep_schedule ?? "Balanced";
  const study = row.study_style ?? "Library";
  const languages = row.languages?.length ? row.languages : ["English"];
  const interests = row.interests?.length ? row.interests : ["Campus living", food, study];

  return {
    id: numericIdFromString(row.id),
    listingId: row.id,
    ownerId: row.user_id,
    name,
    image: photos[0] || row.avatar_url || student1,
    campus: row.campus ?? "Campus",
    college: row.college ?? "Nexora College",
    course: row.course ?? "Student",
    branch,
    semester,
    gender: row.gender ?? row.gender_preference ?? "No Preference",
    religion: row.religion_preference ?? "No Preference",
    roomType: row.room_type ?? "Any",
    occupancy: row.occupancy ?? "Any",
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    location: row.area_preference || "Walking distance",
    area: row.area_preference || row.campus || "Campus area",
    currentAddress: row.current_address ?? "Shared after request",
    preferredArea: row.area_preference || "Campus area",
    food,
    smoking: row.smoking ?? "No",
    alcohol: row.alcohol ?? "No",
    sleepSchedule: sleep,
    wakeUpTime: "Flexible",
    cleanliness: row.cleanliness ?? "Average",
    visitors: row.visitors ?? "Sometimes",
    studyStyle: study,
    personality: "Ambivert",
    languages,
    pets: "No preference",
    professionalStatus: "Student",
    relationshipPreference: "No Preference",
    age: row.age ?? 21,
    moveInDate: row.move_in_date ?? new Date().toISOString().slice(0, 10),
    verified: row.verification_status === "verified",
    availability: row.paused ? "Paused" : "Available now",
    match: 92,
    profileCompletion: calculateListingCompletion(row),
    roomSharing: row.room_type ?? "Any",
    aboutMe: row.about ?? "Roommate listing synced from Supabase.",
    interests,
    hobbies: ["Shared routines"],
    dailyRoutine: row.daily_routine ?? `${sleep} schedule with ${study.toLowerCase()} study preference.`,
    compatibilityScore: 92,
    commonInterests: interests.slice(0, 3),
    commonSchedule: `${sleep} schedule preference.`,
    mutualFriends: "Future ready",
    gallery: photos.length > 0 ? photos : [student1, student2, student3],
    socialVerification: [row.verification_status === "verified" ? "Supabase verified listing" : "Verification pending"],
    receiveRequests: row.receive_requests,
    receiveChats: row.receive_chats,
    createdAt: row.created_at ?? undefined,
    recentlyActiveAt: row.recently_active_at ?? row.updated_at ?? undefined,
  };
}

function parsePhotoUrls(value: string) {
  return parseCsv(value);
}

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function calculateListingCompletion(row: RoommateListingRow) {
  const fields = [
    row.budget_min,
    row.budget_max,
    row.move_in_date,
    row.room_type,
    row.occupancy,
    row.food,
    row.sleep_schedule,
    row.study_style,
    row.area_preference,
    row.about,
    row.visibility,
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function numericIdFromString(value: string) {
  return value.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function formatBudget(min: number, max: number) {
  return `₹${Math.round(min / 1000)}k-₹${Math.round(max / 1000)}k`;
}

function formatMoveIn(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value));
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
