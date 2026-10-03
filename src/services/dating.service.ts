/**
 * dating.service.ts
 * All Supabase operations for the Campus Connect module.
 * Covers: profile fetch, upsert, and photo upload / delete.
 */
import { supabase } from "@/lib/supabase";
import type { DatingProfile } from "@/types/dating";

// ── Profile ───────────────────────────────────────────────────

/**
 * Fetch the authenticated user's dating profile.
 * Returns null when no row exists yet (first-time user).
 */
export async function fetchMyDatingProfile(
  userId: string,
): Promise<DatingProfile | null> {
  const { data, error } = await supabase
    .from("dating_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<DatingProfile>();

  if (error) throw error;
  return data;
}

export type UpsertDatingProfilePayload = Omit<
  DatingProfile,
  "id" | "created_at" | "updated_at"
>;

/**
 * Create or update the current user's dating profile.
 * Uses upsert so both creation and editing work with one call.
 */
export async function upsertDatingProfile(
  userId: string,
  payload: UpsertDatingProfilePayload,
): Promise<DatingProfile> {
  const { data, error } = await supabase
    .from("dating_profiles")
    .upsert({ id: userId, ...payload })
    .select("*")
    .single<DatingProfile>();

  if (error) throw error;
  return data;
}

// ── Photo Upload ──────────────────────────────────────────────

const BUCKET = "dating_photos";

/**
 * Upload a photo file to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function uploadDatingPhoto(
  userId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete a photo from Supabase Storage by its public URL.
 * Silently ignores storage errors (file already gone, etc.).
 */
export async function deleteDatingPhoto(publicUrl: string): Promise<void> {
  try {
    const url = new URL(publicUrl);
    // Path after /object/public/{bucket}/
    const parts = url.pathname.split(`/object/public/${BUCKET}/`);
    if (parts.length < 2) return;
    const filePath = decodeURIComponent(parts[1]);
    await supabase.storage.from(BUCKET).remove([filePath]);
  } catch {
    // Non-critical — silently swallow
  }
}

// ── Discover Feed ─────────────────────────────────────────────

/**
 * Fetch a list of active dating profiles for the Discover feed.
 * Excludes the current user and any paused profiles.
 */
export async function fetchDiscoverProfiles(
  currentUserId: string,
  limit: number = 20
): Promise<DatingProfile[]> {
  const { data, error } = await supabase
    .from("dating_profiles")
    .select("*")
    .neq("id", currentUserId)
    .eq("pause_discover", false)
    .limit(limit);

  if (error) throw error;
  return data || [];
}
