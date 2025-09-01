export interface DashSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
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
  created_at: string;
  updated_at: string;
}

export interface DashExpense {
  id: string;
  user_id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DashStats {
  totalEarnings: number;
  totalHours: number;
  totalDeliveries: number;
  averageHourlyRate: number;
  totalExpenses: number;
  netProfit: number;
}