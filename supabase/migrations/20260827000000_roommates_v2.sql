-- ============================================================
-- Nexora Roommates v2 — Schema Migration
-- Migration: 20260827000000_roommates_v2.sql
-- ============================================================

-- ── 1. ADD COLUMNS TO roommate_listings ──────────────────────

ALTER TABLE public.roommate_listings
  ADD COLUMN IF NOT EXISTS housing_type text,
  ADD COLUMN IF NOT EXISTS amenities text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS working_professional boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pets text;

-- ── 2. DROP UNUSED TABLES ─────────────────────────────────────

-- Visit scheduling replaced by messaging
DROP TABLE IF EXISTS public.roommate_visit_schedules;

-- Old primitive message table replaced by marketplace chat system
DROP TABLE IF EXISTS public.roommate_messages;

-- ── 3. CREATE roommate_blocks ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.roommate_blocks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.roommate_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roommate blocks: users manage their own"
  ON public.roommate_blocks FOR ALL
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

CREATE INDEX IF NOT EXISTS idx_rmblocks_blocker ON public.roommate_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_rmblocks_blocked ON public.roommate_blocks (blocked_id);

-- ── 4. CREATE roommate_reports ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.roommate_reports (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_listing_id uuid NOT NULL REFERENCES public.roommate_listings(id) ON DELETE CASCADE,
  reason              text NOT NULL CHECK (reason IN (
    'Fake Profile', 'Inappropriate Content', 'Spam', 'Scam', 'Other'
  )),
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, reported_listing_id)
);

ALTER TABLE public.roommate_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roommate reports: users can create"
  ON public.roommate_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Roommate reports: users see own"
  ON public.roommate_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE INDEX IF NOT EXISTS idx_rmreports_reporter ON public.roommate_reports (reporter_id);

-- ── 5. CREATE roommate_notifications ─────────────────────────

CREATE TABLE IF NOT EXISTS public.roommate_notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN (
    'request_received', 'request_accepted', 'request_declined'
  )),
  reference_id uuid,
  seen         boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roommate_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roommate notifications: users manage own"
  ON public.roommate_notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rmnot_user_seen ON public.roommate_notifications (user_id, seen);

-- ── 6. PERFORMANCE INDEXES ────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_rl_campus    ON public.roommate_listings (campus);
CREATE INDEX IF NOT EXISTS idx_rl_budget    ON public.roommate_listings (budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_rl_active    ON public.roommate_listings (is_listing_enabled, paused, visibility);
CREATE INDEX IF NOT EXISTS idx_rl_move_in   ON public.roommate_listings (move_in_date);
CREATE INDEX IF NOT EXISTS idx_rl_user_id   ON public.roommate_listings (user_id);
CREATE INDEX IF NOT EXISTS idx_rr_requester ON public.roommate_requests (requester_id);
CREATE INDEX IF NOT EXISTS idx_rr_owner     ON public.roommate_requests (owner_id);
CREATE INDEX IF NOT EXISTS idx_rr_status    ON public.roommate_requests (status);

-- ── 7. ENABLE REALTIME ────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.roommate_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.roommate_notifications;
