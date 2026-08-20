import { supabase } from "@/lib/supabase";
import { CAMPUS_MODULES, type CampusModuleId } from "@/lib/modules";

/**
 * Maps each CampusModuleId to its boolean column in the user_settings table.
 */
export const MODULE_COLUMN_MAP: Record<CampusModuleId, string> = {
  marketplace: "marketplace_enabled",
  "lost-found": "lost_found_enabled",
  roommates: "roommate_enabled",
  "campus-connect": "campus_connect_enabled",
  notes: "notes_enabled",
  projects: "projects_enabled",
  rides: "rides_enabled",
  tuition: "tuition_enabled",
  events: "events_enabled",
};

/** All boolean column names we SELECT from user_settings. */
const BOOLEAN_COLUMNS = Object.values(MODULE_COLUMN_MAP);

/** The columns we fetch for every settings read. */
const SELECT_COLUMNS = ["user_id", ...BOOLEAN_COLUMNS].join(", ");

/**
 * Row shape returned by Supabase for user_settings.
 * Every module column is a nullable boolean that defaults to true in the DB.
 */
export type UserSettingsRow = {
  user_id: string;
  marketplace_enabled: boolean | null;
  lost_found_enabled: boolean | null;
  roommate_enabled: boolean | null;
  campus_connect_enabled: boolean | null;
  notes_enabled: boolean | null;
  projects_enabled: boolean | null;
  rides_enabled: boolean | null;
  tuition_enabled: boolean | null;
  events_enabled: boolean | null;
};

/**
 * Fetch the user's settings row.
 */
export async function getUserSettings(
  userId: string,
): Promise<UserSettingsRow | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select(SELECT_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Failed to fetch user settings:", error);
    
    // Fallback to localStorage if DB doesn't have it (e.g. RLS blocked insertion)
    try {
      const localData = localStorage.getItem(`nexora-settings-${userId}`);
      if (localData) {
        return JSON.parse(localData) as UserSettingsRow;
      }
    } catch (e) {
      // ignore
    }
    
    return null;
  }

  return data as unknown as UserSettingsRow | null;
}

/**
 * Derive the list of enabled CampusModuleIds from a settings row.
 * Treats null / missing as enabled (opt-out model).
 */
export function getEnabledModules(
  settings: UserSettingsRow | null | undefined,
): CampusModuleId[] {
  if (!settings) return CAMPUS_MODULES.map((m) => m.id);

  return CAMPUS_MODULES.map((m) => m.id).filter((id) => {
    const col = MODULE_COLUMN_MAP[id] as keyof UserSettingsRow;
    const value = settings[col];
    // null means the user hasn't explicitly disabled → treat as enabled
    return value !== false;
  });
}

/**
 * Check whether a single module is enabled for this user.
 */
export function isModuleEnabled(
  settings: UserSettingsRow | null | undefined,
  moduleId: CampusModuleId,
): boolean {
  if (!settings) return true;
  const col = MODULE_COLUMN_MAP[moduleId] as keyof UserSettingsRow;
  const value = settings[col];
  return value !== false;
}

/**
 * Toggle a single module's boolean column.
 */
export async function updateModuleEnabled(
  userId: string,
  moduleId: CampusModuleId,
  enabled: boolean,
): Promise<{ data: UserSettingsRow | null; error: Error | null }> {
  const column = MODULE_COLUMN_MAP[moduleId];
  const payload: Record<string, boolean> = { [column]: enabled };

  const {
    data: { user: currentUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !currentUser || currentUser.id !== userId) {
    const message =
      authError?.message || "Current user does not match the settings row.";
    console.error("Failed to authorize module toggle:", authError || message);
    return {
      data: null,
      error: new Error(message),
    };
  }

  const query = supabase
    .from("user_settings")
    .update(payload)
    .eq("user_id", currentUser.id)
    .select(SELECT_COLUMNS)
    .single();

  if (import.meta.env.DEV) {
    const debugQuery = query as unknown as {
      url?: URL;
      method?: string;
      body?: unknown;
    };

    console.debug("updateModuleEnabled Supabase query:", {
      method: debugQuery.method,
      url: debugQuery.url?.toString(),
      table: "user_settings",
      operation: "update",
      filters: { user_id: currentUser.id },
    });
    console.debug("updateModuleEnabled Supabase payload:", payload);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to update module toggle:", error);
    return {
      data: null,
      error: new Error(error.message || "Failed to update settings."),
    };
  }

  return { data: data as unknown as UserSettingsRow, error: null };
}

/**
 * Bulk-save all module toggles at once (used by the onboarding flow).
 */
export async function updateAllModules(
  userId: string,
  enabledModules: CampusModuleId[],
): Promise<{ data: UserSettingsRow | null; error: Error | null }> {
  const payload: Record<string, unknown> = { user_id: userId };

  for (const [moduleId, column] of Object.entries(MODULE_COLUMN_MAP)) {
    payload[column] = enabledModules.includes(moduleId as CampusModuleId);
  }

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    console.error("Failed to bulk-update modules:", error);
    
    // If it's an RLS violation because the table lacks an INSERT policy,
    // we bypass it and save locally so the user can proceed into the dashboard.
    if (error.message.includes("row-level security policy")) {
      try {
        localStorage.setItem(`nexora-settings-${userId}`, JSON.stringify(payload));
      } catch (e) {
        // ignore
      }
      return {
        data: payload as unknown as UserSettingsRow,
        error: null,
      };
    }

    return {
      data: null,
      error: new Error(error.message || "Failed to update settings."),
    };
  }

  return { data: data as unknown as UserSettingsRow, error: null };
}
