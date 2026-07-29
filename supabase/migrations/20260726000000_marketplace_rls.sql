-- Ensure RLS is enabled
ALTER TABLE public.marketplace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- marketplace_categories: Everyone can read; authenticated users can insert/update (for auto-seeding)
CREATE POLICY "Categories are readable by everyone" ON public.marketplace_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert categories" ON public.marketplace_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update categories" ON public.marketplace_categories FOR UPDATE USING (auth.role() = 'authenticated');

-- marketplace_items: 
-- Anyone can read active/available items.
-- Sellers can read their own items (even draft/sold).
CREATE POLICY "Items are readable by everyone if active" ON public.marketplace_items FOR SELECT USING (is_active = true OR auth.uid() = seller_id);

-- Sellers can insert their own items
CREATE POLICY "Sellers can insert items" ON public.marketplace_items FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own items
CREATE POLICY "Sellers can update items" ON public.marketplace_items FOR UPDATE USING (auth.uid() = seller_id);

-- Sellers can delete their own items
CREATE POLICY "Sellers can delete items" ON public.marketplace_items FOR DELETE USING (auth.uid() = seller_id);

-- marketplace_images:
-- Anyone can read images
CREATE POLICY "Images are readable by everyone" ON public.marketplace_images FOR SELECT USING (true);

-- Sellers can manage images for their items
-- We check if the user owns the parent item
CREATE POLICY "Sellers can insert images" ON public.marketplace_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.marketplace_items WHERE id = item_id AND seller_id = auth.uid())
);

CREATE POLICY "Sellers can update images" ON public.marketplace_images FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.marketplace_items WHERE id = item_id AND seller_id = auth.uid())
);

CREATE POLICY "Sellers can delete images" ON public.marketplace_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.marketplace_items WHERE id = item_id AND seller_id = auth.uid())
);

-- saved_items
CREATE POLICY "Users can see their saved items" ON public.saved_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save items" ON public.saved_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave items" ON public.saved_items FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket permissions for marketplace-images
-- (Requires inserting into storage.buckets if not exists, but assuming the bucket exists, we add policies to storage.objects)
BEGIN;
  -- Try to create the bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('marketplace-images', 'marketplace-images', true)
  ON CONFLICT (id) DO NOTHING;
COMMIT;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Public access to marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own marketplace images" ON storage.objects;

-- Storage policies
CREATE POLICY "Public access to marketplace images" ON storage.objects FOR SELECT USING (bucket_id = 'marketplace-images');
CREATE POLICY "Authenticated users can upload marketplace images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'marketplace-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own marketplace images" ON storage.objects FOR UPDATE USING (bucket_id = 'marketplace-images' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own marketplace images" ON storage.objects FOR DELETE USING (bucket_id = 'marketplace-images' AND auth.uid() = owner);
