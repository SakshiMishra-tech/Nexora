-- Campus Connect Foundation Migration
-- Creates the core schema, policies, and storage for the Campus Connect module.

-- 1. dating_profiles
CREATE TABLE public.dating_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age integer not null check (age >= 17),
  age_preference_min integer not null default 18,
  age_preference_max integer not null default 26,
  gender text not null,
  interested_in text not null,
  college text,
  campus text,
  department text,
  course text,
  year text,
  bio text,
  height text,
  languages text,
  relationship_goal text,
  looking_for text[] default '{}',
  interests text[] default '{}',
  favorite_spot text,
  instagram text,
  spotify text,
  photos text[] default '{}',
  primary_photo text,
  hide_department boolean not null default false,
  hide_course boolean not null default false,
  hide_year boolean not null default false,
  hide_online boolean not null default false,
  hide_distance boolean not null default false,
  hide_instagram boolean not null default true,
  pause_discover boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. dating_swipes
CREATE TABLE public.dating_swipes (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('like', 'pass', 'save')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint dating_swipes_no_self_swipe check (sender_id != receiver_id),
  constraint dating_swipes_unique_pair unique (sender_id, receiver_id)
);

-- 3. dating_matches
CREATE TABLE public.dating_matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references auth.users(id) on delete cascade,
  user2_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unmatched_at timestamp with time zone,
  constraint dating_matches_order check (user1_id < user2_id),
  constraint dating_matches_unique unique (user1_id, user2_id)
);

-- 4. dating_messages
CREATE TABLE public.dating_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.dating_matches(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. dating_reports
CREATE TABLE public.dating_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint dating_reports_no_self_report check (reporter_id != reported_id)
);

-- STORAGE BUCKET: dating_photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dating_photos', 'dating_photos', true)
ON CONFLICT (id) DO NOTHING;

-- INDEXES
CREATE INDEX dating_profiles_campus_idx ON public.dating_profiles(campus);
CREATE INDEX dating_profiles_discovery_idx ON public.dating_profiles(gender, interested_in, age, pause_discover);
CREATE INDEX dating_swipes_receiver_idx ON public.dating_swipes(receiver_id);
CREATE INDEX dating_matches_user1_idx ON public.dating_matches(user1_id);
CREATE INDEX dating_matches_user2_idx ON public.dating_matches(user2_id);
CREATE INDEX dating_messages_match_idx ON public.dating_messages(match_id);
CREATE INDEX dating_messages_created_at_idx ON public.dating_messages(created_at);

-- RLS
ALTER TABLE public.dating_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_reports ENABLE ROW LEVEL SECURITY;

-- dating_profiles policies
CREATE POLICY "Users can view active dating profiles" 
  ON public.dating_profiles FOR SELECT 
  USING (pause_discover = false OR auth.uid() = id);

CREATE POLICY "Users can manage their own dating profile" 
  ON public.dating_profiles FOR ALL 
  USING (auth.uid() = id);

-- dating_swipes policies
CREATE POLICY "Users can manage their own sent swipes" 
  ON public.dating_swipes FOR ALL 
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view swipes received"
  ON public.dating_swipes FOR SELECT
  USING (auth.uid() = receiver_id);

-- dating_matches policies
CREATE POLICY "Users can view their own matches" 
  ON public.dating_matches FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- dating_messages policies
CREATE POLICY "Users can view messages in their matches" 
  ON public.dating_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.dating_matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages to their matches" 
  ON public.dating_messages FOR INSERT 
  WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (
      SELECT 1 FROM public.dating_matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can update read_at of received messages" 
  ON public.dating_messages FOR UPDATE 
  USING (
    sender_id != auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.dating_matches m 
      WHERE m.id = match_id 
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- dating_reports policies
CREATE POLICY "Users can view their own submitted reports" 
  ON public.dating_reports FOR SELECT 
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can submit reports" 
  ON public.dating_reports FOR INSERT 
  WITH CHECK (auth.uid() = reporter_id);


-- STORAGE POLICIES
CREATE POLICY "Dating photos are publicly accessible." 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'dating_photos');

CREATE POLICY "Users can upload their own dating photos." 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'dating_photos' AND auth.uid() = owner);

CREATE POLICY "Users can update their own dating photos." 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'dating_photos' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own dating photos." 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'dating_photos' AND auth.uid() = owner);

-- Update timestamp trigger for dating_profiles
CREATE OR REPLACE FUNCTION update_dating_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_dating_profiles_modtime
    BEFORE UPDATE ON public.dating_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_dating_profiles_updated_at();
