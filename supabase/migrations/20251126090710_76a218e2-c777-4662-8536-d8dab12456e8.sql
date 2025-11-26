-- These auth tables are only accessed by the trusted backend via a direct Postgres connection,
-- so we disable RLS on them to avoid blocking internal operations.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_passwords DISABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens DISABLE ROW LEVEL SECURITY;