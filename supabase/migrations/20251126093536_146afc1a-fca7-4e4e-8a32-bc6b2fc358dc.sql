-- Disable RLS on profiles and user_roles since we're using custom backend auth
-- These tables are queried by admin pages which check userRole in the frontend
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;