export interface Income {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' | 'annually';
  date_received: string | null;
  next_date: string | null;
  category: string;
  is_recurring: boolean;
  is_received: boolean;
  created_at: string;
  updated_at: string;
}

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Side Hustle',
  'Rental',
  'Royalties',
  'Bonus',
  'Gift',
  'Other'
] as const;

export type IncomeCategory = typeof INCOME_CATEGORIES[number];

export const INCOME_FREQUENCIES = [
  { value: 'one-time', label: 'One-time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annually', label: 'Annually' },
] as const;