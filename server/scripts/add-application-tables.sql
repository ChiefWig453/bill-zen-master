-- Add Application Tables to Existing PostgreSQL Database
-- This script adds only the application data tables (not auth tables)
-- Run: psql -h your-host -U your-user -d your-database -f server/scripts/add-application-tables.sql

\echo 'Adding application tables to existing database...'
\echo ''

-- User Preferences Table (if not exists)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  bills_enabled BOOLEAN DEFAULT TRUE,
  doordash_enabled BOOLEAN DEFAULT FALSE,
  home_maintenance_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

\echo '✓ user_preferences table created'

-- Bills Table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  due_date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

\echo '✓ bills table created'

-- Bill Templates Table
CREATE TABLE IF NOT EXISTS bill_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC,
  category TEXT NOT NULL,
  due_day INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

\echo '✓ bill_templates table created'

-- Incomes Table
CREATE TABLE IF NOT EXISTS incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  is_received BOOLEAN DEFAULT FALSE,
  date_received DATE,
  next_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

\echo '✓ incomes table created'

-- DoorDash Sessions Table
CREATE TABLE IF NOT EXISTS dash_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  total_hours NUMERIC,
  total_earnings NUMERIC DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  miles_driven NUMERIC,
  gas_cost NUMERIC,
  tips_cash NUMERIC DEFAULT 0,
  tips_app NUMERIC DEFAULT 0,
  base_pay NUMERIC DEFAULT 0,
  promotions NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

\echo '✓ dash_sessions table created'

-- DoorDash Expenses Table
CREATE TABLE IF NOT EXISTS dash_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

\echo '✓ dash_expenses table created'

-- Maintenance Tasks Table
CREATE TABLE IF NOT EXISTS maintenance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL,
  season TEXT,
  last_completed_at TIMESTAMP WITH TIME ZONE,
  next_due_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  reminder_days_before INTEGER DEFAULT 3,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

\echo '✓ maintenance_tasks table created'

-- Maintenance History Table
CREATE TABLE IF NOT EXISTS maintenance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  user_id UUID NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

\echo '✓ maintenance_history table created'

-- Create Indexes
\echo ''
\echo 'Creating indexes...'

CREATE INDEX IF NOT EXISTS idx_bills_user_id ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_dash_sessions_user_id ON dash_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dash_expenses_user_id ON dash_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tasks_user_id ON maintenance_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_task_id ON maintenance_history(task_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_user_id ON maintenance_history(user_id);

\echo '✓ Indexes created'

-- Create Triggers for updated_at
\echo ''
\echo 'Creating triggers...'

-- Trigger for user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
  BEFORE UPDATE ON user_preferences 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bills
DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
CREATE TRIGGER update_bills_updated_at 
  BEFORE UPDATE ON bills 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for bill_templates
DROP TRIGGER IF EXISTS update_bill_templates_updated_at ON bill_templates;
CREATE TRIGGER update_bill_templates_updated_at 
  BEFORE UPDATE ON bill_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for incomes
DROP TRIGGER IF EXISTS update_incomes_updated_at ON incomes;
CREATE TRIGGER update_incomes_updated_at 
  BEFORE UPDATE ON incomes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for dash_sessions
DROP TRIGGER IF EXISTS update_dash_sessions_updated_at ON dash_sessions;
CREATE TRIGGER update_dash_sessions_updated_at 
  BEFORE UPDATE ON dash_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for dash_expenses
DROP TRIGGER IF EXISTS update_dash_expenses_updated_at ON dash_expenses;
CREATE TRIGGER update_dash_expenses_updated_at 
  BEFORE UPDATE ON dash_expenses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for maintenance_tasks
DROP TRIGGER IF EXISTS update_maintenance_tasks_updated_at ON maintenance_tasks;
CREATE TRIGGER update_maintenance_tasks_updated_at 
  BEFORE UPDATE ON maintenance_tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

\echo '✓ Triggers created'

-- Create business logic triggers
\echo ''
\echo 'Creating business logic triggers...'

-- Trigger to calculate next income date
DROP TRIGGER IF EXISTS calculate_income_next_date ON incomes;
CREATE TRIGGER calculate_income_next_date 
  BEFORE INSERT OR UPDATE ON incomes 
  FOR EACH ROW 
  EXECUTE FUNCTION calculate_next_income_date();

-- Trigger to calculate session hours
DROP TRIGGER IF EXISTS calculate_dash_session_hours ON dash_sessions;
CREATE TRIGGER calculate_dash_session_hours 
  BEFORE UPDATE ON dash_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION calculate_session_hours();

-- Trigger to calculate next maintenance date
DROP TRIGGER IF EXISTS calculate_maintenance_next_date ON maintenance_tasks;
CREATE TRIGGER calculate_maintenance_next_date 
  BEFORE INSERT OR UPDATE ON maintenance_tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION calculate_next_maintenance_date();

\echo '✓ Business logic triggers created'

\echo ''
\echo '========================================='
\echo 'Application tables setup complete!'
\echo '========================================='
\echo ''
\echo 'Tables created:'
\echo '  - user_preferences'
\echo '  - bills'
\echo '  - bill_templates'
\echo '  - incomes'
\echo '  - dash_sessions'
\echo '  - dash_expenses'
\echo '  - maintenance_tasks'
\echo '  - maintenance_history'
\echo ''
\echo 'Next step: Export data from Supabase and import using import-data.sql'
\echo ''
