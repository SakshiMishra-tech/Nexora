-- ============================================================
-- Nexora Lost & Found — Foundation Fix Migration
-- Fixes type/status/contact_preference CHECK constraints,
-- column name alias, storage bucket, and RLS policies so that
-- the frontend (which sends UPPERCASE values) works correctly.
--
-- Safe to re-run: uses IF EXISTS / ON CONFLICT throughout.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. ADD occurred_at COLUMN if it doesn't exist yet
--    (original schema used date_time; service uses occurred_at)
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lost_found_items'
      AND column_name = 'occurred_at'
  ) THEN
    -- Copy date_time values into new occurred_at column
    ALTER TABLE public.lost_found_items ADD COLUMN occurred_at TIMESTAMPTZ;
    UPDATE public.lost_found_items SET occurred_at = date_time WHERE occurred_at IS NULL;
    ALTER TABLE public.lost_found_items ALTER COLUMN occurred_at SET NOT NULL;
    ALTER TABLE public.lost_found_items ALTER COLUMN occurred_at SET DEFAULT now();
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────
-- 2. FIX type CHECK — allow both lowercase and UPPERCASE
--    Frontend sends UPPERCASE (LOST/FOUND); DB had lowercase only.
--    We keep UPPERCASE as the canonical form going forward and
--    migrate existing lowercase data.
-- ────────────────────────────────────────────────────────────

-- Migrate any existing lowercase data to UPPERCASE first
UPDATE public.lost_found_items
SET type = UPPER(type)
WHERE type IN ('lost', 'found');

-- Drop old constraint (may be named differently depending on Postgres version)
ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_type_check;

-- Re-add: UPPERCASE canonical values only
ALTER TABLE public.lost_found_items
  ADD CONSTRAINT lost_found_items_type_check
  CHECK (type IN ('LOST', 'FOUND'));

-- ────────────────────────────────────────────────────────────
-- 3. FIX status CHECK — support UPPERCASE + all needed states
--    Original: ('active','recovered') — lowercase only
--    Drafts migration: ('active','recovered','returned','draft','resolved')
--    Frontend sends: ACTIVE, DRAFT, RECOVERED, RESOLVED — UPPERCASE
-- ────────────────────────────────────────────────────────────

-- Migrate existing lowercase status values to UPPERCASE
UPDATE public.lost_found_items
SET status = UPPER(status)
WHERE status IN ('active', 'recovered', 'returned', 'draft', 'resolved');

-- Drop all previous status constraints
ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_status_check;

-- Re-add: UPPERCASE canonical values only
-- RECOVERED = a lost item was found by someone
-- RESOLVED  = a found item was claimed / case closed
ALTER TABLE public.lost_found_items
  ADD CONSTRAINT lost_found_items_status_check
  CHECK (status IN ('ACTIVE', 'DRAFT', 'RECOVERED', 'RESOLVED'));

-- ────────────────────────────────────────────────────────────
-- 4. FIX contact_preference
--    Original default was 'Message me on Nexora' (a full string).
--    Frontend now stores comma-separated tokens: 'message', 'call', 'whatsapp'.
--    We migrate old full-string defaults to 'message' token.
-- ────────────────────────────────────────────────────────────

-- Migrate old verbose default values to the token form
UPDATE public.lost_found_items
SET contact_preference = 'message'
WHERE contact_preference IN (
  'Message me on Nexora',
  'message on nexora',
  'Message on Nexora',
  ''
);

-- Update the column default to match frontend convention
ALTER TABLE public.lost_found_items
  ALTER COLUMN contact_preference SET DEFAULT 'message';

-- NOTE: We intentionally do NOT add a CHECK constraint on contact_preference
-- because it's a free-form comma-separated list (e.g. 'message,call,whatsapp')
-- and a CHECK would need a regex which is fragile. The service validates this client-side.

-- ────────────────────────────────────────────────────────────
-- 5. FIX item_name / description / location CHECK constraints
--    Original constraints check char_length >= N which breaks for
--    DRAFT rows (which may have empty strings). We relax for DRAFT.
-- ────────────────────────────────────────────────────────────

-- Drop existing min-length constraints
ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_item_name_check;
ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_description_check;
ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_location_check;

-- Drop any max-length constraints from previous migration
ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_name_length;
ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_desc_length;
ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_loc_length;

-- Re-add: min-length only applies to ACTIVE posts (drafts can be partial)
-- and max-length always applies
ALTER TABLE public.lost_found_items
  ADD CONSTRAINT lost_found_items_item_name_check
  CHECK (
    (status = 'DRAFT' OR char_length(trim(item_name)) >= 2)
    AND char_length(item_name) <= 100
  );

ALTER TABLE public.lost_found_items
  ADD CONSTRAINT lost_found_items_description_check
  CHECK (
    (status = 'DRAFT' OR char_length(trim(description)) >= 5)
    AND char_length(description) <= 500
  );

ALTER TABLE public.lost_found_items
  ADD CONSTRAINT lost_found_items_location_check
  CHECK (
    (status = 'DRAFT' OR char_length(trim(location)) >= 2)
    AND char_length(location) <= 150
  );

-- ────────────────────────────────────────────────────────────
-- 6. FIX RLS POLICIES
--    Old SELECT policy used status = 'active' (lowercase).
--    Now status is stored UPPERCASE, so old policy allowed nothing.
-- ────────────────────────────────────────────────────────────

-- Drop all existing Lost & Found policies
DROP POLICY IF EXISTS "Active lost found posts are readable"       ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can read their own lost found posts"  ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can create lost found posts"          ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can update their own lost found posts" ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can delete their own lost found posts" ON public.lost_found_items;

-- Public feed: anyone can see ACTIVE posts (no draft/resolved leakage)
CREATE POLICY "Active lost found posts are readable"
  ON public.lost_found_items FOR SELECT
  USING (status = 'ACTIVE');

-- Owners can always read all their own posts (including drafts/resolved)
CREATE POLICY "Users can read their own lost found posts"
  ON public.lost_found_items FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can create posts for themselves only
CREATE POLICY "Users can create lost found posts"
  ON public.lost_found_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owners can update only their own posts
CREATE POLICY "Users can update their own lost found posts"
  ON public.lost_found_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Owners can delete only their own posts
CREATE POLICY "Users can delete their own lost found posts"
  ON public.lost_found_items FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- 7. FIX STORAGE BUCKET
--    Original migration created 'lost-found-images' bucket.
--    Service code uses 'lost-found' bucket.
--    Create the correct bucket and update storage policies.
-- ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('lost-found', 'lost-found', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS for the correct bucket name
DROP POLICY IF EXISTS "Public access to lost found images"              ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload lost found images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own lost found images"     ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own lost found images"     ON storage.objects;

-- Also clean up any stale policies for the old bucket name
DROP POLICY IF EXISTS "Public access lost-found-images"              ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload lost-found-images"       ON storage.objects;

CREATE POLICY "Public access to lost found images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lost-found');

CREATE POLICY "Authenticated users can upload lost found images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lost-found' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own lost found images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'lost-found' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own lost found images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'lost-found' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ────────────────────────────────────────────────────────────
-- 8. ADD USEFUL INDEXES if they don't exist
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS lost_found_items_occurred_at_idx
  ON public.lost_found_items (occurred_at DESC);

-- Full-text search helper (for ilike queries on item_name + description)
CREATE INDEX IF NOT EXISTS lost_found_items_item_name_idx
  ON public.lost_found_items USING gin(to_tsvector('english', item_name));

-- ────────────────────────────────────────────────────────────
-- Verification: Show final state
-- ────────────────────────────────────────────────────────────
DO $$
DECLARE
  col_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'lost_found_items';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'lost_found_items';

  RAISE NOTICE 'lost_found_items: % columns, % RLS policies', col_count, policy_count;
END $$;
