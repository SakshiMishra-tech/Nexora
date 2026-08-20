import { supabase } from "@/lib/supabase";
import { getOrCreateConversation, reportUser, sendMessage } from "@/services/chat.service";

export type LostFoundType = "lost" | "found";
export type LostFoundStatus = "active" | "recovered" | "resolved";
export type LostFoundSort = "recent" | "oldest";

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
  contact_preference: string;
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
};

export type LostFoundFormValues = {
  type: LostFoundType;
  item_name: string;
  category: string;
  description: string;
  location: string;
  campus: string;
  occurred_at: string;
  contact_preference: string;
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

const STORAGE_BUCKET = "lost-found-images";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

async function uploadLostFoundImage(file: File, userId: string) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Please upload a JPG, PNG, WebP, or GIF image.");
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

  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function getLostFoundItems(filters: LostFoundFilters = {}) {
  let query = supabase.from("lost_found_items").select("*");

  if (!filters.includeRecovered) query = query.eq("status", "ACTIVE");
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

  if (filters.query?.trim()) {
    const term = `%${escapeLike(filters.query.trim())}%`;
    query = query.or(`item_name.ilike.${term},description.ilike.${term},location.ilike.${term}`);
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
        contact_preference: cleanText(values.contact_preference),
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
  values: Omit<LostFoundFormValues, "type"> & { type?: LostFoundType }
) {
  const existing = await getLostFoundItem(id);
  const user = await getCurrentUser();
  if (!existing || existing.user_id !== user.id) {
    throw new Error("You can only edit your own Lost & Found posts.");
  }

  let imageUrl = existing.image_url;
  let uploadedPath: string | null = null;

  try {
    if (values.image) {
      const uploaded = await uploadLostFoundImage(values.image, user.id);
      uploadedPath = uploaded.path;
      imageUrl = uploaded.publicUrl;
    }

    const { data, error } = await supabase
      .from("lost_found_items")
      .update({
        type: (values.type ?? existing.type).toUpperCase(),
        item_name: cleanText(values.item_name),
        category: values.category,
        description: cleanText(values.description),
        location: cleanText(values.location),
        campus: values.campus,
        occurred_at: values.occurred_at,
        image_url: imageUrl,
        contact_preference: cleanText(values.contact_preference),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single<LostFoundItem>();

    if (error) throw error;

    if (values.image) {
      const oldPath = getImagePathFromUrl(existing.image_url);
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
  return {
    ...row,
    type: String(row.type || "").toLowerCase() as LostFoundType,
    status: String(row.status || "").toLowerCase() as LostFoundStatus,
    occurred_at: row.occurred_at ?? row.date_time,
  };
}
