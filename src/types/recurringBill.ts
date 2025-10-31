export interface RecurringBill {
  id: string;
  name: string;
  amount?: number;
  category: string;
  due_day?: number;
  created_at: string;
  updated_at: string;
}

export const RECURRING_BILL_CATEGORIES = [
  'Utilities',
  'Rent/Mortgage', 
  'Insurance',
  'Credit Card',
  'Subscription',
  'Phone',
  'Internet',
  'Other'
] as const;

export type RecurringBillCategory = typeof RECURRING_BILL_CATEGORIES[number];
