-- Migration: 20260828000000_roommates_rls_fixes.sql
-- Description: Fixes RLS loopholes in roommate_requests and syntax errors in other policies

--------------------------------------------------------------------------------
-- 1. Fix roommate_requests Update Flow
--------------------------------------------------------------------------------

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Owners can update roommate request status" ON public.roommate_requests;

-- Allow requesters to only cancel their pending requests
CREATE POLICY "Requesters can cancel requests"
ON public.roommate_requests
FOR UPDATE
USING (auth.uid() = requester_id)
WITH CHECK (auth.uid() = requester_id AND status = 'cancelled');

-- Allow owners to accept or decline the requests
CREATE POLICY "Owners can accept or decline requests"
ON public.roommate_requests
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id AND status IN ('accepted', 'declined'));


--------------------------------------------------------------------------------
-- 2. Fix roommate_messages Policies
--------------------------------------------------------------------------------

-- Drop the dangling/incomplete policy if it exists
DROP POLICY IF EXISTS "Users can send roommate messages" ON public.roommate_messages;
DROP POLICY IF EXISTS "Users can view their messages" ON public.roommate_messages;

-- Create strict insert policy
CREATE POLICY "Users can send roommate messages"
ON public.roommate_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Create strict select policy
CREATE POLICY "Users can view their messages"
ON public.roommate_messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);


--------------------------------------------------------------------------------
-- 3. Safely Re-create Remaining Tables and Policies
-- (In case they failed to create due to syntax errors in previous migration)
--------------------------------------------------------------------------------

-- roommate_blocks
CREATE TABLE IF NOT EXISTS public.roommate_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE public.roommate_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage their blocks" ON public.roommate_blocks;
CREATE POLICY "Users manage their blocks" ON public.roommate_blocks FOR ALL USING (auth.uid() = blocker_id);

-- roommate_reports
CREATE TABLE IF NOT EXISTS public.roommate_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_listing_id uuid NOT NULL REFERENCES public.roommate_listings(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.roommate_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert reports" ON public.roommate_reports;
CREATE POLICY "Users can insert reports" ON public.roommate_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- roommate_notifications
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
DROP POLICY IF EXISTS "Users can read own notifications" ON public.roommate_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.roommate_notifications;
CREATE POLICY "Users can read own notifications" ON public.roommate_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.roommate_notifications FOR UPDATE USING (auth.uid() = user_id);
