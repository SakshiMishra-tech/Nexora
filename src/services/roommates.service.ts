/**
 * roommates.service.ts
 * All Supabase operations for the Nexora Roommates module.
 */
import { supabase } from "@/lib/supabase";
import type {
  RoommateListingRow,
  RoommateRequestRow,
  RoommateProfile,
  RoommateProfileForm,
  RoommateFilters,
  SortMode,
  CompatibilityResult,
  CompatibilityFactor,
  ReportReason,
} from "@/types/roommates";

// ── Constants ─────────────────────────────────────────────────

const PAGE_SIZE = 20;

/** Columns fetched in Discover (excludes private fields) */
const LISTING_COLUMNS = [
  "id", "user_id", "is_listing_enabled", "paused", "visibility",
  "budget_min", "budget_max", "move_in_date", "room_type", "housing_type",
  "occupancy", "food", "smoking", "alcohol", "visitors",
  "sleep_schedule", "study_style", "cleanliness",
  "gender_preference", "religion_preference", "area_preference",
  "about", "languages", "interests", "amenities",
  "age", "daily_routine", "photo_urls",
  "verification_status", "receive_requests", "receive_chats",
  "display_name", "avatar_url", "course", "college", "branch",
  "semester", "gender", "campus", "current_address",
  "pets", "working_professional",
  "recently_active_at", "created_at", "updated_at",
].join(", ");

/** Columns fetched for a connected profile (includes private fields) */
const CONNECTED_LISTING_COLUMNS = LISTING_COLUMNS + ", phone_number, instagram_handle";

// ── Discover / Listings ───────────────────────────────────────

export type FetchListingsOptions = {
  filters: RoommateFilters;
  page: number;
  viewerId: string;
};

export type FetchListingsResult = {
  profiles: RoommateProfile[];
  total: number;
};

/**
 * Fetch a paginated, server-filtered page of roommate listings.
 * Hard filters applied at query level. Soft compatibility computed client-side.
 */
export async function fetchListings(
  options: FetchListingsOptions,
): Promise<FetchListingsResult> {
  const { filters, page, viewerId } = options;
  const offset = page * PAGE_SIZE;

  let query = supabase
    .from("roommate_listings")
    .select(LISTING_COLUMNS + ", count:id.count()", { count: "exact" })
    .eq("is_listing_enabled", true)
    .eq("paused", false)
    .in("visibility", ["public", "campus_only"])
    .neq("user_id", viewerId)  // never show own profile
    // Budget overlap: subject's range must overlap viewer's range
    .gte("budget_max", filters.budgetMin)
    .lte("budget_min", filters.budgetMax)
    .order("recently_active_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filters.campus !== "Any") query = query.eq("campus", filters.campus);
  if (filters.gender !== "Any") query = query.eq("gender", filters.gender);
  if (filters.verifiedOnly) query = query.eq("verification_status", "verified");
  if (filters.moveInBy) query = query.lte("move_in_date", filters.moveInBy);
  if (filters.food !== "Any") query = query.eq("food", filters.food);
  if (filters.smoking !== "Any") query = query.eq("smoking", filters.smoking);
  if (filters.alcohol !== "Any") query = query.eq("alcohol", filters.alcohol);
  if (filters.sleepSchedule !== "Any") query = query.eq("sleep_schedule", filters.sleepSchedule);
  if (filters.cleanliness !== "Any") query = query.eq("cleanliness", filters.cleanliness);
  if (filters.visitors !== "Any") query = query.eq("visitors", filters.visitors);
  if (filters.studyStyle !== "Any") query = query.eq("study_style", filters.studyStyle);
  if (filters.roomType !== "Any") query = query.eq("room_type", filters.roomType);
  if (filters.housingType !== "Any") query = query.eq("housing_type", filters.housingType);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    profiles: ((data as unknown as RoommateListingRow[]) ?? []).map(rowToProfile),
    total: count ?? 0,
  };
}

/** Fetch a single listing by its listing ID */
export async function fetchListing(listingId: string): Promise<RoommateProfile | null> {
  const { data, error } = await supabase
    .from("roommate_listings")
    .select(LISTING_COLUMNS)
    .eq("id", listingId)
    .maybeSingle<RoommateListingRow>();
  if (error) throw error;
  return data ? rowToProfile(data) : null;
}

/** Fetch a connected user's profile — includes private fields */
export async function fetchConnectedListing(listingId: string): Promise<RoommateProfile | null> {
  const { data, error } = await supabase
    .from("roommate_listings")
    .select(CONNECTED_LISTING_COLUMNS)
    .eq("id", listingId)
    .maybeSingle<RoommateListingRow>();
  if (error) throw error;
  if (!data) return null;
  const profile = rowToProfile(data);
  profile.phoneNumber = data.phone_number;
  profile.instagramHandle = data.instagram_handle;
  profile.currentAddress = data.current_address;
  return profile;
}

/** Fetch the current user's own listing */
export async function fetchMyListing(userId: string): Promise<RoommateProfile | null> {
  const { data, error } = await supabase
    .from("roommate_listings")
    .select(CONNECTED_LISTING_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle<RoommateListingRow>();
  if (error) throw error;
  if (!data) return null;
  const profile = rowToProfile(data);
  profile.phoneNumber = data.phone_number;
  profile.instagramHandle = data.instagram_handle;
  profile.currentAddress = data.current_address;
  return profile;
}

/** Upsert (create or update) the current user's roommate listing */
export async function upsertListing(
  form: RoommateProfileForm,
  userId: string,
  existingId?: string,
): Promise<string> {
  const row = formToRow(form, userId);
  if (existingId) {
    const { error } = await supabase
      .from("roommate_listings")
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq("id", existingId)
      .eq("user_id", userId);
    if (error) throw error;
    return existingId;
  } else {
    const { data, error } = await supabase
      .from("roommate_listings")
      .insert({ ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select("id")
      .single<{ id: string }>();
    if (error) throw error;
    return data.id;
  }
}

/** Pause or unpause a listing */
export async function setListingPaused(listingId: string, userId: string, paused: boolean): Promise<void> {
  const { error } = await supabase
    .from("roommate_listings")
    .update({ paused, updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("user_id", userId);
  if (error) throw error;
}

/** Delete the user's own listing */
export async function deleteListing(listingId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("roommate_listings")
    .delete()
    .eq("id", listingId)
    .eq("user_id", userId);
  if (error) throw error;
}

/** Fetch all distinct campus values from active listings */
export async function fetchCampuses(): Promise<string[]> {
  const { data, error } = await supabase
    .from("roommate_listings")
    .select("campus")
    .eq("is_listing_enabled", true)
    .eq("paused", false)
    .not("campus", "is", null);
  if (error) throw error;
  const unique = [...new Set((data ?? []).map((r: { campus: string }) => r.campus).filter(Boolean))];
  return unique.sort();
}

// ── Saved Profiles ────────────────────────────────────────────

/** Fetch all listing IDs saved by the current user */
export async function fetchSavedIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("roommate_saved_profiles")
    .select("listing_id")
    .eq("user_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r: { listing_id: string }) => r.listing_id));
}

/** Fetch full saved profiles (for Saved tab) */
export async function fetchSavedProfiles(userId: string): Promise<RoommateProfile[]> {
  const { data, error } = await supabase
    .from("roommate_saved_profiles")
    .select(`listing_id, roommate_listings(${LISTING_COLUMNS})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as unknown as { roommate_listings: RoommateListingRow | null }[]) ?? [])
    .map((r: { roommate_listings: RoommateListingRow | null }) => r.roommate_listings)
    .filter((l): l is RoommateListingRow => l !== null)
    .map(rowToProfile);
}

/** Save a profile */
export async function saveProfile(listingId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("roommate_saved_profiles")
    .upsert({ listing_id: listingId, user_id: userId });
  if (error) throw error;
}

/** Unsave a profile */
export async function unsaveProfile(listingId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("roommate_saved_profiles")
    .delete()
    .eq("listing_id", listingId)
    .eq("user_id", userId);
  if (error) throw error;
}

// ── Requests ──────────────────────────────────────────────────

export type RequestWithProfile = RoommateRequestRow & {
  otherProfile: RoommateProfile | null;
};

/** Fetch all requests involving the user (as requester or owner) */
export async function fetchRequests(userId: string): Promise<{
  received: RequestWithProfile[];
  sent: RequestWithProfile[];
}> {
  const { data: allRequests, error } = await supabase
    .from("roommate_requests")
    .select("*")
    .or(`requester_id.eq.${userId},owner_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const requests = (allRequests ?? []) as RoommateRequestRow[];
  const received: RequestWithProfile[] = [];
  const sent: RequestWithProfile[] = [];

  for (const req of requests) {
    if (req.owner_id === userId) {
      // Fetch requester's listing
      const profile = await fetchListingByOwnerId(req.requester_id);
      received.push({ ...req, otherProfile: profile });
    } else {
      // Fetch owner's listing
      const profile = await fetchListing(req.listing_id);
      sent.push({ ...req, otherProfile: profile });
    }
  }

  return { received, sent };
}

/** Fetch listing by owner's user_id (used for request enrichment) */
async function fetchListingByOwnerId(userId: string): Promise<RoommateProfile | null> {
  const { data, error } = await supabase
    .from("roommate_listings")
    .select(LISTING_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle<RoommateListingRow>();
  if (error) return null;
  return data ? rowToProfile(data) : null;
}

/** Fetch a map of listing_id → request status for the viewer */
export async function fetchRequestMap(userId: string): Promise<Map<string, RoommateRequestRow>> {
  const { data, error } = await supabase
    .from("roommate_requests")
    .select("*")
    .or(`requester_id.eq.${userId},owner_id.eq.${userId}`);
  if (error) throw error;

  const map = new Map<string, RoommateRequestRow>();
  for (const row of (data ?? []) as RoommateRequestRow[]) {
    map.set(row.listing_id, row);
  }
  return map;
}

/** Send a connection request */
export async function sendRequest(
  listingId: string,
  requesterId: string,
  ownerId: string,
  message?: string,
): Promise<RoommateRequestRow> {
  const { data, error } = await supabase
    .from("roommate_requests")
    .insert({
      listing_id: listingId,
      requester_id: requesterId,
      owner_id: ownerId,
      status: "pending",
      message: message ?? null,
    })
    .select("*")
    .single<RoommateRequestRow>();
  if (error) throw error;

  // Create notification for the listing owner
  await supabase
    .from("roommate_notifications")
    .insert({ user_id: ownerId, type: "request_received", reference_id: data.id });

  return data;
}

/** Accept or decline a request (owner only) */
export async function respondToRequest(
  requestId: string,
  ownerId: string,
  status: "accepted" | "declined",
): Promise<void> {
  const { data: req, error: fetchErr } = await supabase
    .from("roommate_requests")
    .select("requester_id")
    .eq("id", requestId)
    .eq("owner_id", ownerId)
    .single<{ requester_id: string }>();
  if (fetchErr) throw fetchErr;

  const { error } = await supabase
    .from("roommate_requests")
    .update({ status })
    .eq("id", requestId)
    .eq("owner_id", ownerId);
  if (error) throw error;

  // Notify requester
  const notifType = status === "accepted" ? "request_accepted" : "request_declined";
  await supabase
    .from("roommate_notifications")
    .insert({ user_id: req.requester_id, type: notifType, reference_id: requestId });
}

/** Cancel a sent request (requester only) */
export async function cancelRequest(requestId: string, requesterId: string): Promise<void> {
  const { error } = await supabase
    .from("roommate_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("requester_id", requesterId);
  if (error) throw error;
}

// ── Notifications ─────────────────────────────────────────────

/** Get count of unseen notifications */
export async function fetchNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("roommate_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("seen", false);
  if (error) throw error;
  return count ?? 0;
}

/** Mark all notifications as seen */
export async function markNotificationsSeen(userId: string): Promise<void> {
  await supabase
    .from("roommate_notifications")
    .update({ seen: true })
    .eq("user_id", userId)
    .eq("seen", false);
}

// ── Block / Report ────────────────────────────────────────────

/** Block a user */
export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase
    .from("roommate_blocks")
    .upsert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

/** Get IDs of users blocked by the viewer */
export async function fetchBlockedIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("roommate_blocks")
    .select("blocked_id")
    .eq("blocker_id", userId);
  if (error) throw error;
  return new Set((data ?? []).map((r: { blocked_id: string }) => r.blocked_id));
}

/** Report a listing */
export async function reportListing(
  reporterId: string,
  listingId: string,
  reason: ReportReason,
  notes?: string,
): Promise<void> {
  const { error } = await supabase
    .from("roommate_reports")
    .upsert({ reporter_id: reporterId, reported_listing_id: listingId, reason, notes: notes ?? null });
  if (error) throw error;
}

// ── Compatibility Engine ──────────────────────────────────────

/**
 * Compute a meaningful, explainable compatibility score between two profiles.
 * Score is 0–100 with NO artificial floor.
 */
export function computeCompatibility(
  viewer: RoommateProfile,
  subject: RoommateProfile,
): CompatibilityResult {
  const factors: CompatibilityFactor[] = [];

  const check = (
    key: string,
    label: string,
    weight: number,
    vVal: string | null | undefined,
    sVal: string | null | undefined,
    isMatch: (a: string, b: string) => boolean,
  ) => {
    if (!vVal || !sVal) {
      // Missing data → half credit (rewards profile completeness)
      factors.push({ key, label, weight, score: weight / 2, matched: null });
      return;
    }
    const matched = isMatch(vVal, sVal);
    factors.push({ key, label, weight, score: matched ? weight : 0, matched });
  };

  // Budget overlap — proportional (0–20 pts)
  const lo = Math.max(viewer.budgetMin, subject.budgetMin);
  const hi = Math.min(viewer.budgetMax, subject.budgetMax);
  const overlapRange = Math.max(0, hi - lo);
  const totalRange =
    Math.max(viewer.budgetMax, subject.budgetMax) -
    Math.min(viewer.budgetMin, subject.budgetMin);
  const budgetScore = totalRange > 0 ? Math.round((overlapRange / totalRange) * 20) : 0;
  factors.push({
    key: "budget",
    label: "Budget Range",
    weight: 20,
    score: budgetScore,
    matched: budgetScore >= 10,
  });

  const exact = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const pref = (a: string, b: string) =>
    exact(a, b) ||
    a.toLowerCase() === "no preference" ||
    b.toLowerCase() === "no preference";

  check("sleep", "Sleep Schedule", 15, viewer.sleepSchedule, subject.sleepSchedule, exact);
  check("food", "Food Preference", 10, viewer.food, subject.food, pref);
  check("smoking", "Smoking", 10, viewer.smoking, subject.smoking, pref);
  check("clean", "Cleanliness", 8, viewer.cleanliness, subject.cleanliness, exact);
  check("study", "Study Style", 8, viewer.studyStyle, subject.studyStyle, exact);
  check("visitors", "Visitor Policy", 5, viewer.visitors, subject.visitors, exact);
  check("room", "Room Type", 5, viewer.roomType, subject.roomType, pref);

  // Move-in date proximity (0–7 pts)
  if (viewer.moveInDate && subject.moveInDate) {
    const days =
      Math.abs(+new Date(viewer.moveInDate) - +new Date(subject.moveInDate)) / 864e5;
    const s = days <= 7 ? 7 : days <= 30 ? 5 : days <= 60 ? 3 : 0;
    factors.push({ key: "movein", label: "Move-in Date", weight: 7, score: s, matched: s >= 5 });
  } else {
    factors.push({ key: "movein", label: "Move-in Date", weight: 7, score: 3.5, matched: null });
  }

  // Area preference text overlap (0–7 pts)
  const hasV = viewer.areaPreference?.trim();
  const hasS = subject.areaPreference?.trim();
  const aMatch = Boolean(
    hasV &&
      hasS &&
      (hasS.toLowerCase().includes(hasV.toLowerCase()) ||
        hasV.toLowerCase().includes(hasS.toLowerCase())),
  );
  factors.push({
    key: "area",
    label: "Area Preference",
    weight: 7,
    score: aMatch ? 7 : hasV || hasS ? 0 : 3.5,
    matched: aMatch ? true : hasV && hasS ? false : null,
  });

  // Language overlap (0–3 pts)
  const sharedLangs = viewer.languages.filter((l) => subject.languages.includes(l));
  factors.push({
    key: "lang",
    label: "Languages",
    weight: 3,
    score: sharedLangs.length > 0 ? 3 : 0,
    matched: sharedLangs.length > 0,
  });

  // Interests overlap (0–2 pts)
  const sharedInts = viewer.interests.filter((i) => subject.interests.includes(i));
  factors.push({
    key: "interests",
    label: "Interests",
    weight: 2,
    score: sharedInts.length > 0 ? 2 : 0,
    matched: sharedInts.length > 0,
  });

  const raw = factors.reduce((sum, f) => sum + f.score, 0);
  const percentage = Math.round(Math.min(100, Math.max(0, raw)));

  return {
    percentage,
    factors,
    topMatches: factors.filter((f) => f.matched === true).map((f) => f.label).slice(0, 5),
    topDifferences: factors.filter((f) => f.matched === false).map((f) => f.label).slice(0, 3),
  };
}

/** Sort profiles by mode */
export function sortProfiles(profiles: RoommateProfile[], mode: SortMode): RoommateProfile[] {
  const sorted = [...profiles];
  switch (mode) {
    case "compatibility":
      return sorted.sort(
        (a, b) => (b.compatibility?.percentage ?? 0) - (a.compatibility?.percentage ?? 0),
      );
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
      );
    case "recently_active":
      return sorted.sort(
        (a, b) =>
          new Date(b.recentlyActiveAt ?? b.createdAt ?? 0).getTime() -
          new Date(a.recentlyActiveAt ?? a.createdAt ?? 0).getTime(),
      );
    case "budget":
      return sorted.sort(
        (a, b) => (a.budgetMin + a.budgetMax) / 2 - (b.budgetMin + b.budgetMax) / 2,
      );
    case "verified":
      return sorted.sort((a, b) => Number(b.verified) - Number(a.verified));
    default:
      return sorted;
  }
}

/** Count active filters (differs from default) */
export function countActiveFilters(filters: RoommateFilters): number {
  const { defaultFilters } = require("@/types/roommates");
  return Object.entries(filters).filter(
    ([k, v]) => v !== (defaultFilters as Record<string, unknown>)[k],
  ).length;
}

// ── Mappers ───────────────────────────────────────────────────

export function rowToProfile(row: RoommateListingRow): RoommateProfile {
  return {
    id: row.id,
    ownerId: row.user_id,
    displayName: row.display_name ?? "Nexora Student",
    avatarUrl: row.avatar_url ?? (row.photo_urls?.[0] ?? null),
    age: row.age,
    gender: row.gender ?? null,
    college: row.college ?? null,
    branch: row.branch ?? null,
    semester: row.semester ?? null,
    campus: row.campus ?? null,
    course: row.course ?? null,
    verified: row.verification_status === "verified",
    recentlyActiveAt: row.recently_active_at ?? null,
    createdAt: row.created_at ?? null,
    workingProfessional: row.working_professional ?? false,

    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    moveInDate: row.move_in_date ?? null,
    roomType: row.room_type ?? null,
    housingType: row.housing_type ?? null,
    occupancy: row.occupancy ?? null,
    areaPreference: row.area_preference ?? null,

    food: row.food ?? null,
    smoking: row.smoking ?? null,
    alcohol: row.alcohol ?? null,
    sleepSchedule: row.sleep_schedule ?? null,
    studyStyle: row.study_style ?? null,
    cleanliness: row.cleanliness ?? null,
    visitors: row.visitors ?? null,
    pets: row.pets ?? null,

    genderPreference: row.gender_preference ?? null,
    religionPreference: row.religion_preference ?? null,
    languages: row.languages ?? [],
    interests: row.interests ?? [],
    amenities: row.amenities ?? [],

    about: row.about ?? null,
    dailyRoutine: row.daily_routine ?? null,

    visibility: row.visibility,
    receiveRequests: row.receive_requests,
    receiveChats: row.receive_chats,
    paused: row.paused,
  };
}

function formToRow(form: RoommateProfileForm, userId: string) {
  return {
    user_id: userId,
    is_listing_enabled: !form.paused,
    is_looking_enabled: true,
    display_name: form.displayName || null,
    age: form.age || null,
    gender: form.gender || null,
    course: form.course || null,
    branch: form.branch || null,
    semester: form.semester || null,
    college: form.college || null,
    campus: form.campus || null,
    languages: form.languages,
    about: form.about || null,
    avatar_url: form.avatarUrl || null,
    working_professional: form.workingProfessional,

    budget_min: form.budgetMin,
    budget_max: form.budgetMax,
    move_in_date: form.moveInDate || null,
    room_type: form.roomType || null,
    housing_type: form.housingType || null,
    area_preference: form.areaPreference || null,

    food: form.food || null,
    smoking: form.smoking || null,
    alcohol: form.alcohol || null,
    sleep_schedule: form.sleepSchedule || null,
    study_style: form.studyStyle || null,
    cleanliness: form.cleanliness || null,
    visitors: form.visitors || null,

    gender_preference: form.genderPreference || null,
    interests: form.interests,
    amenities: form.amenities,
    pets: form.pets || null,
    daily_routine: form.dailyRoutine || null,
    visibility: form.visibility,
    receive_requests: form.receiveRequests,
    receive_chats: form.receiveChats,
    paused: form.paused,

    phone_number: form.sharePhone && form.phoneNumber ? form.phoneNumber : null,
    instagram_handle: form.shareInstagram && form.instagramHandle ? form.instagramHandle : null,

    recently_active_at: new Date().toISOString(),
  };
}

// ── Utility Formatters ────────────────────────────────────────

export function formatBudget(min: number, max: number): string {
  const fmt = (n: number) => (n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${n}`);
  return `${fmt(min)}–${fmt(max)}`;
}

export function formatMoveIn(date: string | null): string {
  if (!date) return "Flexible";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(
    new Date(date),
  );
}

export function formatActiveAgo(date: string | null): string {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 864e5);
  if (days === 0) return "Active today";
  if (days === 1) return "Active yesterday";
  if (days < 7) return `Active ${days}d ago`;
  if (days < 30) return `Active ${Math.floor(days / 7)}w ago`;
  return `Active ${Math.floor(days / 30)}mo ago`;
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
