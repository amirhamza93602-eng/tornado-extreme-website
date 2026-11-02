-- Run this in Supabase Dashboard > SQL Editor.
-- Adds the new profile fields and allows approved player cards to be listed. Players can edit only their own permitted profile fields.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS device_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cobeg_profile_url TEXT;
-- Role and approval_status remain controlled by the secure RPC functions.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved player profiles" ON public.profiles;
CREATE POLICY "Public can view approved player profiles"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (approval_status = 'approved');

DROP POLICY IF EXISTS "Players can update own editable profile fields" ON public.profiles;
CREATE POLICY "Players can update own editable profile fields"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT UPDATE (bio, avatar_url, facebook_url, device_name) ON public.profiles TO authenticated;

-- Do not grant table-wide UPDATE to authenticated users.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (bio, avatar_url, facebook_url, device_name) ON public.profiles TO authenticated;
