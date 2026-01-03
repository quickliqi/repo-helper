
-- Delete all users from auth.users
-- This will cascade delete to profiles and user_roles via the ON DELETE CASCADE
DELETE FROM auth.users;
