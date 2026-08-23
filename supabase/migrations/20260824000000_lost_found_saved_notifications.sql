-- Create lost_found_saved_posts table
CREATE TABLE IF NOT EXISTS public.lost_found_saved_posts (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- Enable RLS for saved posts
ALTER TABLE public.lost_found_saved_posts ENABLE ROW LEVEL SECURITY;

-- Policies for saved posts
CREATE POLICY "Users can see their saved posts" ON public.lost_found_saved_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save posts" ON public.lost_found_saved_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave posts" ON public.lost_found_saved_posts FOR DELETE USING (auth.uid() = user_id);

-- Create lost_found_notifications table
CREATE TABLE IF NOT EXISTS public.lost_found_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.lost_found_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'contact', 'resolved', 'reopened')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE public.lost_found_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can see their notifications" ON public.lost_found_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.lost_found_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their notifications" ON public.lost_found_notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their notifications" ON public.lost_found_notifications FOR DELETE USING (auth.uid() = user_id);
