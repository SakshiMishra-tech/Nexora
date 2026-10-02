/**
 * account.service.ts
 *
 * Client-side service for account deactivation and scheduled
 * deletion flows.  All sensitive state transitions are delegated
 * to SECURITY DEFINER stored procedures in Supabase — this code
 * never writes scheduled_deletion_at or performs permanent
 * deletion directly.
 */

import { supabase } from "@/lib/supabase";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type AccountState = {
  is_deactivated: boolean;
  deactivated_at: string | null;
  deletion_requested_at: string | null;
  scheduled_deletion_at: string | null;
};

// ──────────────────────────────────────────────────────────────
// Fetch account state
// ──────────────────────────────────────────────────────────────

export async function getAccountState(userId: string): Promise<AccountState | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("is_deactivated, deactivated_at, deletion_requested_at, scheduled_deletion_at")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Failed to fetch account state:", error);
    return null;
  }
  return data as AccountState;
}

// ──────────────────────────────────────────────────────────────
// Deactivation
// ──────────────────────────────────────────────────────────────

/**
 * Temporarily deactivates the signed-in user's account.
 * Calls the SECURITY DEFINER function `deactivate_my_account()`.
 * Returns null on success, an error message string on failure.
 */
export async function deactivateAccount(): Promise<string | null> {
  // Verify the caller is still authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return "You must be signed in to deactivate your account.";

  const { error } = await supabase.rpc("deactivate_my_account");
  if (error) return friendlyRpcError(error.message, "We could not deactivate your account.");
  return null;
}

/**
 * Reactivates the signed-in user's account.
 * Returns null on success, an error message string on failure.
 */
export async function reactivateAccount(): Promise<string | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return "You must be signed in to reactivate your account.";

  const { error } = await supabase.rpc("reactivate_my_account");
  if (error) return friendlyRpcError(error.message, "We could not reactivate your account.");
  return null;
}

// ──────────────────────────────────────────────────────────────
// Scheduled deletion
// ──────────────────────────────────────────────────────────────

/**
 * Requests permanent account deletion.
 * The account is deactivated immediately; permanent deletion
 * runs server-side 30 days later.
 *
 * @returns { scheduledAt: Date } on success, or { error: string }.
 */
export async function requestAccountDeletion(): Promise<
  { scheduledAt: Date; error: null } | { scheduledAt: null; error: string }
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { scheduledAt: null, error: "You must be signed in." };
  }

  const { data, error } = await supabase.rpc("request_account_deletion");
  if (error || data == null) {
    return {
      scheduledAt: null,
      error: friendlyRpcError(
        error?.message ?? "",
        "We could not schedule your account for deletion.",
      ),
    };
  }

  return { scheduledAt: new Date(data as string), error: null };
}

/**
 * Cancels a pending deletion request (within the 30-day grace period).
 * Returns null on success, an error message string on failure.
 */
export async function cancelAccountDeletion(): Promise<string | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return "You must be signed in.";

  const { error } = await supabase.rpc("cancel_account_deletion");
  if (error) {
    return friendlyRpcError(error.message, "We could not cancel the deletion request.");
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// Password change
// ──────────────────────────────────────────────────────────────

/**
 * Sends a password-reset email to the signed-in user's address.
 * Works for email/password accounts; OAuth accounts will receive
 * a graceful error from Supabase.
 */
export async function sendPasswordResetEmail(email: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  });
  if (error) return friendlyRpcError(error.message, "We could not send the password reset email.");
  return null;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function friendlyRpcError(raw: string, fallback: string): string {
  if (!raw) return fallback;
  // Strip Postgres "ERROR:" prefix that Supabase surfaces
  const cleaned = raw.replace(/^ERROR:\s*/i, "").trim();
  return cleaned || fallback;
}
