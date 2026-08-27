create table if not exists public.roommate_listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  is_looking_enabled boolean not null default true,
  is_listing_enabled boolean not null default false,
  visibility text not null default 'campus_only' check (visibility in ('public', 'campus_only', 'hidden')),
  paused boolean not null default false,
  budget_min integer not null default 5000,
  budget_max integer not null default 15000,
  move_in_date date,
  room_type text,
  occupancy text,
  food text,
  smoking text,
  alcohol text,
  visitors text,
  sleep_schedule text,
  study_style text,
  cleanliness text,
  religion_preference text,
  gender_preference text,
  area_preference text,
  about text,
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  age integer,
  daily_routine text,
  photo_urls text[] not null default '{}',
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  receive_requests boolean not null default true,
  receive_chats boolean not null default true,
  display_name text,
  avatar_url text,
  course text,
  college text,
  branch text,
  semester text,
  gender text,
  campus text,
  current_address text,
  recently_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.roommate_listings
  add column if not exists is_looking_enabled boolean not null default true,
  add column if not exists is_listing_enabled boolean not null default false,
  add column if not exists visibility text not null default 'campus_only',
  add column if not exists paused boolean not null default false,
  add column if not exists budget_min integer not null default 5000,
  add column if not exists budget_max integer not null default 15000,
  add column if not exists move_in_date date,
  add column if not exists room_type text,
  add column if not exists occupancy text,
  add column if not exists food text,
  add column if not exists smoking text,
  add column if not exists alcohol text,
  add column if not exists visitors text,
  add column if not exists sleep_schedule text,
  add column if not exists study_style text,
  add column if not exists cleanliness text,
  add column if not exists religion_preference text,
  add column if not exists gender_preference text,
  add column if not exists area_preference text,
  add column if not exists about text,
  add column if not exists languages text[] not null default '{}',
  add column if not exists interests text[] not null default '{}',
  add column if not exists age integer,
  add column if not exists daily_routine text,
  add column if not exists photo_urls text[] not null default '{}',
  add column if not exists verification_status text not null default 'pending',
  add column if not exists receive_requests boolean not null default true,
  add column if not exists receive_chats boolean not null default true,
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists course text,
  add column if not exists college text,
  add column if not exists branch text,
  add column if not exists semester text,
  add column if not exists gender text,
  add column if not exists campus text,
  add column if not exists current_address text,
  add column if not exists recently_active_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.roommate_listings enable row level security;

create policy "Visible roommate listings can be read"
on public.roommate_listings
for select
using (
  auth.uid() = user_id
  or (
    is_listing_enabled = true
    and paused = false
    and visibility in ('public', 'campus_only')
  )
);

create policy "Users can insert their roommate listing"
on public.roommate_listings
for insert
with check (auth.uid() = user_id);

create policy "Users can update their roommate listing"
on public.roommate_listings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their roommate listing"
on public.roommate_listings
for delete
using (auth.uid() = user_id);

create table if not exists public.roommate_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.roommate_listings(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  message text,
  created_at timestamptz not null default now()
);

alter table public.roommate_requests enable row level security;

create policy "Users can create roommate requests"
on public.roommate_requests
for insert
with check (auth.uid() = requester_id);

create policy "Roommate requests are visible to both sides"
on public.roommate_requests
for select
using (auth.uid() = requester_id or auth.uid() = owner_id);

create policy "Owners can update roommate request status"
on public.roommate_requests
for update
using (auth.uid() = owner_id or auth.uid() = requester_id)
with check (auth.uid() = owner_id or auth.uid() = requester_id);

create table if not exists public.roommate_saved_profiles (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.roommate_listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(listing_id, user_id)
);

alter table public.roommate_saved_profiles enable row level security;

create policy "Users manage their saved roommate profiles"
on public.roommate_saved_profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.roommate_visit_schedules (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.roommate_listings(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  visit_at timestamptz,
  note text,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.roommate_visit_schedules enable row level security;

create policy "Users can create visit schedules"
on public.roommate_visit_schedules
for insert
with check (auth.uid() = requester_id);

create policy "Visit schedules are visible to both sides"
on public.roommate_visit_schedules
for select
using (auth.uid() = requester_id or auth.uid() = owner_id);

create policy "Visit schedules can be updated by both sides"
on public.roommate_visit_schedules
for update
using (auth.uid() = requester_id or auth.uid() = owner_id)
with check (auth.uid() = requester_id or auth.uid() = owner_id);

create table if not exists public.roommate_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.roommate_listings(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.roommate_messages enable row level security;

create policy "Users can send roommate messages"

ALTER TABLE public.roommate_listings
  ADD COLUMN IF NOT EXISTS housing_type text,
  ADD COLUMN IF NOT EXISTS pets text,
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS instagram_handle text,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_age_min integer,
  ADD COLUMN IF NOT EXISTS preferred_age_max integer;

CREATE TABLE IF NOT EXISTS public.roommate_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE public.roommate_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY \
Users
manage
their
blocks\ ON public.roommate_blocks FOR ALL USING (auth.uid() = blocker_id);

CREATE TABLE IF NOT EXISTS public.roommate_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_listing_id uuid NOT NULL REFERENCES public.roommate_listings(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roommate_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY \Users
can
insert
reports\ ON public.roommate_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE TABLE IF NOT EXISTS public.roommate_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  reference_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roommate_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY \Users
can
read
own
notifications\ ON public.roommate_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY \Users
can
update
own
notifications\ ON public.roommate_notifications FOR UPDATE USING (auth.uid() = user_id);

