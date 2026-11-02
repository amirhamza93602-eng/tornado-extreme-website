-- TORNADO EXTREME: targeted repair for COBEG profile saves and intra-club win integrity.
-- Run once in Supabase SQL Editor. Does not touch Overall Stats.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cobeg_profile_url TEXT;

-- The profile page saves this field; the prior grant omitted it.
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (bio, avatar_url, facebook_url, device_name, cobeg_profile_url)
  ON public.profiles TO authenticated;

-- Players must only create pending win submissions. They cannot self-approve.
DROP POLICY IF EXISTS "Approved players submit own wins" ON public.intra_club_wins;
CREATE POLICY "Approved players submit own wins"
ON public.intra_club_wins
FOR INSERT TO authenticated
WITH CHECK (
  player_id = auth.uid()
  AND status = 'pending'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.approval_status = 'approved'
  )
);
