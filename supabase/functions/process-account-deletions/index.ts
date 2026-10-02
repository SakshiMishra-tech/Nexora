// Supabase Edge Function: process-account-deletions
// ============================================================
// Runs on a daily cron schedule (e.g. every day at 02:00 UTC).
// Finds profiles where scheduled_deletion_at <= now() and
// permanently deletes each user's account data.
//
// This function uses the SERVICE ROLE KEY and must NEVER be
// exposed to client code or included in frontend bundles.
//
// Deploy:
//   supabase functions deploy process-account-deletions \
//     --no-verify-jwt
//
// Schedule (Supabase Dashboard → Edge Functions → Schedules):
//   Cron: 0 2 * * *   (02:00 UTC daily)
//
// Or via pg_cron (see migration comments).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Data that we retain for legal/operational reasons even after deletion.
// Currently: nothing — all personal data is removed.
// If you need to retain any data, document it here and adjust the queries.

Deno.serve(async (req: Request) => {
  // Reject non-POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify this was called by the scheduler with the service role key.
  // Supabase automatically injects the Authorization header when using
  // the built-in Cron scheduler (the jwt will be the service role token).
  // If you call this manually, pass Bearer <SERVICE_ROLE_KEY>.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");
  if (token !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Forbidden", { status: 403 });
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Find all profiles whose scheduled deletion date has passed
  const { data: dueProfiles, error: fetchError } = await admin
    .from("profiles")
    .select("id")
    .lte("scheduled_deletion_at", new Date().toISOString())
    .not("scheduled_deletion_at", "is", null);

  if (fetchError) {
    console.error("Failed to fetch due profiles:", fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const results: { userId: string; status: "deleted" | "error"; detail?: string }[] = [];

  for (const profile of dueProfiles ?? []) {
    const userId = profile.id as string;
    try {
      // ── 1. Delete storage objects ──────────────────────────────────
      // Avatars bucket
      const avatarPath = `${userId}/`;
      await admin.storage
        .from("avatars")
        .remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`]);

      // Dating photos (if applicable)
      const { data: datingObjects } = await admin.storage.from("dating_photos").list(userId);
      if (datingObjects && datingObjects.length > 0) {
        const datingPaths = datingObjects.map((obj) => `${userId}/${obj.name}`);
        await admin.storage.from("dating_photos").remove(datingPaths);
      }

      // ── 2. Delete auth user (cascades to all FK-linked tables) ─────
      // auth.users has ON DELETE CASCADE on every table that references it,
      // so deleting the auth user will also delete:
      //   profiles, roommate_listings, marketplace items (by user_id),
      //   lost_found items, dating_profiles, campus_connect data, etc.
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        throw new Error(`Auth delete failed: ${authDeleteError.message}`);
      }

      results.push({ userId, status: "deleted" });
      console.log(`Permanently deleted user ${userId}`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error(`Failed to delete user ${userId}:`, detail);
      results.push({ userId, status: "error", detail });
    }
  }

  return new Response(
    JSON.stringify({
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
});
