-- Promote michael.wittinger@gmail.com to PlatformAdmin
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
UPDATE public.profiles
SET role = 'PlatformAdmin'
WHERE email = 'michael.wittinger@gmail.com';

-- If the profile doesn't have an email column populated yet,
-- use the auth.users table to find the ID:
UPDATE public.profiles
SET role = 'PlatformAdmin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'michael.wittinger@gmail.com'
  LIMIT 1
);
