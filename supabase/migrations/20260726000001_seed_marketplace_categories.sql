-- ============================================================================
-- Migration: Seed marketplace_categories with default categories
-- Adds missing columns (slug, icon, sort_order, created_at) and inserts
-- the 10 default categories if they don't already exist.
-- ============================================================================

-- 1. Add missing columns to marketplace_categories (safe: IF NOT EXISTS)
ALTER TABLE public.marketplace_categories
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Add a UNIQUE constraint on slug if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.marketplace_categories'::regclass
      AND conname = 'marketplace_categories_slug_key'
  ) THEN
    ALTER TABLE public.marketplace_categories
      ADD CONSTRAINT marketplace_categories_slug_key UNIQUE (slug);
  END IF;
END $$;

-- 3. Insert default categories (skip if name already exists thanks to ON CONFLICT)
INSERT INTO public.marketplace_categories (name, slug, icon, sort_order) VALUES
  ('Books',            'books',            '📚', 1),
  ('Electronics',      'electronics',      '💻', 2),
  ('Hostel Essentials', 'hostel-essentials', '🏠', 3),
  ('Furniture',        'furniture',        '🪑', 4),
  ('Fashion',          'fashion',          '👗', 5),
  ('Sports',           'sports',           '⚽', 6),
  ('Cycles',           'cycles',           '🚲', 7),
  ('Gaming',           'gaming',           '🎮', 8),
  ('Lab Equipment',    'lab-equipment',    '🔬', 9),
  ('Others',           'others',           '📦', 10)
ON CONFLICT (name) DO UPDATE SET
  slug       = EXCLUDED.slug,
  icon       = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- 4. Backfill slug for any rows that have NULL slug (e.g. if categories were
--    previously inserted without it)
UPDATE public.marketplace_categories
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;
