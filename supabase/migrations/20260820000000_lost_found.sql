-- ============================================================
-- Nexora Lost & Found
-- Creates the real Lost & Found table, storage bucket, and RLS.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.lost_found_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type               TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  item_name          TEXT NOT NULL CHECK (char_length(trim(item_name)) >= 2),
  category           TEXT NOT NULL,
  description        TEXT NOT NULL CHECK (char_length(trim(description)) >= 5),
  location           TEXT NOT NULL CHECK (char_length(trim(location)) >= 2),
  campus             TEXT NOT NULL,
  date_time          TIMESTAMPTZ NOT NULL,
  image_url          TEXT,
  contact_preference TEXT NOT NULL DEFAULT 'Message me on Nexora',
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'recovered')),
  poster_name        TEXT NOT NULL DEFAULT 'Student',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lost_found_items_status_created_idx
  ON public.lost_found_items (status, created_at DESC);

CREATE INDEX IF NOT EXISTS lost_found_items_user_created_idx
  ON public.lost_found_items (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS lost_found_items_type_idx
  ON public.lost_found_items (type);

CREATE INDEX IF NOT EXISTS lost_found_items_category_idx
  ON public.lost_found_items (category);

CREATE INDEX IF NOT EXISTS lost_found_items_campus_idx
  ON public.lost_found_items (campus);

CREATE OR REPLACE FUNCTION public.update_lost_found_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lost_found_items_updated_at ON public.lost_found_items;
CREATE TRIGGER lost_found_items_updated_at
  BEFORE UPDATE ON public.lost_found_items
  FOR EACH ROW EXECUTE FUNCTION public.update_lost_found_items_updated_at();

ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active lost found posts are readable" ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can read their own lost found posts" ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can create lost found posts" ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can update their own lost found posts" ON public.lost_found_items;
DROP POLICY IF EXISTS "Users can delete their own lost found posts" ON public.lost_found_items;

CREATE POLICY "Active lost found posts are readable"
  ON public.lost_found_items FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can read their own lost found posts"
  ON public.lost_found_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create lost found posts"
  ON public.lost_found_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lost found posts"
  ON public.lost_found_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lost found posts"
  ON public.lost_found_items FOR DELETE
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('lost-found-images', 'lost-found-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public access to lost found images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload lost found images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own lost found images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own lost found images" ON storage.objects;

CREATE POLICY "Public access to lost found images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lost-found-images');

CREATE POLICY "Authenticated users can upload lost found images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'lost-found-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own lost found images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'lost-found-images' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own lost found images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'lost-found-images' AND auth.uid() = owner);
