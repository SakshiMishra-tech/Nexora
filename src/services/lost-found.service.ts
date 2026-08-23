import { supabase } from "@/lib/supabase";
import { getOrCreateConversation, reportUser, sendMessage } from "@/services/chat.service";

export type LostFoundType = "lost" | "found";
export type LostFoundStatus = "active" | "recovered" | "resolved" | "draft" | "ACTIVE" | "RECOVERED" | "RESOLVED" | "DRAFT";
export type LostFoundSort = "recent" | "oldest";

export type LostFoundSavedPost = {
  user_id: string;
  post_id: string;
  created_at: string;
  post?: LostFoundItem;
};

export type LostFoundNotificationType = "message" | "contact" | "resolved" | "reopened";

export type LostFoundNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  post_id: string | null;
  type: LostFoundNotificationType;
  is_read: boolean;
  created_at: string;
  post?: LostFoundItem;
};

export type LostFoundItem = {
  id: string;
  user_id: string;
  type: LostFoundType;
  item_name: string;
  category: string;
  description: string;
  location: string;
  campus: string;
  occurred_at: string;
  image_url: string | null;
  contact_preference: string[];
  status: LostFoundStatus;
  poster_name: string;
  created_at: string;
  updated_at: string;
};

export type LostFoundFilters = {
  query?: string;
  type?: LostFoundType | "all";
  category?: string;
  campus?: string;
  date?: string;
  sort?: LostFoundSort;
  mineOnly?: boolean;
  includeRecovered?: boolean;
  status?: LostFoundStatus | LostFoundStatus[] | "all";
  /** Exclude a specific user's posts (used to hide own posts from the public feed) */
  excludeUserId?: string;
};

export type LostFoundFormValues = {
  type: LostFoundType;
  item_name: string;
  category: string;
  description: string;
  location: string;
  campus: string;
  occurred_at: string;
  contact_preference: string[];
  phone?: string;
  whatsapp?: string;
  image?: File | null;
};

export const LOST_FOUND_CATEGORIES = [
  "Electronics",
  "Documents",
  "Accessories",
  "Books",
  "Clothing",
  "Other",
];

export const LOST_FOUND_CAMPUSES = [
  "Nexora Main Campus",
  "South Campus",
  "North Campus",
];

const STORAGE_BUCKET = "lost-found";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function cleanText(value: string) {
  return value.trim();
}

function escapeLike(value: string) {
  return value.replace(/[%_]/g, "\\$&");
}

function getImagePathFromUrl(url: string | null) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  if (!url.includes(marker)) return null;
  return decodeURIComponent(url.split(marker)[1] || "");
}

async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to use Lost & Found.");
  return user;
}

async function getCurrentPosterName() {
  const user = await getCurrentUser();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle<{ full_name: string | null; email: string | null }>();

  return cleanText(data?.full_name || user.user_metadata?.full_name || user.email || "Student");
}

export async function getUserContactInfo() {
  const user = await getCurrentUser();
  return getPosterContactInfo(user.id);
}

export async function getPosterContactInfo(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("phone, whatsapp")
    .eq("id", userId)
    .maybeSingle<{ phone: string | null; whatsapp: string | null }>();
  return {
    phone: data?.phone || "",
    whatsapp: data?.whatsapp || "",
  };
}

export async function updateUserContactInfo(phone: string, whatsapp: string) {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from("profiles")
    .update({ 
      phone: phone || null, 
      whatsapp: whatsapp || null 
    })
    .eq("id", user.id);
  if (error) throw new Error("Failed to save contact info.");
}

async function uploadLostFoundImage(file: File, userId: string) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Please upload a JPG, PNG, or WebP image.");
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Photo must be smaller than 5 MB.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${safeExtension}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: false });

  if (error) {
    if (import.meta.env.DEV) {
      console.error("[lost-found] Storage upload error:", error);
    }
    throw new Error("Failed to upload the image. Please try again.");
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function getLostFoundItems(filters: LostFoundFilters = {}) {
  let query = supabase.from("lost_found_items").select("*");

  if (filters.status && filters.status !== "all") {
    if (Array.isArray(filters.status)) {
      query = query.in("status", filters.status.map(s => s.toUpperCase()));
    } else {
      query = query.eq("status", filters.status.toUpperCase());
    }
  } else if (!filters.includeRecovered && !filters.mineOnly) {
    // Public feed: only ACTIVE posts
    query = query.eq("status", "ACTIVE");
  } else if (filters.mineOnly && !filters.status) {
    // My posts without an explicit status filter: exclude drafts from generic view
    query = query.neq("status", "DRAFT");
  }

  if (filters.type && filters.type !== "all") query = query.eq("type", filters.type.toUpperCase());
  if (filters.category && filters.category !== "all") query = query.eq("category", filters.category);
  if (filters.campus && filters.campus !== "all") query = query.eq("campus", filters.campus);
  if (filters.date) {
    query = query
      .gte("occurred_at", `${filters.date}T00:00:00`)
      .lt("occurred_at", `${filters.date}T23:59:59.999`);
  }

  if (filters.mineOnly) {
    const user = await getCurrentUser();
    query = query.eq("user_id", user.id);
  }

  // Exclude the authenticated user's own posts from the public feed
  if (filters.excludeUserId) {
    query = query.neq("user_id", filters.excludeUserId);
  }

  if (filters.query?.trim()) {
    const term = `%${escapeLike(filters.query.trim())}%`;
    query = query.or(`item_name.ilike.${term},description.ilike.${term},location.ilike.${term},campus.ilike.${term}`);
  }

  query = query.order("created_at", { ascending: filters.sort === "oldest" });

  const { data, error } = await query;
  if (error) {
    console.error("[lost-found] load failed", error);
    throw new Error("Unable to load posts. Please try again.");
  }
  return ((data ?? []) as any[]).map(normalizeLostFoundItem);
}

export async function getLostFoundItem(id: string) {
  const { data, error } = await supabase
    .from("lost_found_items")
    .select("*")
    .eq("id", id)
    .maybeSingle<LostFoundItem>();

  if (error) {
    console.error("[lost-found] detail failed", error);
    throw new Error("Unable to load this post. Please try again.");
  }
  return data ? normalizeLostFoundItem(data as any) : null;
}

export async function createLostFoundItem(values: LostFoundFormValues) {
  const user = await getCurrentUser();
  const posterName = await getCurrentPosterName();
  let uploadedPath: string | null = null;

  try {
    // Update contact info if provided
    if (values.phone !== undefined || values.whatsapp !== undefined) {
      await updateUserContactInfo(values.phone || "", values.whatsapp || "");
    }

    const uploaded = values.image ? await uploadLostFoundImage(values.image, user.id) : null;
    uploadedPath = uploaded?.path ?? null;

    const { data, error } = await supabase
      .from("lost_found_items")
      .insert({
        user_id: user.id,
        type: values.type.toUpperCase(),
        item_name: cleanText(values.item_name),
        category: values.category,
        description: cleanText(values.description),
        location: cleanText(values.location),
        campus: values.campus,
        occurred_at: values.occurred_at,
        image_url: uploaded?.publicUrl ?? null,
        contact_preference: values.contact_preference.join(","),
        poster_name: posterName,
        status: "ACTIVE",
      })
      .select()
      .single<LostFoundItem>();

    if (error) throw error;
    return normalizeLostFoundItem(data as any);
  } catch (error) {
    if (uploadedPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPath]);
    }
    throw error;
  }
}

export async function updateLostFoundItem(
  id: string,
  updates: Partial<LostFoundFormValues> & { status?: LostFoundStatus }
) {
  const user = await getCurrentUser();
  const item = await getLostFoundItem(id);
  
  if (!item) throw new Error("Item not found");
  if (item.user_id !== user.id) throw new Error("Unauthorized to edit this item");

  let uploadedPath: string | null = null;
  
  try {
    const payload: any = {};
    if (updates.type) payload.type = updates.type.toUpperCase();
    if (updates.item_name) payload.item_name = cleanText(updates.item_name);
    if (updates.category) payload.category = updates.category;
    if (updates.description) payload.description = cleanText(updates.description);
    if (updates.location) payload.location = cleanText(updates.location);
    if (updates.campus) payload.campus = updates.campus;
    if (updates.occurred_at) payload.occurred_at = updates.occurred_at;
    if (updates.status) payload.status = updates.status.toUpperCase();
    if (updates.contact_preference) payload.contact_preference = updates.contact_preference.join(",");

    if (updates.phone !== undefined || updates.whatsapp !== undefined) {
      await updateUserContactInfo(updates.phone || "", updates.whatsapp || "");
    }

    if (updates.image !== undefined) {
      if (updates.image) {
        const uploaded = await uploadLostFoundImage(updates.image, user.id);
        uploadedPath = uploaded.path;
        payload.image_url = uploaded.publicUrl;
      } else {
        payload.image_url = null;
      }
    }

    const { data, error } = await supabase
      .from("lost_found_items")
      .update(payload)
      .eq("id", id)
      .select()
      .single<LostFoundItem>();

    if (error) throw error;
    
    // Cleanup old image if it was replaced or removed
    if (updates.image !== undefined && item.image_url) {
      const oldPath = getImagePathFromUrl(item.image_url);
      if (oldPath) await supabase.storage.from(STORAGE_BUCKET).remove([oldPath]);
    }

    return normalizeLostFoundItem(data as any);
  } catch (error) {
    if (uploadedPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPath]);
    }
    throw error;
  }
}

export async function saveLostFoundDraft(values: Partial<LostFoundFormValues>, draftId?: string) {
  const user = await getCurrentUser();
  const posterName = await getCurrentPosterName();

  const payload: any = {
    user_id: user.id,
    poster_name: posterName,
    status: "DRAFT",
    type: values.type ? values.type.toUpperCase() : "LOST",
    item_name: cleanText(values.item_name || ""),
    category: values.category || "",
    description: cleanText(values.description || ""),
    location: cleanText(values.location || ""),
    campus: values.campus || "",
    occurred_at: values.occurred_at || new Date().toISOString(),
    contact_preference: values.contact_preference ? values.contact_preference.join(",") : "",
  };

  let uploadedPath: string | null = null;
  if (values.image) {
    const uploaded = await uploadLostFoundImage(values.image, user.id);
    payload.image_url = uploaded.publicUrl;
    uploadedPath = uploaded.path;
  }

  try {
    let result;
    if (draftId) {
      result = await supabase
        .from("lost_found_items")
        .update(payload)
        .eq("id", draftId)
        .eq("user_id", user.id) // Security check
        .select()
        .single();
    } else {
      result = await supabase
        .from("lost_found_items")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) throw result.error;
    return normalizeLostFoundItem(result.data as any);
  } catch (error) {
    if (uploadedPath) {
      await supabase.storage.from(STORAGE_BUCKET).remove([uploadedPath]);
    }
    throw error;
  }
}

export async function getLostFoundDraft() {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("lost_found_items")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["DRAFT", "draft"])
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("[lost-found] get draft failed", error);
    return null;
  }
  return data && data.length > 0 ? normalizeLostFoundItem(data[0] as any) : null;
}

export async function getMyLostFoundItems() {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("lost_found_items")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[lost-found] get my items failed", error);
    throw new Error("Unable to load your posts.");
  }
  return ((data ?? []) as any[]).map(normalizeLostFoundItem);
}



export async function markLostFoundRecovered(id: string) {
  const existing = await getLostFoundItem(id);
  const nextStatus = existing?.type === "found" ? "RESOLVED" : "RECOVERED";
  const { data, error } = await supabase
    .from("lost_found_items")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single<LostFoundItem>();

  if (error) throw error;

  // Add notification for resolution if needed (usually self-triggered, but good for record)
  // or maybe not needed if it's the owner resolving it.

  return normalizeLostFoundItem(data as any);
}

export async function reopenLostFoundItem(id: string) {
  const { data, error } = await supabase
    .from("lost_found_items")
    .update({ status: "ACTIVE", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single<LostFoundItem>();

  if (error) throw error;
  return normalizeLostFoundItem(data as any);
}

export async function deleteLostFoundItem(id: string) {
  const item = await getLostFoundItem(id);
  const { error } = await supabase.from("lost_found_items").delete().eq("id", id);
  if (error) throw error;

  const path = getImagePathFromUrl(item?.image_url ?? null);
  if (path) await supabase.storage.from(STORAGE_BUCKET).remove([path]);
}

export async function contactLostFoundPoster(item: LostFoundItem, message?: string) {
  const user = await getCurrentUser();
  if (user.id === item.user_id) throw new Error("This is your post.");

  const productId = `lost-found:${item.id}`;
  const conversation = await getOrCreateConversation(productId, item.user_id);

  if (message?.trim()) {
    await sendMessage(conversation.id, item.user_id, message.trim());
  }

  // Generate notification for the poster
  await createLostFoundNotification({
    user_id: item.user_id,
    actor_id: user.id,
    post_id: item.id,
    type: "contact",
  });

  return { conversation, productId };
}

export async function reportLostFoundItem(item: LostFoundItem) {
  await reportUser(
    item.user_id,
    "Other",
    `Lost & Found post reported: ${item.item_name} (${item.id})`,
  );
}

export function formatLostFoundDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeLostFoundItem(row: any): LostFoundItem {
  // contact_preference is stored as comma-separated tokens: 'message', 'call', 'whatsapp'
  // Legacy rows may have the old verbose default 'Message me on Nexora' — normalize to 'message'
  const rawPref: string = row.contact_preference || "message";
  const parsedPrefs = rawPref
    .split(",")
    .map((s: string) => s.trim().toLowerCase())
    .map((s: string) => {
      // Map old verbose values to token form
      if (s === "message me on nexora" || s === "message on nexora") return "message";
      return s;
    })
    .filter((s: string) => ["message", "call", "whatsapp"].includes(s));

  // Guarantee at least one preference
  const contact_preference = parsedPrefs.length > 0 ? parsedPrefs : ["message"];

  return {
    ...row,
    type: String(row.type || "").toLowerCase() as LostFoundType,
    status: String(row.status || "").toLowerCase() as LostFoundStatus,
    occurred_at: row.occurred_at ?? row.date_time,
    contact_preference,
  };
}

// ------------------------------------------------------------------
// SAVED POSTS
// ------------------------------------------------------------------

export async function saveLostFoundPost(postId: string) {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from("lost_found_saved_posts")
    .insert({ user_id: user.id, post_id: postId });
  if (error && error.code !== "23505") throw error; // ignore duplicate key
}

export async function unsaveLostFoundPost(postId: string) {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from("lost_found_saved_posts")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", postId);
  if (error) throw error;
}

export async function getSavedLostFoundPosts() {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("lost_found_saved_posts")
    .select(`
      user_id,
      post_id,
      created_at,
      post:lost_found_items(*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[lost-found] get saved items failed", error);
    throw new Error("Unable to load saved posts.");
  }
  
  return ((data ?? []) as any[]).map(row => ({
    ...row,
    post: row.post ? normalizeLostFoundItem(row.post) : undefined
  })) as LostFoundSavedPost[];
}

export async function isPostSaved(postId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { count, error } = await supabase
    .from("lost_found_saved_posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("post_id", postId);
  if (error) return false;
  return (count ?? 0) > 0;
}

// ------------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------------

export async function getLostFoundNotifications() {
  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("lost_found_notifications")
    .select(`
      *,
      post:lost_found_items(*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  return ((data ?? []) as any[]).map(row => ({
    ...row,
    post: row.post ? normalizeLostFoundItem(row.post) : undefined
  })) as LostFoundNotification[];
}

export async function markNotificationRead(id: string) {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from("lost_found_notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from("lost_found_notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);
  if (error) throw error;
}

export async function createLostFoundNotification(payload: {
  user_id: string;
  actor_id?: string;
  post_id?: string;
  type: LostFoundNotificationType;
}) {
  const { error } = await supabase
    .from("lost_found_notifications")
    .insert(payload);
  if (error) {
    console.error("[lost-found] Failed to create notification:", error);
  }
}
