/**
 * dating.service.ts
 * All Supabase operations for the Campus Connect module.
 * Covers: profile fetch, upsert, and photo upload / delete.
 */
import { supabase } from "@/lib/supabase";
import type { DatingProfile, DatingMatch } from "@/types/dating";

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

/**
 * Record a user's swipe action (like/pass/save) on a profile.
 * Returns a match object if the action resulted in a mutual match.
 */
export async function recordSwipe(
  senderId: string,
  receiverId: string,
  action: 'like' | 'pass' | 'save'
): Promise<{ match: DatingMatch | null }> {
  // 1. Record the swipe
  const { error: swipeError } = await supabase
    .from("dating_swipes")
    .insert({ sender_id: senderId, receiver_id: receiverId, action });
    
  if (swipeError && swipeError.code !== '23505') { // Ignore unique constraint violation
    throw swipeError;
  }

  // 2. Check for mutual match if action is 'like'
  if (action === 'like') {
    const { data: reciprocal, error: recError } = await supabase
      .from("dating_swipes")
      .select("*")
      .eq("sender_id", receiverId)
      .eq("receiver_id", senderId)
      .eq("action", "like")
      .maybeSingle();

    if (recError) throw recError;

    if (reciprocal) {
      // It's a match! Create match record
      // Always order IDs to prevent duplicate reverse rows
      const u1 = senderId < receiverId ? senderId : receiverId;
      const u2 = senderId < receiverId ? receiverId : senderId;
      
      const { data: match, error: matchError } = await supabase
        .from("dating_matches")
        .insert({ user1_id: u1, user2_id: u2 })
        .select()
        .single();
        
      if (matchError && matchError.code !== '23505') {
        throw matchError;
      }
      
      // If there was a unique constraint, it means match exists. We should fetch it.
      if (matchError && matchError.code === '23505') {
         const { data: existingMatch } = await supabase
           .from("dating_matches")
           .select("*")
           .eq("user1_id", u1)
           .eq("user2_id", u2)
           .single();
         return { match: existingMatch };
      }

      return { match: match || null };
    }
  }

  return { match: null };
}
