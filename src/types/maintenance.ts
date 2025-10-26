export interface MaintenanceTask {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency: 'weekly' | 'monthly' | 'seasonal';
  season: 'spring' | 'summer' | 'fall' | 'winter' | null;
  last_completed_at: string | null;
  next_due_date: string | null;
  is_active: boolean;
  reminder_days_before: number;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceHistory {
  id: string;
  task_id: string;
  user_id: string;
  completed_at: string;
  notes: string | null;
  created_at: string;
}
