export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  used: boolean;
}

export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  due_date: string;
  is_paid: boolean;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Income {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  is_recurring: boolean;
  is_received: boolean;
  next_date?: string;
  date_received?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DashSession {
  id: string;
  user_id: string;
  start_time: Date;
  end_time?: Date;
  total_hours?: number;
  total_earnings: number;
  total_deliveries: number;
  miles_driven?: number;
  gas_cost?: number;
  tips_cash: number;
  tips_app: number;
  base_pay: number;
  promotions: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DashExpense {
  id: string;
  user_id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  receipt_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MaintenanceTask {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  frequency: 'weekly' | 'monthly' | 'seasonal';
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  last_completed_at?: Date;
  next_due_date?: string;
  is_active: boolean;
  reminder_days_before: number;
  is_custom: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MaintenanceHistory {
  id: string;
  task_id: string;
  user_id: string;
  completed_at: Date;
  notes?: string;
  created_at: Date;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  bills_enabled: boolean;
  doordash_enabled: boolean;
  home_maintenance_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}
