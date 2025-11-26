-- Disable RLS on all data tables since we're using custom backend auth
-- Access control is now handled by the backend application layer via JWT
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE bill_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE incomes DISABLE ROW LEVEL SECURITY;
ALTER TABLE dash_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE dash_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_history DISABLE ROW LEVEL SECURITY;

-- Note: profiles, user_roles, and user_preferences already have RLS disabled