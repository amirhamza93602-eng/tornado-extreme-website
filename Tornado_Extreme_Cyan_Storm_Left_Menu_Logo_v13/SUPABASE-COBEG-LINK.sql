-- COBEG profile linking only. Does not change Overall Stats or tournament data.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cobeg_profile_url TEXT;

-- Players may edit their own COBEG profile link through My Profile.
GRANT UPDATE (cobeg_profile_url) TO authenticated;
-- Approved player profiles are already visible through the existing public roster SELECT policy.
