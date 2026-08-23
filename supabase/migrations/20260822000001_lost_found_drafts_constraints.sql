-- Migration to support drafts and add validation constraints for lost_found_items

DO $$
BEGIN
  -- We assume 'status' is a TEXT column with a CHECK constraint.
  -- We'll drop the existing status constraint if it exists (we might not know its exact name, 
  -- but typically it's named something like lost_found_items_status_check).
  
  -- 1. Remove existing constraint if we know it (Supabase often names it table_column_check)
  ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_status_check;
  
  -- 2. Add the new constraint supporting 'draft'
  ALTER TABLE public.lost_found_items ADD CONSTRAINT lost_found_items_status_check
    CHECK (status IN ('active', 'recovered', 'returned', 'draft', 'resolved'));

  -- 3. Add max length constraints
  ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_name_length;
  ALTER TABLE public.lost_found_items ADD CONSTRAINT lost_found_items_name_length
    CHECK (char_length(item_name) <= 100);

  ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_desc_length;
  ALTER TABLE public.lost_found_items ADD CONSTRAINT lost_found_items_desc_length
    CHECK (char_length(description) <= 500);

  ALTER TABLE public.lost_found_items DROP CONSTRAINT IF EXISTS lost_found_items_loc_length;
  ALTER TABLE public.lost_found_items ADD CONSTRAINT lost_found_items_loc_length
    CHECK (char_length(location) <= 150);

END $$;
