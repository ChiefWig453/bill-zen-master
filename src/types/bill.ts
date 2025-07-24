export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  isPaid: boolean;
  createdAt: string;
}

export type BillStatus = 'paid' | 'due-soon' | 'overdue' | 'upcoming';

export const BILL_CATEGORIES = [
  'Utilities',
  'Rent/Mortgage',
  'Insurance',
  'Credit Card',
  'Subscription',
  'Phone',
  'Internet',
  'Other'
] as const;

export type BillCategory = typeof BILL_CATEGORIES[number];