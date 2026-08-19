import {
  CURRENT_USER_ID,
  MARKETPLACE_EPOCH,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  type ListingFormValues,
  type ListingStatus,
  type MarketplaceCategory,
  type MarketplaceCondition,
  type MarketplaceListing,
} from "@/lib/marketplace";
import { validateListingForm } from "@/lib/marketplace-validation";
import { supabase } from "@/lib/supabase";

type DbRow = Record<string, unknown>;

const ITEM_TABLE = "marketplace_items";
const IMAGE_TABLE = "marketplace_images";
const CATEGORY_TABLE = "marketplace_categories";
const SAVED_TABLE = "saved_items";
const STORAGE_BUCKET = "marketplace-images";

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getCurrentUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? CURRENT_USER_ID;
}

// ── Value helpers ─────────────────────────────────────────────────────────────

function stringValue(row: DbRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return fallback;
}

function numberValue(row: DbRow, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value)))
      return Number(value);
  }
  return fallback;
}

function arrayValue(row: DbRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === "string" && value.trim()) {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function normalizedCategory(value: string): MarketplaceCategory {
  return MARKETPLACE_CATEGORIES.includes(value as MarketplaceCategory)
    ? (value as MarketplaceCategory)
    : "Others";
}

function normalizedCondition(value: string): MarketplaceCondition {
  return MARKETPLACE_CONDITIONS.includes(value as MarketplaceCondition)
    ? (value as MarketplaceCondition)
    : "Good";
}

/** Maps DB row status and is_active values to UI ListingStatus. */
function normalizedStatus(row: DbRow): ListingStatus {
  if (row.is_active === false && row.status === "draft") return "draft";
  const value = stringValue(row, ["status"], "available");
  if (value === "sold") return "sold";
  if (value === "reserved") return "archived";
  if (row.is_active === false) return "draft";
  return "active";
}

function withoutUndefined(payload: DbRow) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

// ── Image URL resolution ──────────────────────────────────────────────────────

function imageUrl(row: DbRow) {
  const directUrl = stringValue(row, ["image_url", "url", "public_url", "src"]);
  if (directUrl) return directUrl;

  const path = stringValue(row, ["storage_path", "path"]);
  if (!path) return "";
  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

// ── Category helpers ──────────────────────────────────────────────────────────

// In-memory cache: avoids re-fetching categories on every insert/filter call.
// Automatically invalidates after 60 seconds.
let _categoryCache: { rows: DbRow[]; ts: number } | null = null;
const CATEGORY_CACHE_TTL = 60_000; // 60 s

async function getCategoryRows(): Promise<DbRow[]> {
  if (_categoryCache && Date.now() - _categoryCache.ts < CATEGORY_CACHE_TTL) {
    return _categoryCache.rows;
  }
  const { data, error } = await supabase
    .from(CATEGORY_TABLE)
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as DbRow[];

  _categoryCache = { rows, ts: Date.now() };
  return rows;
}

/** Map of category UUID → category display name (e.g. "Books"). */
async function getCategoryMap(): Promise<Map<string, string>> {
  const rows = await getCategoryRows().catch(() => []);
  return new Map<string, string>(
    rows
      .map((row) => [
        stringValue(row, ["id"]),
        stringValue(row, ["name", "title", "label"]),
      ])
      .filter(([id, name]) => id && name) as [string, string][],
  );
}

/** Map of category display name → UUID (e.g. "Books" → "abc-123…"). */
async function getCategoryNameToIdMap(): Promise<Map<string, string>> {
  const rows = await getCategoryRows().catch(() => []);
  return new Map<string, string>(
    rows
      .map((row) => [
        stringValue(row, ["name", "title", "label"]),
        stringValue(row, ["id"]),
      ])
      .filter(([name, id]) => name && id) as [string, string][],
  );
}

/**
 * Resolve a category display name (e.g. "Books") to its UUID.
 * Uses the cached name→id map first; falls back to a direct ilike query.
 * Never hardcodes UUIDs.
 */
async function findCategoryId(category: string): Promise<string | undefined> {
  if (!category) return undefined;

  // 1. Check the cache
  const map = await getCategoryNameToIdMap();
  const cached = map.get(category);
  if (cached) return cached;

  // 2. Case-insensitive fallback query
  const { data } = await supabase
    .from(CATEGORY_TABLE)
    .select("id")
    .ilike("name", category)
    .limit(1)
    .single();
  return (data as DbRow | null)?.id as string | undefined;
}

// ── Seller profile helper ─────────────────────────────────────────────────────

async function getSellerProfile(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, college_name, avatar_url")
    .eq("id", userId)
    .single();
  return {
    name:
      stringValue((data ?? {}) as DbRow, ["full_name", "name"]) ||
      "Nexora student",
    course:
      stringValue((data ?? {}) as DbRow, ["college_name", "course"]) ||
      "Nexora student",
  };
}

// ── Image helpers ─────────────────────────────────────────────────────────────

async function getImagesByItemIds(itemIds: string[]) {
  const imagesByItem = new Map<string, string[]>();
  if (!itemIds.length) return imagesByItem;

  const { data, error } = await supabase
    .from(IMAGE_TABLE)
    .select("*")
    .in("item_id", itemIds)
    .order("display_order", { ascending: true });

  if (error) return imagesByItem;

  for (const row of (data ?? []) as DbRow[]) {
    const itemId = stringValue(row, ["item_id", "listing_id", "marketplace_item_id"]);
    const url = imageUrl(row);
    if (!itemId || !url) continue;
    imagesByItem.set(itemId, [...(imagesByItem.get(itemId) ?? []), url]);
  }
  return imagesByItem;
}

async function insertImageRow(
  itemId: string,
  url: string,
  position: number,
) {
  const { error } = await supabase
    .from(IMAGE_TABLE)
    .insert({
      item_id: itemId,
      image_url: url,
      display_order: position + 1,
    });
  if (error) {
    console.error("[marketplace] insertImageRow error:", error);
    throw error;
  }
}

async function getStoragePathsForItem(itemId: string): Promise<string[]> {
  const { data } = await supabase
    .from(IMAGE_TABLE)
    .select("image_url")
    .eq("item_id", itemId);

  return ((data ?? []) as DbRow[])
    .map((row) => {
      const url = stringValue(row, ["image_url"]);
      if (!url) return "";
      if (url.includes("/storage/v1/object/public/marketplace-images/")) {
        return url.split("/storage/v1/object/public/marketplace-images/")[1] || "";
      }
      return "";
    })
    .filter(Boolean);
}

async function deleteStorageFiles(paths: string[]) {
  if (!paths.length) return;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  if (error) console.error("[marketplace] Storage delete error:", error);
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function categoryNameFromRow(row: DbRow, categoryById: Map<string, string>) {
  const direct = stringValue(row, ["category", "category_name"]);
  if (direct) return direct;
  const categoryId = stringValue(row, ["category_id", "marketplace_category_id"]);
  return categoryById.get(categoryId) ?? "Others";
}

function mapListing(
  row: DbRow,
  images: string[],
  categoryById = new Map<string, string>(),
): MarketplaceListing {
  // Handle joined profiles object from Supabase select
  const profile = (row.profiles as DbRow | null) ?? {};

  const sellerName =
    stringValue(row, ["seller_name", "sellerName"]) ||
    stringValue(profile, ["full_name", "name"]) ||
    "Nexora student";

  const sellerAvatar =
    stringValue(row, ["seller_avatar", "sellerAvatar"]) ||
    stringValue(profile, ["avatar_url"]) ||
    "";

  const sellerCourse =
    stringValue(row, ["seller_course", "sellerCourse"]) ||
    stringValue(profile, ["college_name", "course"]) ||
    "Nexora student";

  return {
    id: stringValue(row, ["id"]),
    sellerId: stringValue(
      row,
      ["seller_id", "sellerId", "user_id", "owner_id"],
      CURRENT_USER_ID,
    ),
    sellerName,
    sellerAvatar,
    sellerCourse,
    sellerRating: numberValue(row, ["seller_rating", "sellerRating", "rating"], 4.8),
    title: stringValue(row, ["title"]),
    description: stringValue(row, ["description"]),
    category: normalizedCategory(categoryNameFromRow(row, categoryById)),
    condition: normalizedCondition(stringValue(row, ["condition"], "Good")),
    price: numberValue(row, ["price"], 0),
    pickupArea: stringValue(row, [
      "location",
      "pickup_area",
      "pickupArea",
      "pickup_location",
    ]),
    images: (() => {
      if (images.length) return images;
      const cover = stringValue(row, ["cover_image", "cover_url", "coverImage"]);
      return cover ? [cover] : [];
    })(),
    status: normalizedStatus(row),
    tags: (() => {
      // Try legacy tags column first
      const direct = arrayValue(row, ["tags"]);
      if (direct.length) return direct;
      // Try attributes JSONB: { tags: [...] }
      const attrs = row.attributes;
      if (attrs && typeof attrs === "object" && Array.isArray((attrs as any).tags)) {
        return (attrs as any).tags.map(String);
      }
      return [];
    })(),
    createdAt: stringValue(
      row,
      ["created_at", "createdAt"],
      new Date().toISOString(),
    ),
    views: numberValue(row, ["views", "view_count", "views_count"], 0),
    saves: numberValue(row, ["saves", "save_count", "saves_count"], 0),
    offerCount: numberValue(
      row,
      ["offer_count", "offerCount", "offers_count"],
      0,
    ),
    isNegotiable: Boolean(row.is_negotiable),
    originalPrice: numberValue(row, ["original_price", "originalPrice"], 0) || undefined,
    campus: (() => {
      const attrs = row.attributes;
      if (attrs && typeof attrs === "object" && (attrs as any).campus) return String((attrs as any).campus);
      return stringValue(row, ["hostel", "campus"], "");
    })() || undefined,
    specifications: (() => {
      const attrs = row.attributes;
      if (attrs && typeof attrs === "object" && (attrs as any).specifications) return String((attrs as any).specifications);
      return undefined;
    })(),
    pickup: (() => {
      const attrs = row.attributes;
      if (attrs && typeof attrs === "object" && (attrs as any).pickup) return String((attrs as any).pickup);
      return undefined;
    })(),
  };
}

// ── DB payload builder ────────────────────────────────────────────────────────

async function buildDbPayload(
  values: ListingFormValues,
  status: ListingStatus,
  sellerId: string,
  categoryId?: string,
) {
  // Deduplicate tags
  const rawTags = values.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const seenTags = new Set<string>();
  const tags: string[] = [];
  for (const t of rawTags) {
    const lower = t.toLowerCase();
    if (!seenTags.has(lower)) {
      seenTags.add(lower);
      tags.push(t);
    }
  }

  // Deduplicate specifications
  let specifications: string | undefined = undefined;
  if (values.specifications) {
    const rawSpecs = values.specifications
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const seenSpecs = new Set<string>();
    const specs: string[] = [];
    for (const spec of rawSpecs) {
      const colonIdx = spec.indexOf(":");
      const key = colonIdx === -1 ? spec.trim().toLowerCase() : spec.substring(0, colonIdx).trim().toLowerCase();
      if (!seenSpecs.has(key)) {
        seenSpecs.add(key);
        specs.push(spec);
      }
    }
    specifications = specs.join(", ");
  }

  return {
    seller_id: sellerId,
    title: values.title.trim(),
    description: values.description.trim(),
    category_id: categoryId,
    condition: values.condition,
    price: Number(values.price) || 0,
    location: values.pickupArea.trim(),
    status: status === "sold" ? "sold" : (status === "archived" ? "reserved" : "available"),
    is_active: status !== "draft",
    attributes: { 
      tags,
      specifications: specifications || undefined,
      campus: values.campus?.trim() || undefined,
      pickup: values.pickup?.trim() || undefined,
    },
    is_negotiable: values.isNegotiable,
    original_price: values.originalPrice ? Number(values.originalPrice) : null,
    hostel: values.campus?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}

// ── Insert / Update helpers ───────────────────────────────────────────────────

async function insertItem(payload: Record<string, unknown>) {
  const attempts = [
    withoutUndefined(payload),
    withoutUndefined({ ...payload, category: undefined }),
    withoutUndefined({ ...payload, category_id: undefined }),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from(ITEM_TABLE)
      .insert(attempt)
      .select("*")
      .single();
    if (!error) return data as DbRow;
    lastError = error;
  }
  throw lastError;
}

async function updateItem(id: string, payload: Record<string, unknown>) {
  const attempts = [
    withoutUndefined(payload),
    withoutUndefined({ ...payload, seller_id: undefined, category: undefined }),
    withoutUndefined({ ...payload, seller_id: undefined, category_id: undefined }),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from(ITEM_TABLE)
      .update(attempt)
      .eq("id", id)
      .select("*")
      .single();
    if (!error) return data as DbRow;
    lastError = error;
  }
  throw lastError;
}

// ── Shared fetch helper ───────────────────────────────────────────────────────

async function fetchItemRows(
  query: ReturnType<typeof supabase.from>,
): Promise<{ rows: DbRow[]; categoryById: Map<string, string> }> {
  const categoryById = await getCategoryMap();
  const { data, error } = await (query as any);

  if (error) {
    // Return empty — callers should handle
    return { rows: [], categoryById };
  }

  return { rows: (data ?? []) as DbRow[], categoryById };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch categories from marketplace_categories.
 * Falls back to the hardcoded list if the table is empty or unreachable.
 */
export async function getCategories(): Promise<string[]> {
  try {
    const rows = await getCategoryRows();
    const names = rows
      .map((row) => stringValue(row, ["name", "title", "label"]))
      .filter(Boolean);
    return names.length ? names : [...MARKETPLACE_CATEGORIES];
  } catch {
    return [...MARKETPLACE_CATEGORIES];
  }
}

/**
 * Fetch all marketplace items that are available/active and is_active = true.
 * Supports filtering, searching, and pagination.
 */
export async function getMarketplaceItems(
  filters?: import("@/lib/marketplace").MarketplaceFilters,
  page: number = 1,
  pageSize: number = 12
): Promise<{ items: import("@/lib/marketplace").MarketplaceListing[]; hasMore: boolean }> {
  const categoryById = await getCategoryMap();
  const currentUserId = await getCurrentUserId();

  // Pre-resolve the category filter to a category_id (UUID) in case
  // the table uses category_id FK instead of a text "category" column.
  let resolvedCategoryIds: string[] = [];
  if (filters?.category && filters.category.length > 0) {
    const ids = await Promise.all(filters.category.map(c => findCategoryId(c)));
    resolvedCategoryIds = ids.filter(Boolean) as string[];
  }

  /**
   * Apply filters to a Supabase query builder.
   * @param hasCategoryTextColumn – when true, filter on the text "category" column;
   *   when false, filter on "category_id" UUID column instead.
   */
  const applyFilters = (query: any, hasCategoryTextColumn = true) => {
    let q = query;
    if (currentUserId) {
      q = q.neq("seller_id", currentUserId);
    }
    if (filters) {
      if (filters.query) {
        // Wrap term in double quotes to prevent Supabase .or() parser from breaking on spaces/commas
        const term = `"%${filters.query}%"`;
        // We do a basic title/description/category search. 
        // Note: searching seller name via foreign table in .or() is not supported without a view.
        q = hasCategoryTextColumn
          ? q.or(`title.ilike.${term},description.ilike.${term},category.ilike.${term}`)
          : q.or(`title.ilike.${term},description.ilike.${term}`);
      }
      if (filters.category && filters.category.length > 0) {
        if (hasCategoryTextColumn) {
          q = q.in("category", filters.category);
        } else if (resolvedCategoryIds.length > 0) {
          q = q.in("category_id", resolvedCategoryIds);
        }
      }
      if (filters.condition && filters.condition.length > 0) {
        q = q.in("condition", filters.condition);
      }
      if (filters.campus && filters.campus.length > 0) {
        const campusQueries = filters.campus.map(c => `pickup_area.ilike.%${c}%`);
        q = q.or(campusQueries.join(','));
      }
      if (filters.hostel && filters.hostel.length > 0) {
        const hostelQueries = filters.hostel.map(h => `pickup_area.ilike.%${h}%`);
        q = q.or(hostelQueries.join(','));
      }
      if (filters.datePosted && filters.datePosted !== "any") {
         if (filters.datePosted === "today") {
            const today = new Date();
            today.setHours(0,0,0,0);
            q = q.gte("created_at", today.toISOString());
         } else if (filters.datePosted === "last7days") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            q = q.gte("created_at", sevenDaysAgo.toISOString());
         }
      }
      if (filters.status === "available") {
        q = q.or("status.eq.available,status.eq.active");
      } else if (filters.status === "sold") {
        q = q.eq("status", "sold");
      }
      if (filters.minPrice > 0) {
        q = q.gte("price", filters.minPrice);
      }
      if (filters.maxPrice < 60000) {
        q = q.lte("price", filters.maxPrice);
      }
      if (filters.isNegotiable) {
        q = q.eq("is_negotiable", true);
      }
      // Sort — use created_at as safe fallback for view_count / saves
      // since the column name may differ across schemas
      if (filters.sort === "Newest") q = q.order("created_at", { ascending: false });
      else if (filters.sort === "Oldest") q = q.order("created_at", { ascending: true });
      else if (filters.sort === "Price low to high") q = q.order("price", { ascending: true });
      else if (filters.sort === "Price high to low") q = q.order("price", { ascending: false });
      else if (filters.sort === "Most viewed") q = q.order("view_count", { ascending: false });
      else if (filters.sort === "Most saved") q = q.order("save_count", { ascending: false });
      else q = q.order("created_at", { ascending: false });
    } else {
      q = q.or("status.eq.available,status.eq.active").order("created_at", { ascending: false });
    }
    return q.gte("created_at", MARKETPLACE_EPOCH);
  };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Attempt 1: profile join + is_active + text category column
  let baseQuery = supabase
    .from(ITEM_TABLE)
    .select("*, profiles(full_name, avatar_url, college_name)", { count: "exact" })
    .eq("is_active", true);

  let { data, error, count } = await applyFilters(baseQuery, true).range(from, to);

  // Attempt 2: no profile join, is_active, text category column
  if (error) {
    console.warn("[marketplace] Attempt 1 failed (profile join / is_active / text category):", error.message);
    let fbQuery = supabase
      .from(ITEM_TABLE)
      .select("*", { count: "exact" })
      .eq("is_active", true);
    ({ data, error, count } = await applyFilters(fbQuery, true).range(from, to));
  }

  // Attempt 3: no profile join, is_active, category_id column
  if (error) {
    console.warn("[marketplace] Attempt 2 failed (is_active / text category):", error.message);
    let fbQuery2 = supabase
      .from(ITEM_TABLE)
      .select("*", { count: "exact" })
      .eq("is_active", true);
    ({ data, error, count } = await applyFilters(fbQuery2, false).range(from, to));
  }

  // Attempt 4: no profile join, no is_active, category_id column
  if (error) {
    console.warn("[marketplace] Attempt 3 failed (is_active / category_id):", error.message);
    let fbQuery3 = supabase
      .from(ITEM_TABLE)
      .select("*", { count: "exact" });
    ({ data, error, count } = await applyFilters(fbQuery3, false).range(from, to));
  }

  // Attempt 5: absolute minimal — no filters at all, just get rows
  if (error) {
    console.warn("[marketplace] Attempt 4 failed:", error.message);
    let fbQuery4 = supabase
      .from(ITEM_TABLE)
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    ({ data, error, count } = await fbQuery4);
  }

  if (error) {
    console.error("[marketplace] All query attempts failed:", JSON.stringify(error, null, 2));
    // Return empty instead of throwing "Server error"
    return { items: [], hasMore: false };
  }

  const rows = (data ?? []) as DbRow[];
  const ids = rows.map((r) => stringValue(r, ["id"])).filter(Boolean);
  const imagesByItem = await getImagesByItemIds(ids);

  const items = rows.map((row) =>
    mapListing(row, imagesByItem.get(stringValue(row, ["id"])) ?? [], categoryById),
  );

  const hasMore = count !== null ? from + items.length < count : items.length === pageSize;
  return { items, hasMore };
}

/**
 * Fetch saved marketplace items paginated.
 */
export async function getSavedListings(
  itemIds: string[],
  page: number = 1,
  pageSize: number = 12
): Promise<{ items: import("@/lib/marketplace").MarketplaceListing[]; hasMore: boolean }> {
  if (itemIds.length === 0) return { items: [], hasMore: false };

  const categoryById = await getCategoryMap();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from(ITEM_TABLE)
    .select("*, profiles(full_name, avatar_url, college_name)", { count: "exact" })
    .in("id", itemIds)
    .gte("created_at", MARKETPLACE_EPOCH)
    .order("created_at", { ascending: false })
    .range(from, to);

  let { data, error, count } = await query;

  if (error) {
    console.warn("[marketplace] getSavedListings profile join failed:", error.message);
    let fbQuery = supabase
      .from(ITEM_TABLE)
      .select("*", { count: "exact" })
      .in("id", itemIds)
      .gte("created_at", MARKETPLACE_EPOCH)
      .order("created_at", { ascending: false })
      .range(from, to);
    ({ data, error, count } = await fbQuery);
  }

  if (error) {
    console.error("[marketplace] getSavedListings all attempts failed:", JSON.stringify(error, null, 2));
    return { items: [], hasMore: false };
  }

  const rows = (data ?? []) as DbRow[];
  const ids = rows.map((r) => stringValue(r, ["id"])).filter(Boolean);
  const imagesByItem = await getImagesByItemIds(ids);

  const items = rows.map((row) =>
    mapListing(row, imagesByItem.get(stringValue(row, ["id"])) ?? [], categoryById),
  );

  const hasMore = count !== null ? from + items.length < count : items.length === pageSize;
  return { items, hasMore };
}

/**
 * Fetch the current user's own listings (all statuses).
 * Used in the Seller Dashboard.
 */
export async function getSellerItems(): Promise<MarketplaceListing[]> {
  const userId = await getCurrentUserId();
  // If user is not authenticated (fallback ID), return empty
  if (userId === CURRENT_USER_ID) return [];

  const categoryById = await getCategoryMap();

  let { data, error } = await supabase
    .from(ITEM_TABLE)
    .select("*, profiles(full_name, avatar_url, college_name)")
    .eq("seller_id", userId)
    .gte("created_at", MARKETPLACE_EPOCH)
    .order("created_at", { ascending: false });

  if (error) {
    ({ data, error } = await supabase
      .from(ITEM_TABLE)
      .select("*")
      .eq("seller_id", userId)
      .gte("created_at", MARKETPLACE_EPOCH)
      .order("created_at", { ascending: false }));
  }

  if (error) {
    console.error("[marketplace] getSellerItems error:", error);
    return [];
  }

  const rows = (data ?? []) as DbRow[];
  const ids = rows.map((r) => stringValue(r, ["id"])).filter(Boolean);
  const imagesByItem = await getImagesByItemIds(ids);

  return rows.map((row) =>
    mapListing(row, imagesByItem.get(stringValue(row, ["id"])) ?? [], categoryById),
  );
}

/**
 * Fetch a single marketplace item by ID with all images, seller profile,
 * and category info.
 */
export async function getMarketplaceItem(
  id: string,
): Promise<MarketplaceListing | null> {
  const categoryById = await getCategoryMap();

  let { data, error } = await supabase
    .from(ITEM_TABLE)
    .select("*, profiles(full_name, avatar_url, college_name)")
    .eq("id", id)
    .single();

  if (error) {
    // Fallback without profile join
    ({ data, error } = await supabase
      .from(ITEM_TABLE)
      .select("*")
      .eq("id", id)
      .single());
    if (error) return null;
  }

  const imagesByItem = await getImagesByItemIds([id]);
  return mapListing(
    data as DbRow,
    imagesByItem.get(id) ?? [],
    categoryById,
  );
}

function mapDatabaseError(err: any): Error {
  if (!err) return new Error("An unexpected error occurred.");
  
  const msg = (err.message || "").toLowerCase();
  const details = (err.details || "").toLowerCase();
  const code = String(err.code || "");

  if (msg.includes("marketplace_items_status_check") || details.includes("marketplace_items_status_check")) {
    return new Error("Invalid item status. Allowed values are Available, Sold, or Reserved.");
  }
  if (msg.includes("marketplace_items_price_check") || details.includes("marketplace_items_price_check")) {
    return new Error("Price must be 0 or greater.");
  }
  if (msg.includes("null value in column \"condition\"") || details.includes("null value in column \"condition\"") || (code === "23502" && msg.includes("condition"))) {
    return new Error("Item condition is required.");
  }
  if (msg.includes("null value in column \"title\"") || details.includes("null value in column \"title\"") || (code === "23502" && msg.includes("title"))) {
    return new Error("Title is required.");
  }
  if (msg.includes("null value in column \"description\"") || details.includes("null value in column \"description\"") || (code === "23502" && msg.includes("description"))) {
    return new Error("Description is required.");
  }
  if (msg.includes("marketplace_items_category_id_fkey") || details.includes("marketplace_items_category_id_fkey")) {
    return new Error("Selected category is invalid or does not exist.");
  }

  return new Error(err.message || "A database error occurred while saving the item.");
}

/**
 * Create a new marketplace item, upload images, and set cover_image.
 */
export async function createMarketplaceItem(
  values: ListingFormValues,
  status: ListingStatus,
): Promise<MarketplaceListing> {
  // Backend Validation before insert
  const validation = validateListingForm(values, status === "draft");
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors).filter(Boolean)[0];
    throw new Error(firstError || "Validation failed.");
  }

  const sellerId = await getCurrentUserId();
  const categoryId = await findCategoryId(values.category);
  
  // 1. Generate UUID so we can upload images first
  const itemId = crypto.randomUUID();

  // 2. Upload images to storage
  const uploadedUrls = await uploadMarketplaceImages(itemId, values.images);
  const coverImage = uploadedUrls.length > 0 ? uploadedUrls[0] : undefined;

  // 3. Build payload and insert item
  const payload = await buildDbPayload(values, status, sellerId, categoryId);
  const itemPayload = { ...payload, id: itemId, cover_image: coverImage };

  let row;
  try {
    console.log("[marketplace] Supabase insert payload:\n", JSON.stringify(itemPayload, null, 2));
    row = await insertItem(itemPayload);
  } catch (err) {
    // Rollback storage if db insert fails
    const paths = await getStoragePathsForItem(itemId);
    await deleteStorageFiles(paths);
    throw mapDatabaseError(err);
  }

  // 4. Insert image rows only after item succeeds
  for (let i = 0; i < uploadedUrls.length; i++) {
    const url = uploadedUrls[i];
    await insertImageRow(itemId, url, i);
  }

  const categoryById = await getCategoryMap();
  return mapListing(row, uploadedUrls, categoryById);
}

/**
 * Update an existing marketplace item.
 */
export async function updateMarketplaceItem(
  id: string,
  values: ListingFormValues,
  status: ListingStatus,
): Promise<MarketplaceListing> {
  // Backend Validation before update
  const validation = validateListingForm(values, status === "draft");
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors).filter(Boolean)[0];
    throw new Error(firstError || "Validation failed.");
  }

  const sellerId = await getCurrentUserId();
  const categoryId = await findCategoryId(values.category);

  // 1. Get all existing images in the DB for this item
  const { data: dbImages } = await supabase
    .from(IMAGE_TABLE)
    .select("image_url")
    .eq("item_id", id);
  const dbUrls = ((dbImages ?? []) as DbRow[]).map(r => stringValue(r, ["image_url"])).filter(Boolean);

  // 2. Identify which ones were deleted by the user
  const newUrls = values.images.filter((img): img is string => typeof img === "string");
  const urlsToDelete = dbUrls.filter(url => !newUrls.includes(url));

  // 3. Delete only the removed images from storage
  const pathsToDelete = urlsToDelete.map(url => {
    if (url.includes("/storage/v1/object/public/marketplace-images/")) {
      return url.split("/storage/v1/object/public/marketplace-images/")[1] || "";
    }
    return "";
  }).filter(Boolean);
  await deleteStorageFiles(pathsToDelete);

  // 4. Delete all image records in DB (we will re-insert them to preserve the new order)
  await supabase.from(IMAGE_TABLE).delete().eq("item_id", id);

  // Upload new images (or keep existing string URLs)
  const uploadedUrls = await uploadMarketplaceImages(id, values.images);
  const coverImage = uploadedUrls.length > 0 ? uploadedUrls[0] : undefined;

  const payload = await buildDbPayload(values, status, sellerId, categoryId);
  
  let row;
  try {
    row = await updateItem(id, {
      ...payload,
      cover_image: coverImage,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    throw mapDatabaseError(err);
  }

  // Insert image rows
  for (let i = 0; i < uploadedUrls.length; i++) {
    const url = uploadedUrls[i];
    await insertImageRow(id, url, i);
  }

  const categoryById = await getCategoryMap();
  return mapListing(row, uploadedUrls, categoryById);
}

/**
 * Delete a marketplace item:
 * 1. Delete files from storage
 * 2. Delete marketplace_images records
 * 3. Delete the item itself
 */
export async function deleteMarketplaceItem(id: string) {
  // 1. Get storage paths for all images
  const paths = await getStoragePathsForItem(id);

  // 2. Delete from storage
  await deleteStorageFiles(paths);

  // 3. Delete image records
  await supabase.from(IMAGE_TABLE).delete().eq("item_id", id);

  // 4. Delete the item
  const { error } = await supabase.from(ITEM_TABLE).delete().eq("id", id);
  if (error) throw error;
}

/**
 * Upload images to Supabase Storage.
 * Accepts File objects (new uploads) or string URLs (existing images to re-link).
 * Note: Does not insert rows into marketplace_images; that is handled by the caller.
 */
export async function uploadMarketplaceImages(
  itemId: string,
  images: Array<File | string>,
): Promise<string[]> {
  const sellerId = await getCurrentUserId();
  const uploadedUrls: string[] = [];

  for (const [position, image] of images.entries()) {
    // Already a public URL (not blob: or data:) — keep directly
    if (
      typeof image === "string" &&
      !image.startsWith("blob:") &&
      !image.startsWith("data:")
    ) {
      uploadedUrls.push(image);
      continue;
    }

    // Resolve to a Blob
    let blob: Blob;
    if (image instanceof File) {
      blob = image;
    } else {
      // blob: URL from old code path — fetch it
      try {
        blob = await fetch(image).then((r) => r.blob());
      } catch (fetchErr) {
        console.error("[marketplace] Failed to fetch blob URL:", fetchErr);
        continue;
      }
    }

    const extension = blob.type.split("/")[1] || "jpg";
    const path = `${sellerId}/${itemId}/${Date.now()}-${position}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, blob, { upsert: true });

    if (uploadError) {
      console.error("[marketplace] Storage upload error:", uploadError);
      throw uploadError; 
    }

    const publicUrl = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path).data.publicUrl;

    uploadedUrls.push(publicUrl);
  }

  return uploadedUrls;
}

/**
 * Save (bookmark) a marketplace item for the current user.
 */
export async function saveMarketplaceItem(itemId: string) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(SAVED_TABLE)
    .insert({ user_id: userId, item_id: itemId });
  // Ignore unique constraint violations (already saved)
  if (error && error.code !== "23505") throw error;
}

/**
 * Remove a saved (bookmarked) item for the current user.
 */
export async function unsaveMarketplaceItem(itemId: string) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from(SAVED_TABLE)
    .delete()
    .eq("user_id", userId)
    .eq("item_id", itemId);
  if (error) throw error;
}

/**
 * Get all item IDs saved by the current user.
 */
export async function getSavedItems(): Promise<string[]> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from(SAVED_TABLE)
    .select("*")
    .eq("user_id", userId);

  if (error) return [];

  return ((data ?? []) as DbRow[])
    .map((row) =>
      stringValue(row, ["item_id", "listing_id", "marketplace_item_id"]),
    )
    .filter(Boolean);
}

/**
 * Increment the view count for an item.
 * Tries multiple column names (view_count, views, views_count) for schema flexibility.
 * The session-based deduplication guard is handled in the hook layer.
 */
export async function incrementViewCount(itemId: string) {
  // Lightweight fetch of just the count columns
  const { data, error } = await supabase
    .from(ITEM_TABLE)
    .select("view_count, views, views_count")
    .eq("id", itemId)
    .single();

  if (error || !data) return;

  const row = data as DbRow;
  const attempts: Array<Record<string, number>> = [];

  // Build attempts only for columns that actually exist in the row
  if ("view_count" in row) {
    attempts.push({ view_count: numberValue(row, ["view_count"], 0) + 1 });
  }
  if ("views" in row) {
    attempts.push({ views: numberValue(row, ["views"], 0) + 1 });
  }
  if ("views_count" in row) {
    attempts.push({
      views_count: numberValue(row, ["views_count"], 0) + 1,
    });
  }

  // Ultimate fallback if no known column is present
  if (!attempts.length) attempts.push({ view_count: 1 });

  for (const attempt of attempts) {
    const { error: updateError } = await supabase
      .from(ITEM_TABLE)
      .update(attempt)
      .eq("id", itemId);
    if (!updateError) return;
  }
}

// ── Chat Functions ──────────────────────────────────────────────────────────

export async function fetchChatsForUser(userId: string) {
  const { data, error } = await supabase
    .from("marketplace_chats")
    .select(`
      *,
      marketplace_messages(*)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("fetchChatsForUser error:", error);
    return [];
  }
  return data;
}

export async function createChat(listingId: string, sellerId: string) {
  const userId = await getCurrentUserId();
  const { data: existing } = await supabase
    .from("marketplace_chats")
    .select("*")
    .eq("listing_id", listingId)
    .eq("buyer_id", userId)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("marketplace_chats")
    .insert({ listing_id: listingId, buyer_id: userId, seller_id: sellerId })
    .select()
    .single();

  if (error) throw error;
  
  // Increment "Interested" (offerCount) when a new chat is created
  const { data: itemData } = await supabase
    .from(ITEM_TABLE)
    .select("offer_count, offers_count")
    .eq("id", listingId)
    .single();
    
  if (itemData) {
    const row = itemData as any;
    if ("offer_count" in row) {
      await supabase.from(ITEM_TABLE).update({ offer_count: (row.offer_count || 0) + 1 }).eq("id", listingId);
    } else if ("offers_count" in row) {
      await supabase.from(ITEM_TABLE).update({ offers_count: (row.offers_count || 0) + 1 }).eq("id", listingId);
    }
  }

  return data;
}

export async function sendChatMessage(payload: { chat_id: string, body: string, message_type?: string, offer_amount?: number, image_url?: string }) {
  const senderId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("marketplace_messages")
    .insert({
      sender_id: senderId,
      ...payload
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMessageStatus(messageId: string, status: "accepted" | "rejected") {
  const { error } = await supabase
    .from("marketplace_messages")
    .update({ status })
    .eq("id", messageId);

  if (error) throw error;
}

export async function markChatMessagesSeen(chatId: string) {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("marketplace_messages")
    .update({ seen: true })
    .eq("chat_id", chatId)
    .neq("sender_id", userId)
    .eq("seen", false);

  if (error) console.error("markChatMessagesSeen error:", error);
}

export async function reportMarketplaceItem(listingId: string, reason: string, details: string) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("marketplace_reports")
    .insert({
      listing_id: listingId,
      reporter_id: userId,
      reason,
      details
    })
    .select()
    .single();

  if (error) {
    console.error("reportMarketplaceItem error:", error);
    throw error;
  }
  return data;
}
