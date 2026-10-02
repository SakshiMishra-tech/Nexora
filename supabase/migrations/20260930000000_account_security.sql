-- ============================================================
-- Account Security Migration
-- Adds account deactivation state and scheduled deletion
-- request tracking to the profiles table.
--
-- Permanent deletion is performed exclusively by a server-side
-- Supabase Edge Function (process-account-deletions) using the
-- service role key.  Clients are never permitted to set
-- scheduled_deletion_at or mark is_deleted themselves.
-- ============================================================

-- 1. Extend profiles with account-state columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_deactivated       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deactivated_at        timestamptz,
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_deletion_at timestamptz;

-- 2. Index so the deletion worker can efficiently find due rows
CREATE INDEX IF NOT EXISTS profiles_scheduled_deletion_idx
  ON public.profiles (scheduled_deletion_at)
  WHERE scheduled_deletion_at IS NOT NULL;

-- 3. Index for fast deactivation queries across modules
CREATE INDEX IF NOT EXISTS profiles_deactivated_idx
  ON public.profiles (is_deactivated)
  WHERE is_deactivated = true;

-- ============================================================
-- RLS Policy additions for profiles
-- ============================================================

-- Drop and recreate the self-read policy to ensure it exists:
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Other users may read basic profile info only for active accounts
DROP POLICY IF EXISTS "Active profiles visible to authenticated users" ON public.profiles;
CREATE POLICY "Active profiles visible to authenticated users"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND auth.uid() != id
    AND is_deactivated = false
    AND scheduled_deletion_at IS NULL
  );

-- ============================================================
-- Stored procedures for account state transitions
-- ============================================================

-- 4a. Deactivate the calling user's account
CREATE OR REPLACE FUNCTION public.deactivate_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND scheduled_deletion_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Account deletion is already scheduled. Cancel the deletion request first.';
  END IF;

  UPDATE public.profiles
  SET
    is_deactivated  = true,
    deactivated_at  = now()
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;
END;
$$;

-- 4b. Reactivate the calling user's account
CREATE OR REPLACE FUNCTION public.reactivate_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET
    is_deactivated = false,
    deactivated_at = NULL
  WHERE id = auth.uid()
    AND scheduled_deletion_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cannot reactivate: account may have a pending deletion or profile was not found.';
  END IF;
END;
$$;

-- 4c. Request account deletion (sets a 30-day grace period).
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scheduled timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT scheduled_deletion_at INTO v_scheduled
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_scheduled IS NOT NULL THEN
    RETURN v_scheduled;
  END IF;

  v_scheduled := now() + INTERVAL '30 days';

  UPDATE public.profiles
  SET
    deletion_requested_at = now(),
    scheduled_deletion_at = v_scheduled,
    is_deactivated        = true,
    deactivated_at        = COALESCE(deactivated_at, now())
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  RETURN v_scheduled;
END;
$$;

-- 4d. Cancel a pending deletion request (within the grace period).
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND scheduled_deletion_at IS NOT NULL
      AND scheduled_deletion_at > now()
  ) THEN
    RAISE EXCEPTION 'No active deletion request found, or the grace period has already expired.';
  END IF;

  UPDATE public.profiles
  SET
    deletion_requested_at = NULL,
    scheduled_deletion_at = NULL,
    is_deactivated        = false,
    deactivated_at        = NULL
  WHERE id = auth.uid();
END;
$$;

-- 5. Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.deactivate_my_account()    TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_my_account()    TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_account_deletion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion()  TO authenticated;
