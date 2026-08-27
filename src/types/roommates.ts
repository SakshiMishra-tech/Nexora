/**
 * roommates.ts — All TypeScript types for the Nexora Roommates module.
 */

// ── Database Row Shapes ───────────────────────────────────────

export type RoommateListingRow = {
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
  housing_type: string | null;
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
  amenities: string[] | null;
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
  housing_type_pref: string | null;
  pets: string | null;
  working_professional: boolean;
  phone_number: string | null;
  instagram_handle: string | null;
  recently_active_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type RoommateRequestRow = {
  id: string;
  listing_id: string;
  requester_id: string;
  owner_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  message: string | null;
  created_at: string;
};

export type RoommateNotificationRow = {
  id: string;
  user_id: string;
  type: "request_received" | "request_accepted" | "request_declined";
  reference_id: string | null;
  seen: boolean;
  created_at: string;
};

// ── Domain Types ─────────────────────────────────────────────

/** Rich roommate profile used throughout the UI */
export type RoommateProfile = {
  // Identity
  id: string;              // listing id (uuid)
  ownerId: string;         // auth user id
  displayName: string;
  avatarUrl: string | null;
  age: number | null;
  gender: string | null;
  college: string | null;
  branch: string | null;
  semester: string | null;
  campus: string | null;
  course: string | null;
  verified: boolean;
  recentlyActiveAt: string | null;
  createdAt: string | null;
  workingProfessional: boolean;

  // Room & Budget
  budgetMin: number;
  budgetMax: number;
  moveInDate: string | null;
  roomType: string | null;
  housingType: string | null;
  occupancy: string | null;
  areaPreference: string | null;

  // Lifestyle
  food: string | null;
  smoking: string | null;
  alcohol: string | null;
  sleepSchedule: string | null;
  studyStyle: string | null;
  cleanliness: string | null;
  visitors: string | null;
  pets: string | null;

  // Preferences
  genderPreference: string | null;
  religionPreference: string | null;
  languages: string[];
  interests: string[];
  amenities: string[];

  // Content
  about: string | null;
  dailyRoutine: string | null;

  // Settings
  visibility: "public" | "campus_only" | "hidden";
  receiveRequests: boolean;
  receiveChats: boolean;
  paused: boolean;

  // Private (only loaded for connected profiles)
  phoneNumber?: string | null;
  instagramHandle?: string | null;
  currentAddress?: string | null;

  // Computed client-side
  compatibility?: CompatibilityResult | null;
};

// ── Profile Form State ────────────────────────────────────────

export type RoommateProfileForm = {
  // Step 1 — About You
  displayName: string;
  age: number;
  gender: string;
  course: string;
  branch: string;
  semester: string;
  college: string;
  campus: string;
  languages: string[];
  about: string;
  avatarUrl: string;
  workingProfessional: boolean;

  // Step 2 — Room & Budget
  budgetMin: number;
  budgetMax: number;
  moveInDate: string;
  roomType: string;
  housingType: string;
  areaPreference: string;

  // Step 3 — Lifestyle
  food: string;
  smoking: string;
  alcohol: string;
  sleepSchedule: string;
  studyStyle: string;
  cleanliness: string;
  visitors: string;

  // Step 4 — Preferences & Privacy
  genderPreference: string;
  preferredAgeMin: number;
  preferredAgeMax: number;
  interests: string[];
  amenities: string[];
  pets: string;
  dailyRoutine: string;
  visibility: "public" | "campus_only" | "hidden";
  receiveRequests: boolean;
  receiveChats: boolean;
  phoneNumber: string;
  instagramHandle: string;
  sharePhone: boolean;
  shareInstagram: boolean;
  paused: boolean;
};

export const defaultProfileForm: RoommateProfileForm = {
  displayName: "",
  age: 20,
  gender: "No Preference",
  course: "",
  branch: "",
  semester: "",
  college: "",
  campus: "",
  languages: ["English"],
  about: "",
  avatarUrl: "",
  workingProfessional: false,

  budgetMin: 7000,
  budgetMax: 12000,
  moveInDate: "",
  roomType: "Any",
  housingType: "Any",
  areaPreference: "",

  food: "No Preference",
  smoking: "No Preference",
  alcohol: "No Preference",
  sleepSchedule: "Balanced",
  studyStyle: "Flexible",
  cleanliness: "Average",
  visitors: "Sometimes",

  genderPreference: "Any",
  preferredAgeMin: 18,
  preferredAgeMax: 28,
  interests: [],
  amenities: [],
  pets: "No Preference",
  dailyRoutine: "",
  visibility: "campus_only",
  receiveRequests: true,
  receiveChats: true,
  phoneNumber: "",
  instagramHandle: "",
  sharePhone: false,
  shareInstagram: false,
  paused: false,
};

// ── Filters ───────────────────────────────────────────────────

export type RoommateFilters = {
  campus: string;
  budgetMin: number;
  budgetMax: number;
  gender: string;
  moveInBy: string;
  verifiedOnly: boolean;
  food: string;
  smoking: string;
  alcohol: string;
  sleepSchedule: string;
  cleanliness: string;
  visitors: string;
  studyStyle: string;
  roomType: string;
  housingType: string;
};

export const defaultFilters: RoommateFilters = {
  campus: "Any",
  budgetMin: 3000,
  budgetMax: 30000,
  gender: "Any",
  moveInBy: "",
  verifiedOnly: false,
  food: "Any",
  smoking: "Any",
  alcohol: "Any",
  sleepSchedule: "Any",
  cleanliness: "Any",
  visitors: "Any",
  studyStyle: "Any",
  roomType: "Any",
  housingType: "Any",
};

// ── Sort Mode ─────────────────────────────────────────────────

export type SortMode =
  | "compatibility"
  | "newest"
  | "recently_active"
  | "budget"
  | "verified";

// ── Compatibility ─────────────────────────────────────────────

export type CompatibilityFactor = {
  key: string;
  label: string;
  weight: number;
  score: number;
  /** true = matched, false = mismatched, null = missing data on either side */
  matched: boolean | null;
};

export type CompatibilityResult = {
  /** 0–100 rounded, NO artificial floor */
  percentage: number;
  factors: CompatibilityFactor[];
  /** Labels of top matched factors (green pills) */
  topMatches: string[];
  /** Labels of top mismatched factors (muted pills) */
  topDifferences: string[];
};

// ── Connection / Requests ─────────────────────────────────────

export type RequestStatus =
  | "none"
  | "sent"
  | "received"
  | "accepted"
  | "declined"
  | "cancelled";

export type ConnectionRequest = RoommateRequestRow & {
  /** Enriched profile of the other party */
  otherParty?: Pick<RoommateProfile, "id" | "displayName" | "avatarUrl" | "college" | "campus">;
};

// ── Report Reasons ────────────────────────────────────────────

export const REPORT_REASONS = [
  "Fake Profile",
  "Inappropriate Content",
  "Spam",
  "Scam",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

// ── Option Constants ──────────────────────────────────────────

export const FOOD_OPTIONS = ["Veg", "Non-Veg", "Vegan", "Eggetarian", "No Preference"] as const;
export const SMOKING_OPTIONS = ["Non-smoker", "Occasional", "Smoker", "No Preference"] as const;
export const ALCOHOL_OPTIONS = ["No", "Occasional", "Yes", "No Preference"] as const;
export const SLEEP_OPTIONS = ["Early Bird", "Balanced", "Night Owl"] as const;
export const STUDY_OPTIONS = ["Library", "Room", "Cafe", "Group", "Flexible"] as const;
export const CLEANLINESS_OPTIONS = ["Very Clean", "Average", "Flexible"] as const;
export const VISITORS_OPTIONS = ["No visitors", "Sometimes", "Flexible"] as const;
export const ROOM_TYPE_OPTIONS = ["Single", "Double", "Triple", "Any"] as const;
export const HOUSING_TYPE_OPTIONS = ["PG", "Hostel", "Flat", "Apartment", "Any"] as const;
export const GENDER_OPTIONS = ["Woman", "Man", "Non-binary", "Prefer not to say"] as const;
export const GENDER_PREF_OPTIONS = ["Woman", "Man", "Any"] as const;
export const PETS_OPTIONS = ["No pets", "Pet friendly", "Has pets", "No Preference"] as const;
export const VISIBILITY_OPTIONS = ["public", "campus_only", "hidden"] as const;

export const LANGUAGE_CHIPS = [
  "English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam",
  "Marathi", "Bengali", "Gujarati", "Punjabi", "Urdu", "Odia",
] as const;

export const INTEREST_CHIPS = [
  "Gym", "Music", "Gaming", "Reading", "Cooking", "Photography",
  "Travel", "Art", "Sports", "Movies", "Coding", "Yoga",
  "Dance", "Theatre", "Cycling", "Hiking",
] as const;

export const AMENITY_CHIPS = [
  "AC", "WiFi", "Attached Washroom", "Balcony", "Parking",
  "Laundry", "Gym", "CCTV", "Power Backup", "Cooking Allowed",
] as const;
